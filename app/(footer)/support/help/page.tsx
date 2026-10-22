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
  category: 'getting-started' | 'account-billing' | 'troubleshooting' | 'privacy' | 'careers' | 'brand';
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
      "Yes. You retain full ownership rights to all text, images, code snippets, and creative content you generate on the platform, subject to our standard Terms of Service. You are welcome to use generated material for client deliverables, published products, advertising campaigns, and enterprise software.",
    category: "getting-started",
  },
  {
    id: 4,
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay. For enterprise annual plans, we also offer custom invoicing with ACH wire transfer terms.",
    category: "account-billing",
  },
  {
    id: 5,
    question: "What should I do if my request times out or fails to load?",
    answer:
      "If you experience a network timeout, check your internet connection and verify that firewall proxies or content filters are not blocking CloseAI endpoints. You can also inspect system health on our Status page. If problems persist, try opening a private browsing window or clearing your browser's local cache.",
    category: "troubleshooting",
  },
  {
    id: 6,
    question: "Can I cancel or change my subscription at any time?",
    answer:
      "Yes. You have complete flexibility to upgrade, downgrade, or cancel your subscription at any moment directly from your Billing settings. If you choose to cancel, your premium features stay active until the end of your prepaid billing period, with zero hidden cancellation fees.",
    category: "account-billing",
  },
  {
    id: 7,
    question: "What should I do if I experience slow responses or errors?",
    answer:
      "If you experience intermittent delays or a temporary 429 rate limit error, wait a few seconds and retry your request. You can also check our status page for any scheduled maintenance. For mission-critical workloads, upgrading to Pro or Ultra Pro provides priority compute routing and dedicated high-throughput pipelines.",
    category: "troubleshooting",
  },
  {
    id: 8,
    question: "How is my personal and organizational data protected at CloseAI?",
    answer:
      "Security and privacy are core to our architecture. All customer communications are encrypted in transit using TLS 1.3, and data stored at rest is secured with AES-256 encryption. We employ strict role-based access controls, zero-trust network boundaries, regular third-party penetration testing, and continuous vulnerability monitoring across our systems.",
    category: "privacy",
  },
  {
    id: 9,
    question: "Are my chat conversations or uploaded files used to train AI models?",
    answer:
      "No. By default, CloseAI does not use your private conversations, document uploads, or custom organizational prompts to train or improve our public foundation models without your explicit, opt-in consent. Business, Team, and Enterprise accounts benefit from contractual zero-data-retention and data isolation guarantees.",
    category: "privacy",
  },
  {
    id: 10,
    question: "What compliance standards and privacy regulations does CloseAI follow?",
    answer:
      "CloseAI adheres to global data protection laws and compliance frameworks, including the EU General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and SOC 2 Type II security principles. We sign standard Data Processing Addendums (DPAs) for corporate accounts and offer regional compute residency upon request.",
    category: "privacy",
  },
  {
    id: 11,
    question: "How can I export my data or permanently delete my CloseAI account?",
    answer:
      "You have full ownership and control over your data. You can download an export of your conversation history, prompt logs, and account metadata anytime through Settings > Data Controls > Export Data. If you choose to delete your account, your profile and all associated data records are permanently expunged across all production and backup databases within 30 days.",
    category: "privacy",
  },
  {
    id: 12,
    question: "Where can I find and apply for open roles at CloseAI?",
    answer:
      "You can explore all our current career openings on our Careers > Open Roles page. We regularly post engineering, research, product, security, and operations positions across our global offices and remote locations. Each listing includes detailed role expectations, required skills, and a direct application form.",
    category: "careers",
  },
  {
    id: 13,
    question: "What is the hiring and interview process for candidates?",
    answer:
      "Our interview journey is designed to be rigorous, transparent, and respectful of your time. It generally includes: 1) Initial recruiter sync, 2) Technical or domain deep dive with the hiring manager, 3) Practical problem-solving or system design collaboration, and 4) Culture, ethics, and leadership conversation. We strive to provide feedback at every stage within days.",
    category: "careers",
  },
  {
    id: 14,
    question: "Does CloseAI support remote work and international hiring?",
    answer:
      "Yes. While we maintain collaborative office hubs in San Francisco, London, Toronto, and India, many engineering and research roles support remote or hybrid arrangements. We provide home office stipends, co-working space access, and competitive global compensation benchmarked to market rates.",
    category: "careers",
  },
  {
    id: 15,
    question: "What benefits, health, and parental leave perks do you provide?",
    answer:
      "We offer comprehensive health, dental, and vision insurance with 100% premium coverage for employees, generous parental leave for all new parents, 401(k) / retirement matching, mental wellness support, flexible paid time off, continuous learning budgets, and equity packages designed for meaningful long-term ownership.",
    category: "careers",
  },
  {
    id: 16,
    question: "Where can I download the official CloseAI logos and brand kit?",
    answer:
      "Official brand kit, including vector SVG logos, high-resolution PNGs, squircle app icons, and monochrome color palettes, are available for download on our Brand Guidelines page. Please always use our official files rather than redrawing or scraping third-party graphics.",
    category: "brand",
  },
  {
    id: 17,
    question: "How should I format co-branding partner lockups with CloseAI?",
    answer:
      "Partner co-branding must strictly follow our approved horizontal lockup format: CloseAI | Partner Brand. Both marks should share optical balance and visual weight, separated by a thin hairline vertical divider (#E5E5E5 or muted white on dark backgrounds). Logos must never be stacked vertically, distorted, or merged into compound symbols.",
    category: "brand",
  },
  {
    id: 18,
    question: "Do I need permission to use the CloseAI brand on media or merchandise?",
    answer:
      "Standard editorial, press coverage, and educational references following our guidelines do not require advance written approval. However, commercial partnerships, marketing co-promotions, book publications, and physical merchandise require written permission. You can submit co-marketing requests to brand@closeai.com.",
    category: "brand",
  },
  {
    id: 19,
    question: "What are the rules regarding emblem clear space and color contrast?",
    answer:
      "The CloseAI geometric knot emblem requires clear space equal to at least 50% of its height around all boundaries to preserve visual integrity. Never alter the petal geometry, stretch the logo, or place it on busy textured backgrounds. Always choose the high-contrast black emblem on light surfaces and the pure white emblem on dark surfaces.",
    category: "brand",
  },
  {
    id: 20,
    question: "How do I create an account and start a new conversation?",
    answer:
      "To get started, click the 'Sign Up' button on the homepage and register using your email address, Google, or GitHub account. Once authenticated, you will be taken directly to the main workspace. Type your prompt or question in the input bar at the bottom and press Enter to start your first conversation.",
    category: "getting-started",
  },
  {
    id: 21,
    question: "What file formats can I upload for analysis in chat?",
    answer:
      "CloseAI supports analyzing documents, code repositories, spreadsheets, and image assets. You can drag and drop or upload PDF, TXT, DOCX, CSV, JSON, PNG, and JPEG files directly into the prompt bar. Our multimodal models extract text, summarize contents, answer complex queries, and visualize tabular data.",
    category: "getting-started",
  },
  {
    id: 22,
    question: "How do I organize, rename, or share my conversation threads?",
    answer:
      "All your previous chats are automatically saved in the left sidebar sorted chronologically. Hover over any thread to rename its title or delete it. You can also generate a secure public view-only link to share helpful discussions and code snippets with team members or clients.",
    category: "getting-started",
  },
  {
    id: 23,
    question: "What should I do if the AI stops generating or cuts off mid-response?",
    answer:
      "If a response truncates due to token generation limits or intermittent packet loss, simply type 'continue' in the input bar and the model will seamlessly resume from where it left off. Alternatively, click the 'Regenerate' button next to the assistant's message to produce a fresh, uninterrupted answer.",
    category: "troubleshooting",
  },
  {
    id: 24,
    question: "Why am I seeing a 'Failed to fetch' or 'WebSocket disconnected' message?",
    answer:
      "This error usually indicates a temporary network hiccup, aggressive browser extension (such as script blockers), or strict corporate VPN firewall blocking streaming WebSockets. Try pausing ad blockers, checking our Status page, or switching to an alternate network connection to restore streaming.",
    category: "troubleshooting",
  },
];

