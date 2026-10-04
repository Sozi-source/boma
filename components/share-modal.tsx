'use client';

import React, { useState, useEffect } from 'react';
import { Boma } from '@/lib/types/fintech';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import QrCode from '@/components/qr-code';
import { 
  XMarkIcon, 
  WhatsAppIcon, 
  CopyIcon, 
  ShareIcon, 
  DownloadIcon, 
  ShieldCheckIcon,
  CheckCircleIcon 
} from '@/components/ui/icons';

interface ShareModalProps {
  boma: Boma;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ boma, isOpen, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'qrcode'>('whatsapp');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && boma) {
      setShareUrl(`${window.location.origin}/bomas/${boma.id}`);
    }
  }, [boma]);

  if (!isOpen) return null;

  const percentage = Math.min(100, Math.round((boma.current_amount / boma.target_amount) * 100));
  
  // Format WhatsApp broadcast message
  const defaultNote = customNote.trim() 
    ? `\n\n💬 _"${customNote.trim()}"_`
    : '';

  const whatsappMessage = 
`*Support: ${boma.title}*
${boma.verified ? '✅ Verified on Boma\n' : ''}
🎯 *Target:* ${formatCurrency(boma.target_amount, boma.currency)}
💰 *Raised:* ${formatCurrency(boma.current_amount, boma.currency)} (${percentage}%)
👥 *Members:* ${boma.contributors_count} contributors${defaultNote}

Every contribution counts! Give transparently via M-Pesa or Card:
👉 ${shareUrl}`;

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyText = async () => {
    if (typeof window !== 'undefined') {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: boma.title,
          text: `Support ${boma.title} on Boma. Raised: ${formatCurrency(boma.current_amount, boma.currency)} (${percentage}%).`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    const svgEl = document.querySelector('#boma-qr-code svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${boma.slug || 'boma'}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-xl bg-white p-4 sm:p-5 shadow-xl border border-slate-200 space-y-3.5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <ShareIcon className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900">
              Share Campaign
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
              activeTab === 'whatsapp'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>WhatsApp Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
              activeTab === 'qrcode'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Scan QR Code</span>
          </button>
        </div>

        {activeTab === 'whatsapp' ? (
          <div className="space-y-3">
            {/* WhatsApp Message Preview Bubble */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">
                <span>WhatsApp Preview</span>
                {boma.verified && (
                  <span className="flex items-center gap-0.5">
                    <ShieldCheckIcon className="w-3 h-3 text-emerald-700" />
                    Verified Trust Account
                  </span>
                )}
              </div>

              {/* Simulated Card */}
              <div className="rounded-lg bg-white p-3 shadow-2xs border border-emerald-100 space-y-2">
                <p className="font-semibold text-slate-900 text-xs leading-snug">
                  {boma.title}
                </p>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold font-mono text-slate-900">
                    {formatCurrency(boma.current_amount, boma.currency)}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {percentage}% of {formatCurrency(boma.target_amount, boma.currency)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>{boma.contributors_count} contributors</span>
                  <span>M-Pesa / Cards accepted</span>
                </div>
              </div>

              {/* Message text area preview */}
              <div className="rounded-lg bg-white/90 p-2 font-mono text-[10px] text-slate-700 whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto border border-emerald-100">
                {whatsappMessage}
              </div>
            </div>

            {/* Optional Personal Note */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Add an update or appeal note (optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Actions */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Share to WhatsApp Now</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  {copiedText ? (
                    <>
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copied Text!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <ShareIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>More Apps</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-center">
            {/* QR Code Container */}
            <div id="boma-qr-code" className="flex justify-center py-2">
              <QrCode
                value={shareUrl}
                size={180}
                label="Scan to contribute via M-Pesa / Card"
              />
            </div>

            <p className="text-[11px] text-slate-500 px-4">
              Display this QR code at Chama meetings, family gatherings, or print it on event flyers. Anyone can scan with their phone camera to donate instantly.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-semibold text-white transition-colors shadow-2xs"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>Save QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {copiedLink ? (
                  <>
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
