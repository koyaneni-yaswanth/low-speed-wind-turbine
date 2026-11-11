import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Moon, Sun, X, ArrowUpRight } from 'lucide-react';
import { useAnimationContext } from '../animation/animationContext.ts';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/technology', label: 'Technology' },
  { to: '/products', label: 'Products' },
  { to: '/applications', label: 'Applications' },
  { to: '/performance', label: 'Performance & Data' },
  { to: '/pilot', label: 'Pilot Program' },
  { to: '/about', label: 'About' },
  { to: '/resources', label: 'Resources' },
  { to: '/contact', label: 'Contact' },
];

export const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme, reducedMotion, setReducedMotionOverride } = useAnimationContext();
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur no-print transition-colors ${
        isDark ? 'border-cyan-500/20 bg-[#060D1A]/95 text-white' : 'border-[#DDE2DC] bg-white/95 text-[#141A18]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 shrink-0" onClick={() => setOpen(false)}>
          <img
            src="/repo-assets/media/hero/pawan-shakti-logo.jpeg"
            alt="Pawan Shakti logo"
            className="h-9 w-auto rounded object-contain"
          />
          <div className="hidden sm:block leading-tight">
            <div className={`font-display text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0B2B22]'}`}>
              PAWAN SHAKTI
            </div>
            <div className={`font-mono text-[10px] uppercase tracking-wider ${isDark ? 'text-cyan-300' : 'text-[#434E4A]'}`}>
              TRL 4 Wind Lab
            </div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? isDark
                      ? 'bg-cyan-400 text-[#060D1A] font-semibold'
                      : 'bg-[#0B2B22] text-white'
                    : isDark
                    ? 'text-slate-300 hover:bg-[#101A2C] hover:text-white'
                    : 'text-[#434E4A] hover:bg-[#F6F7F4] hover:text-[#141A18]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReducedMotionOverride(!reducedMotion)}
            aria-label="Toggle reduced motion"
            title={reducedMotion ? 'Motion: Reduced' : 'Motion: Full'}
            className={`hidden sm:inline-flex rounded-lg border px-2 py-1.5 font-mono text-[10px] ${
              isDark ? 'border-slate-700 bg-[#101A2C] text-slate-300' : 'border-[#DDE2DC] bg-[#F6F7F4] text-[#434E4A]'
            }`}
          >
            {reducedMotion ? 'Motion: Off' : 'Motion: On'}
          </button>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Switch color theme"
            className={`rounded-lg border p-2 ${
              isDark ? 'border-slate-700 bg-[#101A2C] text-cyan-300' : 'border-[#DDE2DC] bg-white text-[#141A18]'
            }`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/pilot"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs transition whitespace-nowrap ${
              isDark ? 'bg-emerald-500 text-[#060D1A] hover:bg-emerald-400' : 'bg-[#0B2B22] text-white hover:bg-[#144537]'
            }`}
          >
            Discuss a Pilot
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`xl:hidden rounded-lg border p-2 ${
              isDark ? 'border-slate-700 text-white hover:bg-[#101A2C]' : 'border-[#DDE2DC] text-[#141A18] hover:bg-[#F6F7F4]'
            }`}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className={`border-t px-4 py-3 xl:hidden ${
            isDark ? 'border-cyan-500/20 bg-[#0B1528]' : 'border-[#DDE2DC] bg-white'
          }`}
          aria-label="Mobile navigation"
        >
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? isDark
                        ? 'bg-cyan-400 text-[#060D1A] font-bold'
                        : 'bg-[#0B2B22] text-white'
                      : isDark
                      ? 'text-slate-200 hover:bg-[#101A2C]'
                      : 'text-[#141A18] hover:bg-[#F6F7F4]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
