"use client";

import Link from "next/link";
import { CloseAIIcon } from "@/components/brand/logo";
import { Globe, ArrowUpRight, Copy, Copyright } from "lucide-react";
import { AnimatedArrowUpRight, AnimatedComingSoonText } from "@/components/ui/animated";

export function Footer() {
  return (
    <footer className="w-full bg-background text-foreground pt-10 pb-5 select-none">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-8">
        {/* Multi-Tier 5-Column Links Grid matching */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 pb-16 border-b border-border/80">
          {/* Column 1: Research & Latest Advancements */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Research
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Research Index
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Research Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Economic Research
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Latest Advancements
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    GPT-6 Astra
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    GPT-5.6
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    GPT-5.5
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    GPT-5.3 Instant
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    GPT-5.3-Codex
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 2: Products & API Platform */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Products
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/c"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>CloseAI Chat</span>
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>CloseAI Business</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>CloseAI Education</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>CloseAI Enterprise</span>
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/product/features"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Codex
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Release Notes
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                API Platform
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/product/api-docs"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/product/api-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>Docs</span>
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Business & Developers */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Business
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Resources
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Customer Stories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Partner Network
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>Contact Sales</span>
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Developers
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/product/api-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>Apps SDK</span>
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Open Models
                  </Link>
                </li>
                <li>
                  <Link
                    href="/product/api-docs"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>Developer Forum</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Company, More & Support */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Company
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/company/about"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/careers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>Careers</span>
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    News
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/contact"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                More
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Stories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/foundation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Academy
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Livestreams
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Podcast
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 5: Safety, Terms & Policies */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Safety
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/research/safety"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Safety Approach
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/safety"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>Deployment Safety</span>
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/safety"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Security & Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/safety"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Trust & Transparency
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Terms & Policies
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/support/terms"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/privacy"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
                Support
              </h4>
              <ul className="footer-group space-y-2.5 text-md">
                <li>
                  <Link
                    href="/support/help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors"
                  >
                    <span>Help Center</span>
                    <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Center Language, & Social Links (Single divider above) */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[15px] text-muted-foreground">
          {/* Left: Brand & Copyright */}
          <div className="flex flex-wrap items-center justify-center text-base md:justify-start gap-x-1 text-center md:text-left">
            <Copyright className="w-4 h-4" />
            <span className="text-muted-foreground/80">
              2026 CloseAI. All rights reserved.
            </span>
          </div>

          {/* Center: Language Switcher (disabled — Coming soon on hover/tap) */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              aria-disabled="true"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="group flex items-center text-base gap-1.5 px-4 py-2 rounded-full cursor-not-allowed select-none bg-white hover:bg-secondary/60 text-black/60 dark:bg-[#2f2f2f] dark:hover:bg-[#2f2f2f]/60 dark:text-white/60 text-muted-foreground transition-colors whitespace-nowrap"
            >
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <AnimatedComingSoonText
                label="English (United States)"
                comingSoonText="Coming soon"
                align="start"
              />
            </button>
          </div>

          {/* Right / Middle: Social Links with ArrowUpRight Icons */}
          <div className="footer-group flex flex-wrap text-base items-center justify-center md:justify-end gap-x-5 gap-y-2">
            <a
              href="https://x.com/ayanali_x"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap"
            >
              <span>X</span>
              <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </a>
            <a
              href="https://www.reddit.com/user/ayanali-redd1t"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap"
            >
              <span>Reddit</span>
              <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </a>
            <a
              href="https://github.com/ayanali-git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap"
            >
              <span>GitHub</span>
              <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </a>
            <a
              href="https://www.linkedin.com/in/ayanali-in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap"
            >
              <span>LinkedIn</span>
              <AnimatedArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
