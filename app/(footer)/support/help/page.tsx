'use client';

import React, { useState, useMemo, useRef } from 'react';
import { HelpCircle, FileText, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPlusMinus, AnimatedSearchClose } from '@/components/ui/animated';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'getting-started' | 'account-billing' | 'troubleshooting';
}

const FAQS: FAQItem[] = [
  {
    id: 1,
    question: "How do I reset my password?",
    answer:
      "To reset your password, click on the \"Forgot password?\" link on the sign-in page. Enter the email address associated with your account, and we will immediately send you a secure recovery link. Follow the instructions in the email to choose a new password. If you don't see the email within a few minutes, please check your spam or junk folder.",
    category: "account-billing",
  },
  {
    id: 2,
    question: "What are the usage limits for the free tier?",
    answer:
      "Free accounts include generous daily conversation limits, basic document analysis, and standard response speed. Rate limits are applied dynamically during peak traffic to preserve system stability for all users. You can review your active quota and usage statistics anytime in your Account Dashboard.",
    category: "account-billing",
  },
  {
    id: 3,
    question: "Can I use generated content for commercial purposes?",
    answer:
      "Yes. You retain full ownership rights to all text, images, code snippets, and creative assets you generate on the platform, subject to our standard Terms of Service. You are welcome to use generated material for client deliverables, published products, advertising campaigns, and enterprise software.",
    category: "getting-started",
  },
  {
    id: 4,
    question: "How do I upgrade to a team plan?",
    answer:
      "You can upgrade to a Team plan anytime by visiting Settings > Billing & Plans. Select the Team tier, choose your desired seat count, and complete checkout. Upgrading grants immediate access to shared workspaces, collaborative prompt repositories, consolidated billing, and higher usage limits.",
    category: "account-billing",
  },
  {
    id: 5,
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay. For enterprise annual plans, we also offer custom invoicing with ACH wire transfer terms.",
    category: "account-billing",
  },
  {
    id: 6,
    question: "How is my data protected and kept private?",
    answer:
      "Security and privacy are core to our architecture. All communications are encrypted end-to-end using TLS 1.3, and data stored at rest uses AES-256 encryption. We never use your private conversations or proprietary organizational prompts to train public foundation models without your explicit consent.",
    category: "troubleshooting",
  },
  {
    id: 7,
    question: "Can I cancel or change my subscription at any time?",
    answer:
      "Yes. You have complete flexibility to upgrade, downgrade, or cancel your subscription at any moment directly from your Billing settings. If you choose to cancel, your premium features stay active until the end of your prepaid billing period, with zero hidden cancellation fees.",
    category: "account-billing",
  },
  {
    id: 8,
    question: "What should I do if I experience slow responses or errors?",
    answer:
      "If you experience intermittent delays or a temporary 429 rate limit error, wait a few seconds and retry your request. You can also check our status page for any scheduled maintenance. For mission-critical workloads, upgrading to Pro or Ultra Pro provides priority compute routing and dedicated high-throughput pipelines.",
    category: "troubleshooting",
  },
];

export default function HelpPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  // Filter FAQs based on active search or selected category
  const filteredFAQs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const matchesCategory =
        !selectedCategory || faq.category === selectedCategory;
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleItem = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  };

  return (
    <div className="py-12 sm:py-16 w-full max-w-4xl mx-auto min-w-0 select-none">
      <header className="mb-10 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6">
          How can we help?
        </h1>
        <div className="relative max-w-2xl mx-auto group">
          <button
            type="button"
            onClick={() => {
              if (searchQuery) {
                setSearchQuery('');
                inputRef.current?.focus();
              } else {
                inputRef.current?.focus();
              }
            }}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors z-10",
              searchQuery
                ? "text-foreground cursor-pointer hover:opacity-80"
                : "text-muted-foreground group-focus-within:text-foreground cursor-text"
            )}
            aria-label={searchQuery ? "Clear search" : "Search"}
          >
            <AnimatedSearchClose
              isOpen={Boolean(searchQuery.trim())}
              size={18}
            />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
              }
            }}
            placeholder="Search for articles, guides, and FAQs..."
            className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-card border border-border/80 dark:border-none rounded-full text-base focus:outline-none text-foreground placeholder:text-muted-foreground focus:placeholder:text-foreground transition-colors"
          />
        </div>
      </header>

      {/* Category Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-12 sm:mb-16">
        <button
          type="button"
          onClick={() => handleCategoryClick('getting-started')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-3xl cursor-pointer text-left transition-all duration-200",
            selectedCategory === 'getting-started'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4 text-foreground" />
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Getting Started
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Basics of using our web interface and features.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryClick('account-billing')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-3xl cursor-pointer text-left transition-all duration-200",
            selectedCategory === 'account-billing'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <Settings className="h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4 text-foreground" />
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Account & Billing
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage subscriptions, usage limits, and invoices.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryClick('troubleshooting')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-3xl cursor-pointer text-left transition-all duration-200",
            selectedCategory === 'troubleshooting'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4 text-foreground" />
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Troubleshooting
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Solutions for common errors and technical issues.
          </p>
        </button>
      </div>

      {/* FAQs Section */}
      <section aria-labelledby="faqs-heading">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <h2
              id="faqs-heading"
              className="text-xl sm:text-2xl font-semibold text-foreground"
            >
              Frequently Asked Questions
            </h2>
            {selectedCategory && (
              <span className="text-sm px-3 py-1.5 rounded-full bg-secondary text-foreground font-medium">
                {selectedCategory === 'getting-started'
                  ? 'Getting Started'
                  : selectedCategory === 'account-billing'
                  ? 'Account & Billing'
                  : 'Troubleshooting'}
              </span>
            )}
          </div>
        </div>

        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-card">
            <p className="text-xl text-foreground font-medium mb-1">
              No questions found
            </p>
            <p className="text-base text-muted-foreground mb-4">
              We couldn&apos;t find anything matching &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary px-4 py-2 rounded-sm transition-colors"
            >
              Reset filter & search
            </button>
          </div>
        ) : (
          <div>
            {filteredFAQs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={cn(
                    "group rounded-3xl border-b transition-all duration-200 overflow-hidden",
                    isOpen
                      ? "bg-secondary"
                      : "border-b border-border/80 hover:bg-secondary"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <span className="font-medium text-base sm:text-lg text-foreground transition-colors">
                      {faq.question}
                    </span>
                    <span className="shrink-0 p-1 rounded-md text-muted-foreground group-hover:text-foreground transition-colors">
                      <AnimatedPlusMinus
                        open={isOpen}
                        size={18}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: {
                            type: "spring",
                            stiffness: 450,
                            damping: 32,
                            mass: 0.7,
                          },
                          opacity: { duration: 0.2 },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-5 pt-0 text-sm sm:text-base text-muted-foreground leading-relaxed mt-1 pt-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
