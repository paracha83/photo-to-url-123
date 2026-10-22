import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  Images,
  Wrench,
  ShieldCheck,
  Menu,
  X,
  ArrowUpRight,
  Palette,
  Moon,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { getLocalHistory } from '../lib/storageHistory';
import { getThemePreference, setThemePreference, ThemeMode, applyThemeClass } from '../lib/userPreferences';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('dark');
  const historyCount = getLocalHistory().length;

  useEffect(() => {
    const saved = getThemePreference();
    setCurrentTheme(saved);
    applyThemeClass(saved);
  }, []);

  const cycleTheme = () => {
    const nextTheme: Record<ThemeMode, ThemeMode> = {
      dark: 'midnight',
      midnight: 'deep',
      deep: 'dark',
    };
    const next = nextTheme[currentTheme] || 'dark';
    setCurrentTheme(next);
    setThemePreference(next);
  };

  const navLinks = [
    { label: 'Upload', path: '/', icon: UploadCloud },
    { label: 'My Images', path: '/images', icon: Images, badge: historyCount > 0 ? historyCount : null },
    { label: 'Tools', path: '/tools', icon: Wrench },
    { label: 'Articles', path: '/articles', icon: BookOpen },
    { label: 'Privacy', path: '/privacy', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090B]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
              Image To URL
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase -mt-1">Convert Images to URLs</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.path ||
              (link.path === '/articles' && location.pathname.startsWith('/articles'));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'text-white bg-zinc-800/90'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                {link.label}
                {link.badge && (
                  <span className="ml-1 text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Theme Toggle & Quick Action */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors flex items-center gap-1.5 text-xs font-mono"
            title={`Current theme: ${currentTheme}. Click to switch theme.`}
            aria-label="Toggle visual theme"
          >
            <Palette className="w-4 h-4 text-indigo-400" />
            <span className="capitalize text-[11px] text-zinc-400">{currentTheme}</span>
          </button>

          <Link
            to="/"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <span>Upload Image</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-zinc-400 hover:text-white"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            <Palette className="w-5 h-5 text-indigo-400" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-zinc-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.path ||
              (link.path === '/articles' && location.pathname.startsWith('/articles'));
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-zinc-400" />
                  {link.label}
                </div>
                {link.badge && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Theme: {currentTheme}</span>
            </span>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white"
            >
              Upload Image
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
