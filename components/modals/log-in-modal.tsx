"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import toast from "@/lib/toast";
import { getAuthCallbackUrl } from "@/lib/url";
import { AnimatedArrowUpRight } from "@/components/ui/animated";
import { AlertCircle, X, Loader, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountDropdownMenu, CountryItem } from "@/components/ui/count-dropdown-menu";
import countriesData from "@/data/countries.json";

interface AuthFormErrors {
  email?: string;
  phone?: string;
}

export interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, always render as centered modal (not bottom sheet on mobile) */
  forceModal?: boolean;
  /** Initial error message to display inside the modal */
  initialError?: string | null;
  /** Optional custom title override */
  title?: string;
  /** Optional custom description override */
  description?: string;
}

export function LoginModal({
  open,
  onOpenChange,
  forceModal,
  initialError,
  title = "Log in or Sign up",
  description = "To continue with CloseAI",
}: LoginModalProps) {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(initialError || null);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedCountry = useMemo(
    () =>
      (countriesData as CountryItem[]).find((c) => c.code === countryCode) ||
      (countriesData as CountryItem[])[0],
    [countryCode]
  );

  // Sync initialError if provided from parent
  useEffect(() => {
    if (initialError) {
      setAuthError(initialError);
    }
  }, [initialError]);

  // Read URL params when modal opens if an error occurred during OAuth redirect
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDesc = params.get("error_description");
      if (error || errorCode || errorDesc) {
        let message = "Unable to complete sign in. Please try again.";
        if (errorCode === "bad_oauth_state" || errorDesc?.toLowerCase().includes("state")) {
          message = "Your sign-in session expired or was interrupted. Please try signing in again.";
        } else if (errorCode === "access_denied" || error === "access_denied") {
          message = "Sign-in was cancelled. Please try again when ready.";
        } else if (errorDesc) {
          message = decodeURIComponent(errorDesc.replace(/\+/g, " "));
        }
        setAuthError(message);
      }
    }
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPhone("");
      setAuthMode("email");
      setCountryCode("IN");
      setErrors({});
      setTouched({});
      setSubmitted(false);
      setLoading(false);
      setAuthError(null);
    }
  }, [open]);

  const validateEmail = (val = email) => {
    const newErrors: AuthFormErrors = {};
    if (!val.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
      newErrors.email = "Please enter a valid email address";
    }
    return newErrors;
  };

  const validatePhone = (val = phone) => {
    const newErrors: AuthFormErrors = {};
    if (!val.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9\s\-()]{6,15}$/.test(val.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }
    return newErrors;
  };

  const handleBlur = (field: keyof AuthFormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "email") {
      setErrors((prev) => ({ ...prev, ...validateEmail() }));
    } else if (field === "phone") {
      setErrors((prev) => ({ ...prev, ...validatePhone() }));
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthCallbackUrl("/c"),
          queryParams: {
            access_type: "offline",
            prompt: "consent select_account",
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate with Google");
    }
  };

  const handleAppleAuth = async () => {
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: getAuthCallbackUrl("/c"),
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate with Apple");
    }
  };

  const handleGithubAuth = async () => {
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: getAuthCallbackUrl("/c"),
          queryParams: {
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate with GitHub");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (authMode === "email") {
      const formEl = e.currentTarget;
      const inputEl = formEl.querySelector<HTMLInputElement>('input[type="email"]');
      const val = (inputEl?.value ?? email).trim();
      if (val !== email) {
        setEmail(val);
      }
      const errs = validateEmail(val);
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      toast.info("Email authentication is not configured yet. Try again later.");
    } else {
      const formEl = e.currentTarget;
      const inputEl = formEl.querySelector<HTMLInputElement>('input[type="tel"]');
      const val = (inputEl?.value ?? phone).trim();
      if (val !== phone) {
        setPhone(val);
      }
      const errs = validatePhone(val);
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      toast.info("Phone authentication is not configured yet. Try again later.");
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      maxSnap={0.96}
      className="max-w-[440px] bg-white dark:bg-[#2f2f2f] border border-border/80"
      forceModal={forceModal}
    >
      <div className="flex flex-col space-y-5 pt-1 pb-2 relative">
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-0 right-0 p-3 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#383838] focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-normal tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-base text-muted-foreground mt-1.5">
            {description}
          </p>
        </div>

        {/* OAuth Error Alert Banner */}
        {authError && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3 relative animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm leading-relaxed font-normal">
              {authError}
            </div>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-destructive/70 hover:text-destructive hover:bg-destructive/15 p-1.5 rounded-full border border-transparent hover:bg-destructive/30 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {/* Hidden in-document SVG symbol fallback for Apple */}
        <svg className="hidden" aria-hidden="true">
          <symbol id="f5a288" viewBox="0 0 24 24">
            <path d="M20.091 7.237a4.81 4.81 0 0 0-2.298 4.045 4.68 4.68 0 0 0 2.849 4.293 11.2 11.2 0 0 1-1.46 3.014c-.907 1.307-1.857 2.614-3.301 2.614s-1.817-.84-3.482-.84c-1.623 0-2.201.868-3.522.868s-2.243-1.211-3.303-2.697a13.04 13.04 0 0 1-2.215-7.032c0-4.128 2.683-6.315 5.325-6.315 1.404 0 2.573.921 3.454.921.84 0 2.146-.976 3.742-.976a5 5 0 0 1 4.211 2.105m-4.967-3.853A4.75 4.75 0 0 0 16.252.426 2 2 0 0 0 16.211 0a4.76 4.76 0 0 0-3.124 1.61 4.6 4.6 0 0 0-1.17 2.876q.002.195.042.385.143.027.289.028a4.12 4.12 0 0 0 2.876-1.515" />
          </symbol>
        </svg>

        {/* OAuth & Mode Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full h-11 rounded-full bg-foreground text-background font-medium text-base flex items-center justify-center hover:opacity-90 active:scale-[0.99] border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f] transition-all cursor-pointer select-none"
          >
            <div className="w-[220px] max-w-full flex items-center gap-3">
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 shrink-0" width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
              </span>
              <span className="whitespace-nowrap">Continue with Google</span>
            </div>
          </button>

          <button
            type="button"
            disabled
            className="w-full h-11 rounded-full bg-foreground text-background font-medium text-base flex items-center justify-center border border-transparent select-none opacity-50 cursor-not-allowed disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <div className="w-[220px] max-w-full flex items-center gap-3">
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  aria-hidden="true"
                  className="w-5 h-5 shrink-0 fill-current"
                >
                  <use href="/cdn/assets/sprites-external-fec150fa.svg#f5a288" fill="currentColor"></use>
                </svg>
              </span>
              <span className="whitespace-nowrap">Continue with Apple</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleGithubAuth}
            className="w-full h-11 rounded-full bg-foreground text-background font-medium text-base flex items-center justify-center hover:opacity-90 active:scale-[0.99] border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f] transition-all cursor-pointer select-none"
          >
            <div className="w-[220px] max-w-full flex items-center gap-3">
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 shrink-0 fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </span>
              <span className="whitespace-nowrap">Continue with GitHub</span>
            </div>
          </button>

          {authMode === "email" ? (
            <button
              type="button"
              onClick={() => {
                setAuthMode("phone");
                setErrors({});
                setSubmitted(false);
              }}
              className="w-full h-11 rounded-full bg-foreground text-background font-medium text-base flex items-center justify-center hover:opacity-90 active:scale-[0.99] border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f] transition-all cursor-pointer select-none"
            >
              <div className="w-[220px] max-w-full flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 shrink-0 stroke-[2.5]" />
                </span>
                <span className="whitespace-nowrap">Continue with phone</span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthMode("email");
                setErrors({});
                setSubmitted(false);
              }}
              className="w-full h-11 rounded-full bg-foreground text-background font-medium text-base flex items-center justify-center hover:opacity-90 active:scale-[0.99] border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f] transition-all cursor-pointer select-none"
            >
              <div className="w-[220px] max-w-full flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 shrink-0 stroke-[2.5]" />
                </span>
                <span className="whitespace-nowrap">Continue with email</span>
              </div>
            </button>
          )}
        </div>

        {/* OR Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/80 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-base">
            <span className="bg-white dark:bg-[#2f2f2f] px-3 text-muted-foreground font-normal tracking-wider">
              or
            </span>
          </div>
        </div>

        {/* Form: Email or Phone */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {authMode === "email" ? (
            <div>
              <div
                className={cn(
                  "h-12 rounded-full bg-background border border-border/80 dark:border-none px-4 flex items-center transition-all",
                  "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-card",
                  errors.email && (touched.email || submitted)
                    ? "border-red-500/80 focus-within:ring-red-500"
                    : "border-border/80 focus-within:ring-blue-500"
                )}
              >
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email || submitted) {
                      setErrors(validateEmail(e.target.value));
                    }
                  }}
                  onInput={(e) => {
                    setEmail(e.currentTarget.value);
                    if (touched.email || submitted) {
                      setErrors(validateEmail(e.currentTarget.value));
                    }
                  }}
                  onBlur={() => handleBlur("email")}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full h-full bg-transparent text-base placeholder:text-foreground outline-none border-none focus:outline-none focus:ring-0"
                />
              </div>
              {errors.email && (touched.email || submitted) && (
                <p className="mt-1 text-xs text-red-500 px-3">{errors.email}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Row 1: Country Code Dropdown */}
              <CountDropdownMenu
                value={countryCode}
                onChange={(c) => {
                  setCountryCode(c.code);
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
              />

              {/* Row 2: Phone Number Input */}
              <div>
                <div
                  className={cn(
                    "h-12 rounded-full bg-background border border-border/80 dark:border-none px-4 flex items-center gap-3 transition-all",
                    "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-card",
                    errors.phone && (touched.phone || submitted)
                      ? "border-red-500/80 focus-within:ring-red-500"
                      : "border-border/80 focus-within:ring-blue-500"
                  )}
                >
                  <span className="text-base text-foreground font-normal select-none shrink-0 pl-1">
                    {selectedCountry.dial_code}
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (touched.phone || submitted) {
                        setErrors(validatePhone(e.target.value));
                      }
                    }}
                    onBlur={() => handleBlur("phone")}
                    placeholder="Phone number"
                    className="w-full h-full bg-transparent text-base placeholder:text-foreground outline-none border-none focus:outline-none focus:ring-0"
                  />
                </div>
                {errors.phone && (touched.phone || submitted) && (
                  <p className="mt-1 text-xs text-red-500 px-3">{errors.phone}</p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-foreground text-background font-medium text-base hover:opacity-90 active:scale-[0.99] border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f] transition-all cursor-pointer select-none disabled:pointer-events-auto disabled:cursor-not-allowed flex items-center justify-center text-center leading-none"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin text-background" />
            ) : (
              "Continue"
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground px-2 pt-1 leading-relaxed select-none">
            By continuing, you agree to our{" "}
            <Link
              href="/support/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full items-center gap-0.5 align-baseline text-muted-foreground hover:text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
            >
              <span>Terms of Use</span>
              <AnimatedArrowUpRight size={14} className="shrink-0" />
            </Link>{" "}
            and{" "}
            <Link
              href="/support/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full items-center gap-0.5 align-baseline text-muted-foreground hover:text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
            >
              <span>Privacy Policy</span>
              <AnimatedArrowUpRight size={14} className="shrink-0" />
            </Link>
            .
          </p>
        </form>
      </div>
    </BottomSheet>
  );
}

export default LoginModal;
