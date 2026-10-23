'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import {
  AnimatedArrowUpRight,
  AnimatedChevronDown,
  AnimatedSearchClose,
} from '@/components/ui/animated';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface RoleItem {
  id: string;
  title: string;
  team: string;
  location: string;
  url?: string;
}

const TEAMS = [
  'All teams',
  'AI Research',
  'Engineering',
  'Operations',
  'Product',
  'Security',
];

const LOCATIONS = [
  'All locations',
  'Canada, CA',
  'India, IN',
  'London, UK',
  'New York, NY',
  'San Francisco, CA',
];

// No static mock data currently
const ROLES_DATA: RoleItem[] = [];

export default function OpenRolesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('All teams');
  const [selectedLocation, setSelectedLocation] = useState('All locations');
  const [teamOpen, setTeamOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  const filteredRoles = useMemo(() => {
    return ROLES_DATA.filter((role) => {
      if (selectedTeam !== 'All teams' && role.team !== selectedTeam) {
        return false;
      }
      if (selectedLocation !== 'All locations' && !role.location.includes(selectedLocation)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = role.title.toLowerCase().includes(q);
        const matchTeam = role.team.toLowerCase().includes(q);
        const matchLoc = role.location.toLowerCase().includes(q);
        if (!matchTitle && !matchTeam && !matchLoc) return false;
      }
      return true;
    });
  }, [searchQuery, selectedTeam, selectedLocation]);

  return (
    <div className="py-12 sm:py-20 w-full max-w-4xl mx-auto min-w-0 select-none">
      <header className="mb-10 sm:mb-14 text-center">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Careers
        </p>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4">
          Open roles at CloseAI
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Explore opportunities to build safe, beneficial artificial general intelligence.
        </p>
      </header>

      {/* SEARCH AND PROPER DROPDOWNS BAR */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {/* Help Page Type Search Input */}
          <div className="relative flex-1 w-full group">
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
                'absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors z-10 outline-none rounded-full p-0.5',
                searchQuery
                  ? 'text-foreground cursor-pointer hover:opacity-80'
                  : 'text-muted-foreground group-focus-within:text-foreground cursor-text'
              )}
              aria-label={searchQuery ? 'Clear search' : 'Search'}
            >
              <AnimatedSearchClose
                isOpen={Boolean(searchQuery.trim())}
                size={20}
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
              placeholder="Search roles"
              className="w-full pl-12 pr-4 h-12 bg-card border border-border/80 dark:border-none rounded-full text-base text-foreground placeholder:text-foreground transition-all outline-none focus:outline-none"
            />
          </div>

          {/* All Teams Proper Dropdown (right side of search bar, left of all locations) */}
          <DropdownMenu modal={false} open={teamOpen} onOpenChange={setTeamOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-12 px-4 bg-card border border-border/80 dark:border-none rounded-full text-sm sm:text-base text-foreground flex items-center justify-between gap-2.5 hover:bg-secondary transition-all cursor-pointer shrink-0 w-full sm:w-auto min-w-[160px] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="truncate">{selectedTeam}</span>
                <AnimatedChevronDown
                  open={teamOpen}
                  disableHover={true}
                  size={20}
                  className="text-muted-foreground shrink-0"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] p-1.5 !bg-card dark:!bg-card !border !border-border/80 dark:!border-none rounded-2xl backdrop-blur-none"
            >
              {TEAMS.map((team) => (
                <DropdownMenuItem
                  key={team}
                  onClick={() => {
                    setSelectedTeam(team);
                    setTeamOpen(false);
                  }}
                  className="flex items-center justify-between cursor-pointer text-sm py-2 px-3 text-foreground rounded-xl hover:!bg-secondary dark:hover:!bg-secondary focus:!bg-secondary dark:focus:!bg-secondary data-[highlighted]:!bg-secondary dark:data-[highlighted]:!bg-secondary transition-colors"
                >
                  <span className="truncate">{team}</span>
                  {selectedTeam === team && (
                    <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* All Locations Proper Dropdown (right side of all teams) */}
          <DropdownMenu modal={false} open={locOpen} onOpenChange={setLocOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-12 px-4 bg-card border border-border/80 dark:border-none rounded-full text-sm sm:text-base text-foreground flex items-center justify-between gap-2.5 hover:bg-secondary transition-all cursor-pointer shrink-0 w-full sm:w-auto min-w-[160px] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="truncate">{selectedLocation}</span>
                <AnimatedChevronDown
                  open={locOpen}
                  disableHover={true}
                  size={20}
                  className="text-muted-foreground shrink-0"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] p-1.5 !bg-card dark:!bg-card !border !border-border/80 dark:!border-none rounded-2xl backdrop-blur-none"
            >
              {LOCATIONS.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setLocOpen(false);
                  }}
                  className="flex items-center justify-between cursor-pointer text-sm py-2 px-3 text-foreground rounded-xl hover:!bg-secondary dark:hover:!bg-secondary focus:!bg-secondary dark:focus:!bg-secondary data-[highlighted]:!bg-secondary dark:data-[highlighted]:!bg-secondary transition-colors"
                >
                  <span className="truncate">{loc}</span>
                  {selectedLocation === loc && (
                    <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      {/* ROLES LIST OR SIMPLE HELP-PAGE-STYLE EMPTY STATE */}
      <section className="mb-16">
        {filteredRoles.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-base text-muted-foreground font-medium mb-1">
              {searchQuery.trim() ? 'No roles found' : 'No roles'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRoles.map((role) => (
              <a
                key={role.id}
                href={role.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 sm:p-5 bg-card border border-border/80 dark:border-none rounded-2xl hover:bg-secondary/60 transition-all cursor-pointer"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-1 group-hover:text-foreground">
                    {role.title}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {role.team} • {role.location}
                  </div>
                </div>
                <AnimatedArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            ))}
          </div>
        )}
      </section>

      {/* BACK TO OVERVIEW & CULTURE */}
      <section className="pt-8 border-t border-border/80 text-center">
        <p className="text-sm text-muted-foreground">
          Want to learn more about our mission, culture, and benefits?{' '}
          <Link
            href="/company/careers"
            className="rounded-full text-foreground transition-opacity hover:opacity-80 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <span>Learn more</span>
          </Link>
        </p>
      </section>
    </div>
  );
}
