'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AnimatedArrow,
  AnimatedArrowUpRight,
} from '@/components/ui/animated';
import { Heart, Clock, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleItem {
  id: string;
  title: string;
  team: string;
  location: string;
  url?: string;
}

// No static mock data currently
const ROLES_DATA: RoleItem[] = [];

// DiceBear glass avatars generator matching main page
const glassAvatar = (seed: string) =>
  `https://api.dicebear.com/10.x/glass/svg?tags=animation&seed=${encodeURIComponent(
    seed
  )}`;

export default function CareersPage() {

  // Sibling hover-dimming state for Life at CloseAI cards (identical to main page)
  const [hoveredStory, setHoveredStory] = useState<number | null>(null);

  const getCardColor = (hoveredIndex: number | null, i: number) => {
    if (hoveredIndex === null) return 'text-foreground';
    return hoveredIndex === i ? 'text-foreground' : 'text-muted-foreground';
  };

  const getOpacity = (hoveredIndex: number | null, i: number) => {
    if (hoveredIndex === null) return 'opacity-100';
    return hoveredIndex === i ? 'opacity-100' : 'opacity-50';
  };

  return (
    <div className="py-12 sm:py-20 w-full max-w-5xl mx-auto min-w-0 select-none">
      {/* 1. HERO SECTION */}
      <section className="max-w-3xl mb-16 sm:mb-24">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Careers
        </p>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-foreground mb-6 leading-[1.08]">
          Develop safe, beneficial AI systems
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10">
          Join us in shaping the future of technology for the benefit of all.
        </p>

        {/* Hero CTA Buttons: Contact recruiting (left, without icon) & Open roles (right) */}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            asChild
            className="group rounded-full h-12 px-4 bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white transition-all cursor-pointer inline-flex items-center justify-center font-medium text-base"
          >
            <Link href="/company/contact">
              <span>Contact recruiting</span>
            </Link>
          </Button>

          <Button
            asChild
            className="group rounded-full h-12 px-4 bg-foreground text-background hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center justify-center font-medium text-base"
          >
            <Link
              href="/company/careers/open-roles"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5"
            >
              <span>Open roles</span>
              <AnimatedArrowUpRight size={18} strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </section>

      {/* 2. PHILOSOPHY LEAD & STATEMENT (VALUES & OPERATING PRINCIPLES) */}
      <section className="mb-16 sm:mb-24 border-t border-border/80 pt-16 sm:pt-20">
        <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground max-w-3xl leading-snug mb-12 sm:mb-16">
          AI must be developed with knowledge of and respect for humanity’s full
          spectrum of experience and perspectives.
        </h2>

        <div className="max-w-3xl space-y-12 text-muted-foreground text-base sm:text-lg leading-relaxed">
          {/* Values */}
          <div className="space-y-4">
            <p>
              <strong className="text-foreground font-semibold">Values:</strong>{' '}
              These values define what we consider to be the most important things.
              They guide our decision-making. We believe that channeling these
              values is the most promising way to achieve our mission.
            </p>
            <ul className="space-y-4 pl-4 sm:pl-6 list-disc">
              <li>
                <strong className="text-foreground font-semibold">
                  Humanity first.
                </strong>{' '}
                Working at CloseAI means being part of a team that is passionate
                about benefitting people and society through our work. We build
                AI to elevate humanity.
              </li>
              <li>
                <strong className="text-foreground font-semibold">
                  Act with humility.
                </strong>{' '}
                Humility reminds us to recognize the limits of our own knowledge
                and to remain open to new ideas, perspectives, and the possibility
                of being wrong. This mindset influences our iterative approach to
                deployment, and the reintegration of feedback into our research.
              </li>
              <li>
                <strong className="text-foreground font-semibold">
                  Feel the AGI.
                </strong>{' '}
                AGI will be powerful in an unprecedented way, with potential for
                upside and downside. Building it requires rigor and discipline,
                boundless imagination, and a deep sense of responsibility. We
                approach research and product development with respect for the
                transformative technology we are helping create, and the coupled
                benefits, changes, and risks that come along with it.
              </li>
              <li>
                <strong className="text-foreground font-semibold">
                  Ship joy.
                </strong>{' '}
                Through our research we develop products that can transform how
                people live their lives. Our technology reflects an internal
                culture of optimism for the future and stewardship of our
                mission.
              </li>
            </ul>
          </div>

          {/* Operating Principles */}
          <div className="space-y-4">
            <p>
              <strong className="text-foreground font-semibold">
                Operating Principles:
              </strong>{' '}
              These principles define how we work together. They are important
              for establishing our operating culture.
            </p>
            <ul className="space-y-4 pl-4 sm:pl-6 list-disc">
              <li>
                <strong className="text-foreground font-semibold">
                  Find a way.
                </strong>{' '}
                We believe in finding a way to do the things that matter. We give
                agency to individuals and teams to find an approach that works.
                Ideas come from anywhere, regardless of title or tenure.
              </li>
              <li>
                <strong className="text-foreground font-semibold">
                  Creativity over control.
                </strong>{' '}
                We look to find creative solutions, even if sometimes imperfect,
                over rigidity and control. Our approach to solving problems is
                based on best principles (first principles and best practices).
              </li>
              <li>
                <strong className="text-foreground font-semibold">
                  Update quickly.
                </strong>{' '}
                We come in with a hypothesis and are willing to change our
                approach as we receive new information. We seek truth and adapt
                knowing that flexibility is key to progress on the path to AGI.
              </li>
              <li>
                <strong className="text-foreground font-semibold">
                  Intense focus.
                </strong>{' '}
                We are hard workers who are here to make an impact on the world.
                This intensity and resilience are pivotal to the mission, while
                clarity and focus enable us to make hard decisions.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. HERO TEAM PHOTO BANNER (SAME ROUNDED-SM AS MAIN PAGE BIG IMAGE) */}
      <section className="mb-20 sm:mb-28">
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-sm overflow-hidden bg-black transition-all duration-300">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80"
            alt="CloseAI team collaborating in workspace"
            loading="lazy"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </section>

      {/* 4. BENEFITS SECTION */}
      <section className="mb-20 sm:mb-28">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Benefits
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            All the reasons you&apos;ll thrive at CloseAI — designed to take care of
            you, your loved ones, and your future.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health & Wellness */}
          <div className="p-8 rounded-2xl border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Comprehensive health
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                100% employer-covered health, dental, and vision insurance for
                you and eligible dependents.
              </p>
              <ul className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>Premium medical, dental, and vision</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>Mental health and therapy sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>Annual wellness & fitness stipends</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Flexibility & Time Off */}
          <div className="p-8 rounded-2xl border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Flexibility & time off
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                We trust our team to manage their schedule with flexible hours
                and mandatory rejuvenation.
              </p>
              <ul className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>Unlimited PTO with mandatory minimums</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>Company-wide summer & winter recharge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>Up to 20 weeks fully paid parental leave</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Life & Family Support */}
          <div className="p-8 rounded-2xl border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Life & family support
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                Long-term financial security and generous resources for
                continuous personal and career growth.
              </p>
              <ul className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>High-conviction equity packages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>401(k) with 100% dollar-for-dollar match</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  <span>$3,000 annual learning & book allowance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL SPOTLIGHTS (SAME ROUNDED-SM AS MAIN PAGE OTHER THREE IMAGES) */}
      <section className="space-y-16 sm:space-y-24 mb-20 sm:mb-28">
        {/* Spotlight 1: Operate at the frontier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-5 order-2 md:order-1">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Frontier Research
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Operate at the frontier
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              At CloseAI, you’ll tackle high-dimensional challenges alongside
              world-class researchers, engineers, and ethicists. We move fast,
              validate rigorously, and deploy responsibly to billions of people.
            </p>
            <div className="pt-2">
              <Button
                asChild
                className="group rounded-full h-11 px-4 bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white transition-all cursor-pointer inline-flex items-center justify-center font-medium text-sm"
              >
                <Link href="/research/overview">
                  <span>Explore research</span>
                  <AnimatedArrow size={16} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="order-1 md:order-2 relative w-full aspect-[4/3] rounded-sm overflow-hidden bg-black transition-all duration-300">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80"
              alt="Researchers and engineers collaborating in frontier workspace"
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* Spotlight 2: Learning by doing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden bg-black transition-all duration-300">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80"
              alt="Team members collaborating and validating systems"
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="space-y-5">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Deployment & Safety
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Learning by doing
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              We believe the fastest and most rigorous way to understand complex
              frontier models is by building and testing them in the open with
              real users, strict guardrails, and real-world feedback loops.
            </p>
            <div className="pt-2">
              <Button
                asChild
                className="group rounded-full h-11 px-4 bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white transition-all cursor-pointer inline-flex items-center justify-center font-medium text-sm"
              >
                <Link href="/research/safety">
                  <span>Safety approach</span>
                  <AnimatedArrow size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LIFE AT CLOSEAI (IDENTICAL TO MAIN PAGE BOTTOM TWO ROWS CARDS WITH DICEBEAR GLASS AVATARS & SIBLING HOVER) */}
      <section className="mb-20 sm:mb-28 pt-12 border-t border-border/80">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Life at CloseAI
          </h2>
          <Link
            href="/company/blog"
            className="group inline-flex items-center text-md font-semibold text-foreground tracking-tight"
          >
            <span>View all</span>
            <AnimatedArrow size={18} />
          </Link>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8"
          onMouseLeave={() => setHoveredStory(null)}
        >
          {[
            {
              title:
                'Researchers evaluate reasoning abilities',
              category: 'Research',
              date: 'Sep 12, 2026',
              seed: 'Researchers evaluate reasoning abilities',
              href: '/research/overview',
            },
            {
              title:
                'How small teams ship world-class tools',
              category: 'Culture',
              date: 'Aug 28, 2026',
              seed: 'How small teams ship world-class tools',
              href: '/company/about',
            },
            {
              title:
                'Inference and GPU cluster orchestration',
              category: 'Engineering',
              date: 'Aug 14, 2026',
              seed: 'Inference and GPU cluster orchestration',
              href: '/business/enterprise',
            },
          ].map((story, i) => (
            <Link
              key={i}
              href={story.href}
              onMouseEnter={() => setHoveredStory(i)}
              onMouseLeave={() => setHoveredStory(null)}
              className={cn(
                'group flex flex-col transition-opacity duration-200 cursor-pointer',
                getOpacity(hoveredStory, i)
              )}
            >
              {/* Visual Thumbnail: DiceBear glass avatar identical to main page */}
              <div className="relative w-full aspect-square rounded-sm overflow-hidden bg-muted/20">
                <img
                  src={glassAvatar(story.seed)}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <h3
                  className={cn(
                    'text-base sm:text-lg font-medium leading-snug tracking-tight text-foreground transition-colors',
                    getCardColor(hoveredStory, i)
                  )}
                >
                  {story.title}
                </h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {story.category}
                  </span>
                  <span>·</span>
                  <span>{story.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. BOTTOM CTA SECTION (SAME ROUNDED-SM AS MAIN PAGE BOTTOM BANNER) */}
      <section className="rounded-sm bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none p-10 sm:p-20 text-center">
        <h2 className="text-3xl sm:text-5xl font-semibold text-foreground mb-4">
          Shape the future of technology
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Join our mission to develop safe, beneficial artificial general
          intelligence that elevates human potential.
        </p>

        {/* CTA Buttons: Open roles with AnimatedArrowUpRight opening /company/careers/open-roles in new tab */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            className="group rounded-full px-4 h-12 text-base font-medium bg-foreground text-background hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Link
              href="/company/careers/open-roles"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5"
            >
              <span>Open roles</span>
              <AnimatedArrowUpRight size={18} strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
