/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Module: Razorpay Standard Checkout Subscription Modal
 * 4 Plans: Free Explorer, Starter ASI (₹199), Pro Hyper-Intelligence (₹499), Unlimited Master (₹999)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  X,
  CreditCard,
  Crown,
  Flame,
  Infinity as InfinityIcon,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { soundEffects } from "../../utils/audioSynth";

interface PlanItem {
  id: string;
  name: string;
  tagline: string;
  priceInr: number;
  period: string;
  popular?: boolean;
  queries: string;
  features: string[];
  accentColor: string;
  buttonLabel: string;
}

const PLANS: PlanItem[] = [
  {
    id: "free",
    name: "Free Explorer",
    tagline: "Essential AI Intelligence",
    priceInr: 0,
    period: "Forever",
    queries: "100 Queries / month",
    accentColor: "from-slate-500 to-slate-700",
    buttonLabel: "Current Tier",
    features: [
      "100 Superintelligence queries",
      "Standard Voice STT & TTS",
      "Holographic HUD & Micro-Decisions",
      "Single Workflows & Memory Bank",
      "Community Support",
    ],
  },
  {
    id: "starter",
    name: "Starter ASI",
    tagline: "For Active Creators & Power Users",
    priceInr: 199,
    period: "/ month",
    queries: "5,000 High-Speed Queries",
    accentColor: "from-cyan-500 to-blue-600",
    buttonLabel: "Upgrade to Starter",
    features: [
      "5,000 High-Speed Queries",
      "Low Latency Gemini 3.6 Flash Brain",
      "Full 3D Micro-Decision World Zoom",
      "Multi-Work Autopilot Commands",
      "Unlimited File & Code Analysis",
      "Priority API Routing",
    ],
  },
  {
    id: "pro",
    name: "Pro Hyper-Intelligence",
    tagline: "Most Popular • Advanced Deep Reasoning",
    priceInr: 499,
    period: "/ month",
    popular: true,
    queries: "25,000 High-Speed Queries",
    accentColor: "from-violet-500 to-fuchsia-600",
    buttonLabel: "Upgrade to Pro",
    features: [
      "25,000 Deep Reasoning Queries",
      "Real-time Multimodal Vision & Camera",
      "Screen Auto-Fix Self-Healing Agent",
      "Full PC Automation & Android Studio",
      "Long-Range Neural Bridge Processing",
      "Priority VIP Processing & Fast Latency",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited Master Enterprise",
    tagline: "Supreme Autonomous Intelligence",
    priceInr: 999,
    period: "/ month",
    queries: "Unlimited Real-time Queries",
    accentColor: "from-amber-400 to-orange-500",
    buttonLabel: "Get Unlimited Master",
    features: [
      "Unlimited Superintelligence Queries",
      "Continuous Autonomous 24/7 Self-Work",
      "Full Screen Live OCR & Auto-Debugger",
      "Multi-User Team & Supervision Mode",
      "Dedicated High-Capacity Cloud Server",
      "Direct Priority Engineer Support",
    ],
  },
];

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  currentPlanId?: string;
  onPaymentSuccess?: (plan: PlanItem, paymentId: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userEmail = "",
  userName = "User",
  currentPlanId = "free",
  onPaymentSuccess,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubscribe = async (plan: PlanItem) => {
    if (plan.id === "free") {
      onClose();
      return;
    }

    try {
      setErrorMessage(null);
      setProcessingPlanId(plan.id);
      soundEffects.playActivatePulse();

      // 1. Call backend to create Razorpay Order (amount in paise, e.g. ₹199 -> 19900 paise)
      const amountInPaise = plan.priceInr * 100;

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: amountInPaise,
          currency: "INR",
          userEmail,
          userName,
          notes: {
            planName: plan.name,
            userEmail,
            userName,
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to initiate payment order");
      }

      // Safely extract order fields with multiple fallbacks
      const resolvedOrderId =
        orderData.order?.id || orderData.order_id || orderData.id;
      const resolvedAmount =
        orderData.order?.amount ?? orderData.amount ?? amountInPaise;
      const resolvedCurrency =
        orderData.order?.currency || orderData.currency || "INR";
      const resolvedKeyId =
        orderData.keyId ||
        orderData.key_id ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_TroOWzpPjRxerY";

      if (!resolvedOrderId) {
        throw new Error("Razorpay gateway did not return a valid order ID. Please try again.");
      }

      // 2. Open standard Razorpay Checkout Modal
      if (typeof (window as any).Razorpay === "undefined") {
        throw new Error(
          "Razorpay checkout script not ready. Please refresh or try again in a few seconds."
        );
      }

      const options = {
        key: resolvedKeyId,
        amount: resolvedAmount,
        currency: resolvedCurrency,
        name: "Dravis Autonomous Superintelligence",
        description: `${plan.name} Plan (${plan.queries})`,
        image: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=DravisASI",
        order_id: resolvedOrderId,
        handler: async function (response: any) {
          try {
            setProcessingPlanId(plan.id);
            // 3. Verify Razorpay signature on server
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
                userEmail,
                userName,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            soundEffects.playTaskComplete();
            setSuccessMessage(
              `Payment successful! Your ${plan.name} subscription is now active.`
            );
            onPaymentSuccess?.(plan, response.razorpay_payment_id);
            setTimeout(() => {
              onClose();
            }, 2500);
          } catch (err: any) {
            console.error("[Razorpay Verification Error]", err);
            setErrorMessage(err?.message || "Signature verification failed.");
          } finally {
            setProcessingPlanId(null);
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        notes: {
          planId: plan.id,
        },
        theme: {
          color: "#06b6d4",
        },
        modal: {
          ondismiss: function () {
            setProcessingPlanId(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("[Razorpay Payment Failed]", response.error);
        setErrorMessage(
          response.error?.description || "Payment failed. Please try again."
        );
        setProcessingPlanId(null);
      });
      rzp.open();
    } catch (err: any) {
      console.error("[Subscription Checkout Error]", err);
      setErrorMessage(err?.message || "Could not launch Razorpay checkout.");
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-5xl rounded-3xl bg-slate-950/95 border border-cyan-500/30 p-5 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_60px_rgba(6,182,212,0.2)] my-auto flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-violet-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                  DRAVIS ASI SUBSCRIPTIONS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 font-bold uppercase">
                  Razorpay Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Unlock high-velocity autonomous superintelligence, real-time multimodal vision, and unlimited reasoning.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isPopular = plan.popular;
            const isCurrent = currentPlanId === plan.id;
            const isProcessing = processingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all cursor-pointer ${
                  isPopular
                    ? "bg-gradient-to-b from-violet-950/40 via-slate-950/90 to-slate-950 border-violet-400/60 shadow-[0_0_30px_rgba(139,92,246,0.25)] ring-1 ring-violet-400/40"
                    : selectedPlanId === plan.id
                    ? "bg-slate-900/90 border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.2)]"
                    : "bg-slate-900/40 border-white/10 hover:border-white/20"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-mono text-[10px] font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-300" />
                    <span>POPULAR CHOICE</span>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center justify-between">
                      <span>{plan.name}</span>
                      {plan.id === "unlimited" && (
                        <InfinityIcon className="w-4 h-4 text-amber-400" />
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{plan.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2 border-y border-white/10">
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                      {plan.priceInr === 0 ? "₹0" : `₹${plan.priceInr}`}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{plan.period}</span>
                  </div>

                  <div className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{plan.queries}</span>
                  </div>

                  {/* Features list */}
                  <ul className="flex flex-col gap-2 pt-2">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="text-[11px] text-slate-300 flex items-start gap-2 leading-tight"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 mt-4 border-t border-white/10">
                  <button
                    type="button"
                    disabled={isCurrent || isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isCurrent
                        ? "bg-white/10 text-slate-400 border border-white/10 cursor-default"
                        : isPopular
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                        : plan.id === "unlimited"
                        ? "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                        : "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : isCurrent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Active Plan</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>{plan.buttonLabel}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Razorpay badges footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>256-Bit SSL Encrypted Standard Razorpay Checkout</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Cards, UPI, NetBanking, Wallets supported</span>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
