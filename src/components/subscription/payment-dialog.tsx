"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentFormSchema, type PaymentFormInput } from "./schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  CreditCard, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Coins, 
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "subscription" | "coin_pack";
  targetId: string; // plan id (e.g. 'premium') or coin pack uuid
  title: string;
  description: string;
  priceLabel: string;
  coinAmount?: number;
  onSuccess?: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  type,
  targetId,
  title,
  description,
  priceLabel,
  coinAmount,
  onSuccess,
}: PaymentDialogProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [processingMessage, setProcessingMessage] = useState("Securing gateway...");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvc: "",
    },
  });

  const cardholderNameVal = watch("cardholderName");
  const cardNumberVal = watch("cardNumber");
  const expiryDateVal = watch("expiryDate");
  const cvcVal = watch("cvc");

  // Reset dialog state when opening/closing
  useEffect(() => {
    if (open) {
      reset();
      setStatus("idle");
      setIsFlipped(false);
      setErrorMessage("");
    }
  }, [open, reset]);

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    let formattedValue = "";
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += " ";
      }
      formattedValue += value[i];
    }
    setValue("cardNumber", formattedValue.substring(0, 19), { shouldValidate: true });
  };

  // Format Expiry Date (MM/YY, inserts slash)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\//g, "").replace(/[^0-9]/gi, "");
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    setValue("expiryDate", value.substring(0, 5), { shouldValidate: true });
  };

  // Format CVC (max 4 digits)
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, "");
    setValue("cvc", value.substring(0, 4), { shouldValidate: true });
  };

  // Detect card brand
  const getCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\s/g, "");
    if (cleanNumber.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(cleanNumber)) return "MASTERCARD";
    if (/^3[47]/.test(cleanNumber)) return "AMEX";
    if (/^6(?:011|5)/.test(cleanNumber)) return "DISCOVER";
    return "CREDIT CARD";
  };

  // Cycle messages during transaction processing
  useEffect(() => {
    if (status !== "processing") return;
    
    const messages = [
      "Establishing secure transaction channel...",
      "Encrypting credit card details...",
      "Submitting transaction packet...",
      "Authorizing and registering subscription...",
      "Finalizing account configuration..."
    ];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < messages.length - 1) {
        currentIndex++;
        setProcessingMessage(messages[currentIndex]);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [status]);

  const onSubmit = async (data: PaymentFormInput) => {
    setStatus("processing");
    setProcessingMessage("Securing gateway...");

    try {
      const endpoint = type === "subscription" 
        ? "/api/subscription/upgrade" 
        : "/api/coins/purchase";

      const body = type === "subscription"
        ? { plan: targetId, paymentMethod: "card", cardDetails: data }
        : { packId: targetId, paymentMethod: "card", cardDetails: data };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Payment transaction declined by payment gateway.");
      }

      const resData = await response.json();
      
      // Wait briefly for full animation/effect
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus("success");
      toast.success(
        type === "subscription" 
          ? "Successfully upgraded plan!" 
          : "Coins successfully added to balance!"
      );
    } catch (err: any) {
      console.error("Payment submission failed:", err);
      // Wait briefly so processing screen isn't cut off immediately
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus("error");
      setErrorMessage(err.message || "Failed to process payment. Please verify card details.");
      toast.error("Payment failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 text-zinc-50 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {status === "idle" && (
          <>
            <DialogHeader className="pb-2">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Secure Payment Gateway</span>
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                {title}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                {description}
              </DialogDescription>
            </DialogHeader>

            {/* Plan / Pricing Details Badge */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 mb-4">
              <div className="flex items-center gap-3">
                {type === "subscription" ? (
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <Coins className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-zinc-100">{title.split("Upgrade to ").pop()}</p>
                  <p className="text-xs text-zinc-400">
                    {type === "subscription" 
                      ? "Monthly Recurring Plan" 
                      : `${coinAmount?.toLocaleString() ?? "0"} Coins credit`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-zinc-100">{priceLabel}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Payable Now</p>
              </div>
            </div>

            {/* 3D Credit Card Simulation */}
            <div className="w-full flex justify-center py-4 mb-4 select-none [perspective:1000px]">
              <div 
                className={cn(
                  "relative w-[340px] h-[190px] rounded-2xl text-white transition-all duration-700 ease-out [transform-style:preserve-3d]",
                  isFlipped ? "[transform:rotateY(180deg)]" : ""
                )}
              >
                {/* Front Side */}
                <div 
                  className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 p-5 flex flex-col justify-between shadow-2xl border border-white/20 [backface-visibility:hidden]"
                >
                  <div className="flex justify-between items-start">
                    {/* Chip */}
                    <div className="w-10 h-8 rounded-md bg-gradient-to-r from-amber-400 to-amber-200 opacity-80 flex items-center justify-center border border-amber-500/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/30" />
                      <div className="w-6 h-5 border-r border-b border-black/10 flex flex-col" />
                    </div>
                    {/* Card Brand */}
                    <span className="text-xs font-bold tracking-widest opacity-80 uppercase">
                      {getCardBrand(cardNumberVal || "")}
                    </span>
                  </div>

                  {/* Card Number */}
                  <div className="text-lg md:text-xl font-mono tracking-[0.2em] font-medium py-2 opacity-95">
                    {cardNumberVal || "•••• •••• •••• ••••"}
                  </div>

                  {/* Card Holder & Expiry */}
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider opacity-60">Card Holder</span>
                      <span className="text-sm font-semibold tracking-wider truncate max-w-[200px] uppercase">
                        {cardholderNameVal || "Cardholder Name"}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] uppercase tracking-wider opacity-60">Expires</span>
                      <span className="text-sm font-semibold tracking-wider font-mono">
                        {expiryDateVal || "MM/YY"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Back Side */}
                <div 
                  className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-indigo-800 via-purple-800 to-pink-700 p-5 flex flex-col justify-between shadow-2xl border border-white/20 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                >
                  {/* Magnetic Strip */}
                  <div className="absolute top-5 left-0 w-full h-10 bg-zinc-900" />
                  
                  {/* CVC box */}
                  <div className="mt-14 w-full flex items-center justify-end gap-3">
                    <div className="text-[9px] uppercase tracking-wider opacity-60">Security Code</div>
                    <div className="w-20 bg-white text-zinc-900 px-3 py-1.5 rounded text-right font-mono font-bold tracking-widest text-sm shadow-inner italic">
                      {cvcVal || "•••"}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[8px] opacity-40">
                    <span>Lucy AI Services Inc.</span>
                    <span>Direct Server Processing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Card Input Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cardholderName" className="text-xs text-zinc-300">Cardholder Name</Label>
                <div className="relative">
                  <Input
                    id="cardholderName"
                    type="text"
                    placeholder="JOHN DOE"
                    className={cn(
                      "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 rounded-xl",
                      errors.cardholderName && "border-red-500/50 focus-visible:ring-red-500"
                    )}
                    {...register("cardholderName")}
                  />
                </div>
                {errors.cardholderName && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.cardholderName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cardNumber" className="text-xs text-zinc-300">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="4111 1111 1111 1111"
                    className={cn(
                      "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 rounded-xl",
                      errors.cardNumber && "border-red-500/50 focus-visible:ring-red-500"
                    )}
                    {...register("cardNumber")}
                    onChange={handleCardNumberChange}
                  />
                  <CreditCard className="absolute right-3.5 top-3 h-4 w-4 text-zinc-500" />
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.cardNumber.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiryDate" className="text-xs text-zinc-300">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="text"
                    placeholder="MM/YY"
                    className={cn(
                      "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 rounded-xl text-center",
                      errors.expiryDate && "border-red-500/50 focus-visible:ring-red-500"
                    )}
                    {...register("expiryDate")}
                    onChange={handleExpiryChange}
                  />
                  {errors.expiryDate && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.expiryDate.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cvc" className="text-xs text-zinc-300">CVC / CVV</Label>
                  <Input
                    id="cvc"
                    type="text"
                    placeholder="123"
                    className={cn(
                      "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 rounded-xl text-center",
                      errors.cvc && "border-red-500/50 focus-visible:ring-red-500"
                    )}
                    {...register("cvc")}
                    onChange={handleCvcChange}
                    onFocus={() => setIsFlipped(true)}
                    onBlur={() => setIsFlipped(false)}
                  />
                  {errors.cvc && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.cvc.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>256-bit SSL Encryption</span>
                </div>
                <span>PCI-DSS Compliant</span>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 rounded-xl"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] rounded-xl"
                >
                  Pay {priceLabel}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* Processing State */}
        {status === "processing" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full border-4 border-indigo-500/20 animate-ping" />
              <div className="relative h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-zinc-100">Processing Payment</p>
              <p className="text-xs text-zinc-400 max-w-[280px] mx-auto h-8 flex items-center justify-center animate-pulse">
                {processingMessage}
              </p>
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              Do not close or refresh this page
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-100">Transaction Approved</h3>
              <p className="text-sm text-zinc-400 max-w-[280px] mx-auto">
                Your payment was processed successfully. {type === "subscription" ? "Your account has been upgraded!" : "Your coins have been added!"}
              </p>
            </div>
            <div className="w-full bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl text-left max-w-[320px] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className="text-emerald-400 font-medium">Completed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount Charged</span>
                <span className="text-zinc-200 font-semibold">{priceLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Reference</span>
                <span className="text-zinc-300 font-mono">LUCY-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
              </div>
            </div>
            <Button
              className="w-full max-w-[240px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              onClick={() => {
                onOpenChange(false);
                if (onSuccess) onSuccess();
              }}
            >
              Finish Setup
            </Button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <XCircle className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-100">Transaction Failed</h3>
              <p className="text-sm text-zinc-400 max-w-[280px] mx-auto">
                {errorMessage}
              </p>
            </div>
            <div className="flex gap-3 w-full max-w-[300px]">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900 rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl"
                onClick={() => setStatus("idle")}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
