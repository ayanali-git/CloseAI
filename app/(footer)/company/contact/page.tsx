"use client";

import { useState } from "react";
import { ArrowUpRight, Asterisk, Mail, MapPin, Loader } from "lucide-react";
import { AnimatedArrow, AnimatedArrowUpRight } from "@/components/ui/animated";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (fields?: Partial<Record<keyof FormErrors, string>>) => {
    const n = fields?.name ?? name;
    const e = fields?.email ?? email;
    const m = fields?.message ?? message;
    const newErrors: FormErrors = {};

    if (!n.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!e.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) {
      newErrors.email = "Please enter a valid email";
    }

    if (!m.trim()) {
      newErrors.message = "Message is required";
    } else if (m.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    return newErrors;
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleChange = (
    field: keyof FormErrors,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    if (touched[field] || submitted) {
      setErrors(validate({ [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTouched({ name: true, email: true, message: true });

    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to send message");
        }

        toast.success("Thank you! Your message has been sent.");
        setName("");
        setEmail("");
        setMessage("");
        setErrors({});
        setTouched({});
        setSubmitted(false);
      } catch (err: any) {
        toast.error(
          err?.message || "Failed to send message. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="py-12 sm:py-16 w-full max-w-4xl mx-auto min-w-0 px-4">
      <header className="mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6">
          Contact Us
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground">
          Get in touch with the closeAI team for support, press, and
          partnerships.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 w-full">
        <div className="w-full p-6 sm:p-8 md:p-10 bg-card border border-border/80 dark:border-none rounded-sm">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-foreground">
            Get in Touch
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                className="flex items-center text-base font-medium mb-1.5 text-foreground"
                htmlFor="name"
              >
                Name<Asterisk size={12} className="w-3 h-3 text-red-500 -translate-y-1" />
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => handleChange("name", e.target.value, setName)}
                onBlur={() => handleBlur("name")}
                className={`w-full p-3 bg-card border rounded-xl focus:outline-none text-base placeholder:text-foreground transition-colors ${
                  errors.name && touched.name
                    ? "border-red-500/80"
                    : "border-border/80"
                }`}
                placeholder="Full name"
              />
              {errors.name && touched.name && (
                <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                className="flex items-center text-base font-medium mb-1.5 text-foreground"
                htmlFor="email"
              >
                Email<Asterisk size={12} className="w-3 h-3 text-red-500 -translate-y-1" />
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) =>
                  handleChange("email", e.target.value, setEmail)
                }
                onBlur={() => handleBlur("email")}
                className={`w-full p-3 bg-card border rounded-xl focus:outline-none text-base placeholder:text-foreground transition-colors ${
                  errors.email && touched.email
                    ? "border-red-500/80"
                    : "border-border/80"
                }`}
                placeholder="Email address"
              />
              {errors.email && touched.email && (
                <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                className="flex items-center text-base font-medium mb-1.5 text-foreground"
                htmlFor="message"
              >
                Message<Asterisk size={12} className="w-3 h-3 text-red-500 -translate-y-1" />
              </label>
              <textarea
                id="message"
                rows={5}
                required
                value={message}
                onChange={(e) =>
                  handleChange("message", e.target.value, setMessage)
                }
                onBlur={() => handleBlur("message")}
                placeholder="How can we help?"
                className={cn(
                  "w-full min-h-[120px] max-h-[240px] p-3 bg-card rounded-2xl rounded-br-[4px] text-sm sm:text-base leading-relaxed placeholder:text-foreground transition-colors resize-y outline-none border",
                  errors.message && touched.message
                    ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-border/80"
                )}
              />
              {errors.message && touched.message && (
                <p className="mt-1.5 text-sm text-red-500">{errors.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-foreground text-background font-medium text-base hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Message</span>
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="w-full space-y-8 flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
              Inquiries
            </h2>
            <div className="w-full space-y-3">
              <a
                href="mailto:support@trycloseai.vercel.app"
                className="w-full group flex items-center justify-between p-4 bg-card hover:bg-secondary/50 border border-border/80 dark:border-none rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl border border-border/80 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-base">
                      Support
                    </div>
                    <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      support@trycloseai.vercel.app
                    </div>
                  </div>
                </div>
                <AnimatedArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>

              <a
                href="mailto:press@trycloseai.vercel.app"
                className="w-full group flex items-center justify-between p-4 bg-card hover:bg-secondary/50 border border-border/80 dark:border-none rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl border border-border/80 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-base">
                      Press
                    </div>
                    <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      press@trycloseai.vercel.app
                    </div>
                  </div>
                </div>
                <AnimatedArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
              Office
            </h2>
            <a
              href="https://www.google.com/maps/search/?api=1&query=1455+3rd+St%2C+San+Francisco%2C+CA+94158%2C+USA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full group flex items-center justify-between p-4 bg-card hover:bg-secondary/50 border border-border/80 dark:border-none rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl border border-border/80 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-base mb-0.5">
                    CloseAI
                  </div>
                  <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    1455 3rd Street
                    <br />
                    San Francisco, CA 94158, USA
                  </div>
                </div>
              </div>
              <AnimatedArrow
                size={18}
                className="text-muted-foreground group-hover:text-foreground transition-colors"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