export default function HelpPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (
        cat &&
        ['getting-started', 'account-billing', 'troubleshooting', 'privacy', 'careers', 'brand'].includes(cat)
      ) {
        setSelectedCategory(cat);
      }
    }
  }, []);

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
            placeholder="Search questions"
            className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-card border border-border/80 dark:border-none rounded-full text-base outline-none focus:outline-none text-foreground placeholder:text-foreground transition-all"
          />
        </div>
      </header>

      {/* Category Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16">
        <button
          type="button"
          onClick={() => handleCategoryClick('getting-started')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-sm cursor-pointer text-left transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
            selectedCategory === 'getting-started'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Essentials
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Basics of using our web interface and features.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryClick('account-billing')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-sm cursor-pointer text-left transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
            selectedCategory === 'account-billing'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Billing
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage subscriptions, usage limits, and invoices.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryClick('troubleshooting')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-sm cursor-pointer text-left transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
            selectedCategory === 'troubleshooting'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Support
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Solutions for common errors and technical issues.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryClick('privacy')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-sm cursor-pointer text-left transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
            selectedCategory === 'privacy'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Security
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Data protection, encryption standards, model training privacy, and compliance.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryClick('careers')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-sm cursor-pointer text-left transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
            selectedCategory === 'careers'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Hiring
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Explore open opportunities, application process, and employee benefits.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryClick('brand')}
          className={cn(
            "p-5 sm:p-6 bg-card rounded-sm cursor-pointer text-left transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
            selectedCategory === 'brand'
              ? "border border-border/80 dark:border-none bg-secondary"
              : "border border-border/80 dark:border-none hover:bg-secondary"
          )}
        >
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-foreground">
            Identities
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Brand marks, approved lockups, asset downloads, and media permissions.
          </p>
        </button>
      </div>

      {/* FAQs Section */}
      <section aria-labelledby="faqs-heading">
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
          <h2
            id="faqs-heading"
            className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight"
          >
            Frequently Asked Questions
          </h2>
          {selectedCategory && (
            <span className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-secondary text-foreground font-medium shrink-0 ml-auto select-none">
              {selectedCategory === 'getting-started'
                ? 'Essentials'
                : selectedCategory === 'account-billing'
                ? 'Billing'
                : selectedCategory === 'troubleshooting'
                ? 'Support'
                : selectedCategory === 'privacy'
                ? 'Security'
                : selectedCategory === 'careers'
                ? 'Hiring'
                : 'Identities'}
            </span>
          )}
        </div>

        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-base text-foreground font-medium mb-1">
              No questions found
            </p>
          </div>
        ) : (
          <div>
            {filteredFAQs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={cn(
                    "group rounded-sm border-b transition-all duration-200 overflow-hidden",
                    isOpen
                      ? "bg-secondary"
                      : "border-b border-border/80 hover:bg-secondary"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer rounded-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
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
