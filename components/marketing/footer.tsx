"use client";

import Link from "next/link";
import { CloseAIIcon } from "@/components/brand/logo";
import { Globe, ArrowUpRight, Copy, Copyright } from "lucide-react";
import { AnimatedArrowUpRight } from "@/components/ui/animated";
import { LangDropdownMenu } from "@/components/ui/lang-dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

export function Footer() {
  const { user } = useAuth();
  return (
    <footer className="w-full bg-background text-foreground pt-10 pb-5 select-none">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-8">
        {/* Multi-Tier 5-Column Links Grid matching */}
        <div className="footer-group grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 pb-16 border-b border-border/80">
          {/* Column 1: Research & Latest Advancements */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Research
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Research Index
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Research Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Economic Research
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Latest Advancements
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    GPT-6.1 Terra
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    GPT-6 Astra
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    GPT-5.6
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    GPT-5.5
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    GPT-5.4
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 2: Products & API Platform */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Products
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href={user ? "/c" : "/gc"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>CloseAI</span>
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>CloseAI Business</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>CloseAI Education</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>CloseAI Enterprise</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/product/features"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Codex
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Release Notes
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                API Platform
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/product/api-docs"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/product/api-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>Docs</span>
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Business & Developers */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Business
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Resources
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Customer Stories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business/enterprise"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Partner Network
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>Contact Sales</span>
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Developers
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/product/api-docs"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>Apps SDK</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/overview"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Open Models
                  </Link>
                </li>
                <li>
                  <Link
                    href="/product/api-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>Developer Forum</span>
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Company, More & Support */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/company/about"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/careers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>Careers</span>
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    News
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/contact"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/brand"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>Brand</span>
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                More
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Stories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/foundation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Academy
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/company/blog"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Safety
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/research/safety"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Safety Approach
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/safety"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>Deployment Safety</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/safety"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Security & Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/research/safety"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Trust & Transparency
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Terms & Policies
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/support/terms"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/privacy"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Support
              </h4>
              <ul className="space-y-2.5 text-base">
                <li>
                  <Link
                    href="/support/help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground transition-colors -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span>Help Center</span>
                    <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Center Language, & Social Links (Single divider above) */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-base text-muted-foreground">
          {/* Center: Social Links with ArrowUpRight Icons */}
          <div className="footer-group flex flex-wrap text-base items-center justify-center md:justify-end gap-x-5 gap-y-2">
            <a
              href="https://www.linkedin.com/in/ayanali-in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span>LinkedIn</span>
              <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
            </a>
            <a
              href="https://github.com/ayanali-git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span>GitHub</span>
              <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
            </a>
            <a
              href="https://x.com/ayanali_x"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span>X</span>
              <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
            </a>
            <a
              href="https://www.instagram.com/ayanali_ig/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span>Instagram</span>
              <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
            </a>
            <a
              href="https://linktr.ee/ayanali_tree"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground transition-colors whitespace-nowrap -mx-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span>LinkTree</span>
              <AnimatedArrowUpRight className="w-5 h-5 stroke-[2]" />
            </a>
          </div>
          {/* Left: Brand & Copyright */}
          <div className="flex flex-wrap items-center justify-center text-base md:justify-start gap-x-1 text-center md:text-left">
            <Copyright className="w-5 h-5" />
            <span className="text-muted-foreground">
              2026 CloseAI. All rights reserved.
            </span>
          </div>

          {/* Right: Language Switcher */}
          <div className="flex items-center justify-center">
            <LangDropdownMenu />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
