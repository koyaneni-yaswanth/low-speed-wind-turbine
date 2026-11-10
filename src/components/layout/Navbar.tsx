import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';

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

  return (
    <header className="sticky top-0 z-40 border-b border-[#DDE2DC] bg-white/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 shrink-0" onClick={() => setOpen(false)}>
          <img
            src="/repo-assets/media/hero/pawan-shakti-logo.jpeg"
            alt="Pawan Shakti logo"
            className="h-9 w-auto rounded object-contain"
          />
          <div className="hidden sm:block leading-tight">
            <div className="font-display text-sm font-extrabold tracking-tight text-[#0B2B22]">PAWAN SHAKTI</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#434E4A]">TRL 4 R&amp;D Platform</div>
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
                    ? 'bg-[#0B2B22] text-white'
                    : 'text-[#434E4A] hover:bg-[#F6F7F4] hover:text-[#141A18]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/pilot"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2B22] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#144537] whitespace-nowrap"
          >
            Discuss a Pilot
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="xl:hidden rounded-lg border border-[#DDE2DC] p-2 text-[#141A18] hover:bg-[#F6F7F4]"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-[#DDE2DC] bg-white px-4 py-3 xl:hidden" aria-label="Mobile navigation">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-[#0B2B22] text-white' : 'text-[#141A18] hover:bg-[#F6F7F4]'
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
