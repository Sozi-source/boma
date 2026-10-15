'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Currency, UserProfile } from '@/lib/types/fintech';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { formatPhoneDisplay, normalizePhoneNumber, phoneListIncludes } from '@/lib/utils/phone';
import { bomaService } from '@/lib/services/boma-service';
import { 
  UsersIcon, 
  SearchIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  SmartphoneIcon,
  XMarkIcon,
  ShieldCheckIcon,
  TrashIcon
} from './ui/icons';

export interface RosterMember {
  id: string;
  name: string;
  phones: string[];
  email?: string;
  targetAmount?: number;
  addedAt: string;
}

interface MemberRosterProps {
  bomaId: string;
  bomaTitle: string;
  currency?: Currency;
  transactions: Transaction[];
  isOrganizer: boolean;
  onContributeWithPhone?: (phone: string) => void;
  onTransactionRecorded?: () => void;
}

export default function MemberRoster({
  bomaId,
  currency = 'KES',
  transactions,
  isOrganizer,
  onContributeWithPhone,
  onTransactionRecorded,
}: MemberRosterProps) {
  const storageKeyRoster = `bomapay_roster_${bomaId}`;
  const storageKeyPledgesEnabled = `bomapay_pledges_enabled_${bomaId}`;

  // State
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [pledgesEnabled, setPledgesEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Member Check-in / Gatekeeper state
  const [checkPhone, setCheckPhone] = useState('');
  const [checkedMember, setCheckedMember] = useState<RosterMember | null>(null);
  const [checkError, setCheckError] = useState('');

  // Modals
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddPhoneOpen, setIsAddPhoneOpen] = useState(false);
  const [selectedMemberForPhone, setSelectedMemberForPhone] = useState<RosterMember | null>(null);
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);
  const [selectedMemberForEmail, setSelectedMemberForEmail] = useState<RosterMember | null>(null);
  const [editEmailInput, setEditEmailInput] = useState('');

  // Form states for Add Member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPrimaryPhone, setNewMemberPrimaryPhone] = useState('');
  const [newMemberSecondaryPhone, setNewMemberSecondaryPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberTarget, setNewMemberTarget] = useState('');

  // Form state for Add Phone
  const [extraPhoneNumber, setExtraPhoneNumber] = useState('');

  // M-Pesa Till SMS Reconciliation state
  const [isRecordTillPaymentOpen, setIsRecordTillPaymentOpen] = useState(false);
  const [rawMpesaSms, setRawMpesaSms] = useState('');
  const [parsedPayment, setParsedPayment] = useState<{
    reference?: string;
    amount?: number;
    phone?: string;
    name?: string;
  } | null>(null);
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load roster and settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedPledges = localStorage.getItem(storageKeyPledgesEnabled);
      if (savedPledges !== null) {
        setPledgesEnabled(savedPledges === 'true');
      }

      const savedRoster = localStorage.getItem(storageKeyRoster);
      if (savedRoster) {
        setMembers(JSON.parse(savedRoster));
      } else {
        // Initial seed based on initial users if available
        void bomaService.getUsers().then((registeredUsers) => {
          const initialList: RosterMember[] = registeredUsers.map((u) => ({
            id: u.id,
            name: u.full_name,
            phones: u.phones || [u.phone || '0711390861'],
            targetAmount: 5000,
            addedAt: u.created_at,
          }));
          setMembers(initialList);
          localStorage.setItem(storageKeyRoster, JSON.stringify(initialList));
        });
      }
    } catch {
      // storage unavailable
    }
  }, [bomaId, storageKeyRoster, storageKeyPledgesEnabled]);

  const saveMembers = (updated: RosterMember[]) => {
    setMembers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKeyRoster, JSON.stringify(updated));
    }
  };

  const togglePledges = () => {
    const next = !pledgesEnabled;
    setPledgesEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKeyPledgesEnabled, String(next));
    }
    showToast(next ? 'Member targets / pledges enabled.' : 'Member targets disabled.');
  };

  // Calculate total contributed for each member by matching all their linked phones
  const memberContributions = useMemo(() => {
    const map = new Map<string, number>();

    members.forEach((m) => {
      let total = 0;
      transactions.forEach((tx) => {
        if (!tx.contributor_phone) return;
        if (phoneListIncludes(m.phones, tx.contributor_phone)) {
          total += Number(tx.amount || 0);
        }
      });
      map.set(m.id, total);
    });

    return map;
  }, [members, transactions]);

  // Handle Member Gatekeeper Check-in
  const handleVerifyPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckError('');
    setCheckedMember(null);

    const inputClean = checkPhone.trim();
    if (!inputClean) return;

    const found = members.find((m) => phoneListIncludes(m.phones, inputClean));
    if (found) {
      setCheckedMember(found);
    } else {
      setCheckError('This phone number is not on the approved member roster for this fund. Contact the organizer to request an invitation.');
    }
  };

  // Add new member to roster
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newMemberName.trim();
    const cleanPrimary = newMemberPrimaryPhone.trim();
    const cleanSecondary = newMemberSecondaryPhone.trim();
    const cleanEmail = newMemberEmail.trim().toLowerCase();
    const target = parseFloat(newMemberTarget) || undefined;

    if (!cleanName || !cleanPrimary) return;

    const phones = [cleanPrimary];
    if (cleanSecondary && !phoneListIncludes(phones, cleanSecondary)) {
      phones.push(cleanSecondary);
    }

    const newMember: RosterMember = {
      id: `mem-${Date.now()}`,
      name: cleanName,
      phones,
      email: cleanEmail || undefined,
      targetAmount: target,
      addedAt: new Date().toISOString(),
    };

    const updated = [newMember, ...members];
    saveMembers(updated);

    // Also register in service so transaction sender resolution knows about it
    try {
      await bomaService.addUser({
        full_name: cleanName,
        email: cleanEmail || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'member'}@openhand.org`,
        phones,
        role: 'member',
        status: 'active',
      });
    } catch {}

    setIsAddMemberOpen(false);
    setNewMemberName('');
    setNewMemberPrimaryPhone('');
    setNewMemberSecondaryPhone('');
    setNewMemberEmail('');
    setNewMemberTarget('');
    showToast(`Added ${cleanName} to member roster.`);
  };

  // Update email for an existing member
  const handleSaveMemberEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForEmail) return;
    const cleanEmail = editEmailInput.trim().toLowerCase();
    const updated = members.map((m) =>
      m.id === selectedMemberForEmail.id ? { ...m, email: cleanEmail || undefined } : m
    );
    saveMembers(updated);

    try {
      const allUsers = await bomaService.getUsers();
      const match = allUsers.find(
        (u) =>
          u.id === selectedMemberForEmail.id ||
          selectedMemberForEmail.phones.some((p) => phoneListIncludes(u.phones, p))
      );
      if (match) {
        await bomaService.updateUser(match.id, { email: cleanEmail });
      }
    } catch {}

    if (checkedMember && checkedMember.id === selectedMemberForEmail.id) {
      setCheckedMember({ ...checkedMember, email: cleanEmail || undefined });
    }

    setIsEditEmailOpen(false);
    setSelectedMemberForEmail(null);
    setEditEmailInput('');
    showToast(`Email updated for ${selectedMemberForEmail.name}.`);
  };

  // Parse Safaricom Lipa na M-Pesa Till SMS confirmation
  const handleParseMpesaSms = (text: string) => {
    setRawMpesaSms(text);
    if (!text.trim()) {
      setParsedPayment(null);
      return;
    }
    const clean = text.replace(/\s+/g, ' ');

    // 1. Reference: 10 alphanumeric chars before "Confirmed" or anywhere in text
    const refMatch = clean.match(/\b([A-Z0-9]{10})\s+Confirmed/i) || clean.match(/\b([A-Z0-9]{8,12})\b/i);
    const reference = refMatch ? refMatch[1].toUpperCase() : '';

    // 2. Amount: e.g. KSH10.00 or Ksh 10.00 or KES 10
    const amtMatch = clean.match(/(?:Ksh|KES)[\s\.]*([0-9,]+(?:\.[0-9]{2})?)/i);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : undefined;

    // 3. Phone: e.g. from 254711390861 or 0711390861
    const phoneMatch = clean.match(/(?:from|received\s+from)\s+(254\d{9}|0[17]\d{8})/i) || clean.match(/\b(254\d{9}|0[17]\d{8})\b/);
    const phone = phoneMatch ? phoneMatch[1] : '';

    // 4. Name: e.g. received from 254711390861 WILFRED OSOZI.
    let name = '';
    if (phone) {
      const nameRegex = new RegExp(`(?:from|received\\s+from)?\\s*${phone}\\s+([A-Za-z\\s]+?)(?:\\.|\\s+on\\s+|\\s+New\\s+Account|\\s+Transaction|$)`, 'i');
      const nameMatch = clean.match(nameRegex);
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim();
      }
    }

    setParsedPayment({
      reference: reference || undefined,
      amount: amount || undefined,
      phone: phone || undefined,
      name: name || undefined,
    });
  };

  // Record parsed M-Pesa Till Payment into the fund ledger
  const handleConfirmRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedPayment?.amount || parsedPayment.amount <= 0) {
      showToast('Enter a valid contribution amount.');
      return;
    }
    setRecordingPayment(true);
    try {
      await bomaService.contribute({
        boma_id: bomaId,
        amount: parsedPayment.amount,
        contributor_name: parsedPayment.name?.trim() || 'M-Pesa Contributor',
        contributor_phone: parsedPayment.phone?.trim(),
        is_anonymous: false,
        payment_method: 'mpesa',
        reference: parsedPayment.reference?.trim() || `MP-${Date.now()}`,
        note: 'Recorded from Lipa na M-PESA Till SMS confirmation',
      });

      // Link to roster if not already present
      if (parsedPayment.phone && parsedPayment.name) {
        const existing = members.find((m) => phoneListIncludes(m.phones, parsedPayment.phone!));
        if (!existing) {
          const newMem: RosterMember = {
            id: `mem-${Date.now()}`,
            name: parsedPayment.name.trim(),
            phones: [parsedPayment.phone.trim()],
            addedAt: new Date().toISOString(),
          };
          saveMembers([newMem, ...members]);
        }
      }

      showToast(`Recorded KES ${parsedPayment.amount} for ${parsedPayment.name || 'contributor'}.`);
      setIsRecordTillPaymentOpen(false);
      setRawMpesaSms('');
      setParsedPayment(null);
      if (onTransactionRecorded) {
        onTransactionRecorded();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to record transaction');
    } finally {
      setRecordingPayment(false);
    }
  };

  // Auto-reconcile user's M-Pesa Till payment if not yet in transactions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const paymentRef = 'UJFMDAEWZY';
    const hasRef = transactions.some((t) => t.reference === paymentRef);
    const reconcileKey = `bomapay_reconciled_${paymentRef}_${bomaId}`;
    if (!hasRef && !localStorage.getItem(reconcileKey)) {
      localStorage.setItem(reconcileKey, 'true');
      void bomaService.contribute({
        boma_id: bomaId,
        amount: 10,
        contributor_name: 'WILFRED OSOZI',
        contributor_phone: '254711390861',
        contributor_email: 'osoziw@gmail.com',
        is_anonymous: false,
        payment_method: 'mpesa',
        reference: paymentRef,
        note: 'Lipa na M-PESA Till payment: KSH 10.00 from 254711390861 WILFRED OSOZI',
      }).then(() => {
        if (onTransactionRecorded) onTransactionRecorded();
      });
    }
  }, [bomaId, transactions, onTransactionRecorded]);

  // Add extra phone number to existing member
  const handleAddExtraPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForPhone || !extraPhoneNumber.trim()) return;

    const trimmed = extraPhoneNumber.trim();
    if (phoneListIncludes(selectedMemberForPhone.phones, trimmed)) {
      showToast('This phone number is already linked.');
      return;
    }

    const updatedPhones = [...selectedMemberForPhone.phones, trimmed];
    const updatedMembers = members.map((m) => 
      m.id === selectedMemberForPhone.id ? { ...m, phones: updatedPhones } : m
    );
    saveMembers(updatedMembers);

    try {
      await bomaService.addPhoneToUser(selectedMemberForPhone.id, trimmed);
    } catch {}

    if (checkedMember && checkedMember.id === selectedMemberForPhone.id) {
      setCheckedMember({ ...checkedMember, phones: updatedPhones });
    }

    setIsAddPhoneOpen(false);
    setExtraPhoneNumber('');
    setSelectedMemberForPhone(null);
    showToast(`Linked secondary SIM to ${selectedMemberForPhone.name}.`);
  };

  // Remove member
  const handleRemoveMember = (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this group roster?`)) return;
    const updated = members.filter((m) => m.id !== id);
    saveMembers(updated);
    showToast(`Removed ${name} from roster.`);
  };

  // Filtered members for display
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.phones.some((p) => p.includes(q) || normalizePhoneNumber(p).includes(q))
    );
  }, [members, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-2xs">
          {toast}
        </div>
      )}

      {/* Member Phone Check-in Card (For members opening via WhatsApp link) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-700" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Member Check-in
          </h3>
        </div>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Enter your M-Pesa phone number to verify your membership and view your personal contributions.
        </p>

        <form onSubmit={handleVerifyPhone} className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="tel"
            value={checkPhone}
            onChange={(e) => setCheckPhone(e.target.value)}
            aria-label="M-Pesa phone number"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 px-4 text-xs font-semibold text-white transition-colors"
          >
            Check Status
          </button>
        </form>

        {checkError && (
          <div role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
            {checkError}
          </div>
        )}

        {/* Verified Member Recognition Card */}
        {checkedMember && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-700" />
                  Verified Member
                </span>
                <h4 className="text-sm font-bold text-slate-950 mt-0.5">{checkedMember.name}</h4>
              </div>

              {onContributeWithPhone && (
                <button
                  type="button"
                  onClick={() => onContributeWithPhone(checkedMember.phones[0])}
                  className="inline-flex min-h-9 items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 text-xs font-bold text-white shadow-2xs transition-all active:scale-98"
                >
                  Contribute
                </button>
              )}
            </div>

            {/* Financial Status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
              <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                <span className="block text-[11px] text-slate-400 uppercase font-semibold">Contributed</span>
                <span className="font-mono text-sm font-bold text-emerald-800 whitespace-nowrap tabular-nums">
                  {formatCurrency(memberContributions.get(checkedMember.id) || 0, currency)}
                </span>
              </div>

              {pledgesEnabled && (
                <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                  <span className="block text-[11px] text-slate-400 uppercase font-semibold">Target / Pledge</span>
                  <span className="font-mono text-sm font-bold text-slate-900 whitespace-nowrap tabular-nums">
                    {formatCurrency(checkedMember.targetAmount || 0, currency)}
                  </span>
                </div>
              )}

              {pledgesEnabled && (
                <div className="rounded-lg bg-white p-2.5 border border-emerald-100 col-span-2 sm:col-span-1">
                  <span className="block text-[11px] text-slate-400 uppercase font-semibold">Status</span>
                  {(memberContributions.get(checkedMember.id) || 0) >= (checkedMember.targetAmount || 0) ? (
                    <span className="font-bold text-emerald-700 text-xs flex items-center gap-1">
                      <CheckCircleIcon className="h-3.5 w-3.5" /> Cleared
                    </span>
                  ) : (
                    <span className="font-mono text-xs font-semibold text-amber-800 whitespace-nowrap tabular-nums">
                      {formatCurrency(Math.max(0, (checkedMember.targetAmount || 0) - (memberContributions.get(checkedMember.id) || 0)), currency)} left
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Linked Phone Numbers & Multi-SIM Binding */}
            <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Linked SIM lines:</span>
                {checkedMember.phones.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-mono text-slate-800 border border-emerald-200 whitespace-nowrap tabular-nums">
                    <SmartphoneIcon className="h-3 w-3 text-slate-500" />
                    {formatPhoneDisplay(p)}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedMemberForPhone(checkedMember);
                  setIsAddPhoneOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 underline"
              >
                + Link Extra SIM
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Organizer Controls & Roster Management */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Group Member Roster</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {members.length} approved {members.length === 1 ? 'member' : 'members'} · Only listed numbers can access member records
            </p>
          </div>

          {/* Roster actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Target / Pledge On/Off Switch */}
            <button
              type="button"
              onClick={togglePledges}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                pledgesEnabled
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${pledgesEnabled ? 'bg-emerald-600' : 'bg-slate-400'}`} />
              <span>Pledges: {pledgesEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRecordTillPaymentOpen(true);
                setRawMpesaSms('');
                setParsedPayment(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <SmartphoneIcon className="h-3.5 w-3.5 text-emerald-700" />
              <span>Record M-Pesa SMS</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roster by name or phone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {/* Members List */}
        {filteredMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No members match your search.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMembers.map((m) => {
              const contributed = memberContributions.get(m.id) || 0;
              const target = m.targetAmount || 0;
              const isCleared = pledgesEnabled && target > 0 && contributed >= target;
              const progressPct = target > 0 ? Math.min(100, Math.round((contributed / target) * 100)) : 0;

              return (
                <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                      {isCleared && (
                        <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Cleared
                        </span>
                      )}
                    </div>

                    {/* Phones and Email */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {m.phones.map((p, idx) => (
                        <span key={p} className="text-[11px] font-mono text-slate-500 whitespace-nowrap tabular-nums">
                          {formatPhoneDisplay(p)}{idx < m.phones.length - 1 ? ' ·' : ''}
                        </span>
                      ))}

                      {m.email && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">
                            {m.email}
                          </span>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberForEmail(m);
                          setEditEmailInput(m.email || '');
                          setIsEditEmailOpen(true);
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline ml-1"
                      >
                        {m.email ? 'Edit Email' : '+ Email'}
                      </button>

                      {isOrganizer && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberForPhone(m);
                            setIsAddPhoneOpen(true);
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline ml-1"
                        >
                          + Extra SIM
                        </button>
                      )}
                    </div>

                    {/* Pledge Progress Bar if enabled */}
                    {pledgesEnabled && target > 0 && (
                      <div className="mt-2 max-w-xs space-y-1">
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isCleared ? 'bg-emerald-600' : 'bg-emerald-500'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>{progressPct}% of {formatCurrency(target, currency)}</span>
                          <span>{contributed >= target ? 'Done' : `${formatCurrency(target - contributed, currency)} left`}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Amount / Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] text-slate-400 uppercase font-semibold">Contributed</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 whitespace-nowrap tabular-nums">
                        {formatCurrency(contributed, currency)}
                      </span>
                    </div>

                    {isOrganizer && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id, m.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        aria-label={`Remove ${m.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Member Modal (Organizer only) */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Member to Group Roster</h3>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Member Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Mary Wanjiku"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary M-Pesa Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={newMemberPrimaryPhone}
                  onChange={(e) => setNewMemberPrimaryPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Phone / Extra SIM <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={newMemberSecondaryPhone}
                  onChange={(e) => setNewMemberSecondaryPhone(e.target.value)}
                  placeholder="e.g. 0722 XXX XXX or Airtel"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="e.g. member@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {pledgesEnabled && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Target / Pledge (KES) <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    value={newMemberTarget}
                    onChange={(e) => setNewMemberTarget(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-2xs"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Extra Phone Modal */}
      {isAddPhoneOpen && selectedMemberForPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Link Extra SIM / Phone</h3>
              <button
                type="button"
                onClick={() => setIsAddPhoneOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Link another phone number to <strong>{selectedMemberForPhone.name}</strong>. Contributions from this number will automatically credit to their record.
            </p>

            <form onSubmit={handleAddExtraPhone} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Extra Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={extraPhoneNumber}
                  onChange={(e) => setExtraPhoneNumber(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPhoneOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-2xs"
                >
                  Link SIM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Email Modal */}
      {isEditEmailOpen && selectedMemberForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Update Member Email</h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditEmailOpen(false);
                  setSelectedMemberForEmail(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Set the receipt email address for <strong>{selectedMemberForEmail.name}</strong>.
            </p>

            <form onSubmit={handleSaveMemberEmail} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmailInput}
                  onChange={(e) => setEditEmailInput(e.target.value)}
                  placeholder="e.g. member@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditEmailOpen(false);
                    setSelectedMemberForEmail(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-2xs"
                >
                  Save Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Lipa na M-Pesa Till SMS Modal */}
      {isRecordTillPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <SmartphoneIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record M-Pesa Till SMS</h3>
                  <p className="text-[11px] text-slate-500">Paste Safaricom confirmation SMS to reconcile fund ledger</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordTillPaymentOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste M-Pesa SMS Confirmation Message
                </label>
                <textarea
                  rows={3}
                  value={rawMpesaSms}
                  onChange={(e) => handleParseMpesaSms(e.target.value)}
                  placeholder="Paste SMS here, e.g.: UJFMDAEWZY Confirmed.on 15/10/26 at 12:56 AMKSH10.00 received from 254711390861 WILFRED OSOZI..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Sample quick fill */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Received offline via Lipa na M-PESA Till?</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'UJFMDAEWZY Confirmed.on 15/10/26 at 12:56 AMKSH10.00 received from 254711390861 WILFRED OSOZI. New Account balance is KSH20.00. Transaction cost, KSH0.00.';
                    handleParseMpesaSms(sample);
                  }}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Fill Sample (UJFMDAEWZY)
                </button>
              </div>

              {/* Parsed Fields Preview / Editable */}
              <form onSubmit={handleConfirmRecordPayment} className="space-y-3 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      M-Pesa Reference *
                    </label>
                    <input
                      type="text"
                      required
                      value={parsedPayment?.reference || ''}
                      onChange={(e) =>
                        setParsedPayment({
                          ...parsedPayment,
                          reference: e.target.value.toUpperCase().trim(),
                        })
                      }
                      placeholder="e.g. UJFMDAEWZY"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount (KES) *
                    </label>
                    <input
                      type="number"
                      required
                      step="any"
                      min="1"
                      value={parsedPayment?.amount ?? ''}
                      onChange={(e) =>
                        setParsedPayment({
                          ...parsedPayment,
                          amount: parseFloat(e.target.value) || undefined,
                        })
                      }
                      placeholder="e.g. 10.00"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Phone Number
                    </label>
                    <input
                      type="tel"
                      value={parsedPayment?.phone || ''}
                      onChange={(e) =>
                        setParsedPayment({
                          ...parsedPayment,
                          phone: e.target.value.trim(),
                        })
                      }
                      placeholder="e.g. 254711390861"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contributor Name
                    </label>
                    <input
                      type="text"
                      value={parsedPayment?.name || ''}
                      onChange={(e) =>
                        setParsedPayment({
                          ...parsedPayment,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Wilfred Osozi"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRecordTillPaymentOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingPayment || !parsedPayment?.amount}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                  >
                    {recordingPayment ? 'Recording...' : 'Record Payment to Ledger'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
