import React, { useState } from 'react';
import { X, Check, Sparkles, Zap, Shield, Crown, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  onUpgradePlan
}) {
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = (planName) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e2be68', '#fef3c7', '#38bdf8', '#818cf8']
    });
    setUpgradedSuccess(true);
    setTimeout(() => {
      onUpgradePlan(planName);
      setUpgradedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 select-none"
        style={{
          background: 'rgba(18, 22, 30, 0.60)',
          backdropFilter: 'blur(36px) saturate(160%)',
          WebkitBackdropFilter: 'blur(36px) saturate(160%)',
          border: 'none',
          boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-victor mb-3">
            <Crown size={14} className="text-amber-400" />
            <span>Astracore Tier Upgrades</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-victor text-white">
            Ascend to Frontier Intelligence
          </h2>
          <p className="text-xs sm:text-sm font-victor text-white/50 mt-2 max-w-lg mx-auto">
            Unlock infinite context windows, instant reasoning priority, and direct API access to Astracore 4.5 Pro.
          </p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center p-1 bg-white/[0.05] border border-white/[0.08] rounded-[16px] mt-4 text-xs font-victor">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-white/15 text-white shadow-sm font-medium' : 'text-white/50 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-[12px] transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly' ? 'bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/40 shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded-md font-bold">20% OFF</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          {/* Pro Tier (Popular) */}
          <div className="rounded-[24px] bg-gradient-to-b from-white/[0.08] to-white/[0.03] border-2 border-amber-400/40 p-5 sm:p-6 relative flex flex-col justify-between shadow-xl">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-[10px] font-victor tracking-wider uppercase shadow-md">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold font-victor text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  Astracore Pro
                </h3>
              </div>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl font-bold font-victor text-amber-200">
                  {billingCycle === 'yearly' ? '$16' : '$20'}
                </span>
                <span className="text-xs font-victor text-white/40">/ month</span>
              </div>
              <p className="text-xs text-white/70 font-victor mb-4 leading-relaxed">
                Unlimited reasoning with Astracore 4.5 Pro and 2M token context.
              </p>

              <ul className="space-y-2.5 text-xs text-white/80 font-victor border-t border-white/[0.08] pt-4">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" strokeWidth={2.4} />
                  <span>Unlimited chats with Astracore 4.5 Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" strokeWidth={2.4} />
                  <span>2 Million Token Context Window</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" strokeWidth={2.4} />
                  <span>Full Live Web Search & Image Generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" strokeWidth={2.4} />
                  <span>Real-time Voice Assistant Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-400 shrink-0" strokeWidth={2.4} />
                  <span>Early access to Astracore 5 Previews</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade('Pro')}
              className="mt-6 w-full py-3 rounded-[16px] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-victor font-bold text-xs tracking-wider transition-all shadow-lg shadow-amber-400/25 hover:scale-[1.01] cursor-pointer"
            >
              {upgradedSuccess ? 'Upgraded! Redirecting...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Enterprise / Team Tier */}
          <div className="rounded-[24px] bg-white/[0.04] border border-white/[0.08] hover:border-white/15 p-5 sm:p-6 relative flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold font-victor text-white flex items-center gap-2">
                  <Shield size={18} className="text-indigo-400" />
                  Enterprise Apex
                </h3>
              </div>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl font-bold font-victor text-slate-100">
                  {billingCycle === 'yearly' ? '$48' : '$60'}
                </span>
                <span className="text-xs font-victor text-white/40">/ user / mo</span>
              </div>
              <p className="text-xs text-white/70 font-victor mb-4 leading-relaxed">
                Dedicated SOC-2 compute clusters and custom fine-tuned weights.
              </p>

              <ul className="space-y-2.5 text-xs text-white/80 font-victor border-t border-white/[0.08] pt-4">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" strokeWidth={2.4} />
                  <span>Everything in Pro + Dedicated GPU Priority</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" strokeWidth={2.4} />
                  <span>Unlimited Team Workspaces & SSO / SAML</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" strokeWidth={2.4} />
                  <span>Zero Data Retention & SOC-2 Compliance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" strokeWidth={2.4} />
                  <span>Custom Model Fine-tuning on Private Data</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" strokeWidth={2.4} />
                  <span>24/7 Dedicated AI Solutions Architect</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade('Enterprise')}
              className="mt-6 w-full py-3 rounded-[16px] bg-white/10 hover:bg-white/15 text-white font-victor font-semibold text-xs tracking-wider transition-all border border-white/15 cursor-pointer"
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] font-victor text-white/40">
          30-day money back guarantee. Cancel anytime with one click in settings.
        </div>
      </div>
    </div>
  );
}
