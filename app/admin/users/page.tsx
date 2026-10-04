'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { bomaService } from '@/lib/services/boma-service';
import { UserProfile, UserRole, UserStatus } from '@/lib/types/fintech';
import { formatPhoneDisplay, normalizePhoneNumber } from '@/lib/utils/phone';
import { 
  UsersIcon, 
  SearchIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  SmartphoneIcon,
  XMarkIcon,
  TrashIcon
} from '@/components/ui/icons';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddPhoneModalOpen, setIsAddPhoneModalOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Add User
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    const list = await bomaService.getUsers();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !primaryPhone) return;
    setLoading(true);

    try {
      const phones = [primaryPhone.trim()];
      if (secondaryPhone.trim()) phones.push(secondaryPhone.trim());

      await bomaService.addUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phones,
        role,
        status: 'active',
      });

      setIsAddUserModalOpen(false);
      setFullName('');
      setEmail('');
      setPrimaryPhone('');
      setSecondaryPhone('');
      showToast(`Added user ${fullName} with ${phones.length} phone lines.`);
      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoneToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPhoneNumber.trim()) return;

    try {
      await bomaService.addPhoneToUser(selectedUser.id, newPhoneNumber.trim());
      showToast(`Linked new phone line to ${selectedUser.full_name}`);
      setIsAddPhoneModalOpen(false);
      setNewPhoneNumber('');
      await loadUsers();
      // Update selectedUser reference
      const updated = await bomaService.getUserById(selectedUser.id);
      setSelectedUser(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add phone');
    }
  };

  const handleRemovePhone = async (userId: string, phone: string, userName: string) => {
    if (!confirm(`Remove phone number ${formatPhoneDisplay(phone)} from ${userName}?`)) return;
    try {
      await bomaService.removePhoneFromUser(userId, phone);
      showToast(`Removed phone line from ${userName}`);
      await loadUsers();
      if (selectedUser?.id === userId) {
        const updated = await bomaService.getUserById(userId);
        setSelectedUser(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cannot remove phone');
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await bomaService.updateUser(user.id, { status: nextStatus });
      showToast(`${user.full_name} status updated to ${nextStatus}.`);
      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      await bomaService.updateUser(userId, { role: newRole });
      showToast(`Role changed to ${newRole}`);
      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Role change failed');
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`Delete user account for ${user.full_name}? This cannot be undone.`)) return;
    try {
      await bomaService.deleteUser(user.id);
      showToast(`Account for ${user.full_name} removed.`);
      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const qNorm = normalizePhoneNumber(q);
      const nameMatch = u.full_name.toLowerCase().includes(q);
      const emailMatch = u.email.toLowerCase().includes(q);
      const phoneMatch = u.phones.some(
        (p) => p.includes(q) || (qNorm && normalizePhoneNumber(p).includes(qNorm))
      );
      return nameMatch || emailMatch || phoneMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-emerald-700 text-white p-3 text-xs font-semibold shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-emerald-700 font-medium transition-colors">
          ← Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">User Directory</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-3.5 border-b border-slate-200/80">
        <div>
          <h1 className="text-base sm:text-xl font-semibold text-slate-800 tracking-tight">
            User Directory
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddUserModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white shadow-2xs transition-colors shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by full name, email, or any registered phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-medium text-slate-700 focus:outline-hidden focus:border-emerald-600"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="organizer">Organizers</option>
              <option value="member">Members</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | UserStatus)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-medium text-slate-700 focus:outline-hidden focus:border-emerald-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_approval">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Counts */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-mono">
          <span>Showing {filteredUsers.length} of {users.length} accounts</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="hidden 2xl:block">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                <th className="py-2.5 px-4">User Account</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Associated Phone Numbers</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/60 transition-colors">
                    
                    {/* User Identity */}
                    <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center shrink-0 text-white shadow-2xs ${
                          u.role === 'admin'
                            ? 'bg-amber-500'
                            : u.role === 'organizer'
                            ? 'bg-emerald-700'
                            : 'bg-neutral-700'
                        }`}>
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-neutral-900 text-[11px] sm:text-xs block truncate">
                            {u.full_name}
                          </span>
                          <span className="text-[9.5px] sm:text-[11px] text-neutral-400 block truncate font-mono">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                        className={`text-[9px] sm:text-[10px] font-bold font-mono uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border cursor-pointer focus:outline-hidden ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : u.role === 'organizer'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                        }`}
                      >
                        <option value="admin">ADMIN</option>
                        <option value="organizer">ORGANIZER</option>
                        <option value="member">MEMBER</option>
                      </select>
                    </td>

                    {/* Multi-Phone Lines */}
                    <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 max-w-sm">
                        {u.phones.map((phone, pIdx) => (
                          <span
                            key={pIdx}
                            className="inline-flex items-center gap-1 font-mono text-[9px] sm:text-[10px] bg-neutral-100 border border-neutral-200/80 px-1.5 sm:px-2 py-0.5 rounded-md text-neutral-700 group"
                          >
                            <span>{formatPhoneDisplay(phone)}</span>
                            {pIdx === 0 && (
                              <span className="text-[7.5px] sm:text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded-xs font-bold uppercase">
                                Primary
                              </span>
                            )}
                            {u.phones.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePhone(u.id, phone, u.full_name)}
                                className="text-neutral-400 hover:text-red-600 transition-colors ml-0.5"
                                title="Remove phone number"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}

                        {/* Add Phone Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setIsAddPhoneModalOpen(true);
                          }}
                          className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 hover:text-emerald-800 px-1.5 sm:px-2 py-0.5 rounded-md border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors"
                        >
                          <PlusIcon className="w-3 h-3 stroke-[2.5]" />
                          <span>Add Phone</span>
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4">
                      <span className={`inline-block text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full capitalize ${
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : u.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {u.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className="px-2 sm:px-2.5 py-1 rounded-lg border border-neutral-200 bg-white text-[10px] sm:text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete user"
                        >
                          <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 2xl:hidden">
          {filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400 sm:col-span-2">No users matching criteria found.</p>
          ) : filteredUsers.map((u) => (
            <div key={u.id} className="min-w-0 rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-neutral-900">{u.full_name}</p>
                  <p className="truncate text-[10px] text-neutral-500">{u.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize ${u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : u.status === 'pending_approval' ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-800'}`}>
                  {u.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-neutral-500">Role</span>
                <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)} className="max-w-[65%] rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase text-neutral-700">
                  <option value="admin">Admin</option>
                  <option value="organizer">Organizer</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div className="mt-2 space-y-1">
                <span className="text-[10px] font-semibold text-neutral-500">Phone numbers</span>
                {u.phones.map((phone, pIdx) => (
                  <div key={pIdx} className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="min-w-0 truncate font-mono text-neutral-700">{formatPhoneDisplay(phone)}{pIdx === 0 ? ' · Primary' : ''}</span>
                    {u.phones.length > 1 && <button type="button" onClick={() => handleRemovePhone(u.id, phone, u.full_name)} className="shrink-0 text-red-600">Remove</button>}
                  </div>
                ))}
                <button type="button" onClick={() => { setSelectedUser(u); setIsAddPhoneModalOpen(true); }} className="mt-1 text-[10px] font-semibold text-emerald-700">+ Add phone</button>
              </div>
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-2">
                <button type="button" onClick={() => handleToggleStatus(u)} className="flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-[10px] font-semibold text-neutral-700">{u.status === 'active' ? 'Suspend' : 'Activate'}</button>
                <button type="button" onClick={() => handleDeleteUser(u)} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                  <UsersIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">Add New User</h3>
                  <p className="text-[10px] text-neutral-400">Pre-approved member with role &amp; multiple phones</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-700 mb-1">
                  Primary Mobile Number (M-Pesa) *
                </label>
                <input
                  type="tel"
                  required
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-700 mb-1">
                  Secondary Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
                <p className="text-[9.5px] sm:text-[10px] text-neutral-400 mt-0.5">
                  Contributions from any of these numbers will automatically display the member&apos;s real name.
                </p>
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-700 mb-1">
                  Platform Role
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {(['member', 'organizer', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-1.5 text-xs font-bold rounded-xl border capitalize transition-all ${
                        role === r
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="rounded-xl border border-neutral-200 bg-white px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Adding User...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Additional Phone Modal for an existing user */}
      {isAddPhoneModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-neutral-200 space-y-3 sm:space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center">
                  <SmartphoneIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-neutral-900">Add Phone Line</h3>
                  <p className="text-[9.5px] sm:text-[10px] text-neutral-400">For {selectedUser.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPhoneModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPhoneToUser} className="space-y-3">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-700 mb-1">
                  New Mobile Number (M-Pesa / Alternative SIM) *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
                <p className="text-[9.5px] sm:text-[10px] text-neutral-400 mt-1">
                  Incoming payments from this number will immediately resolve to {selectedUser.full_name}&apos;s legal name.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPhoneModalOpen(false)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                >
                  Link Phone Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
