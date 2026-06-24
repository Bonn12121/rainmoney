'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HelpCircle, FileText, Info, CloudRain } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-luxury-bg border-t border-luxury-border py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8 border-b border-luxury-border/60 pb-8">
        <div>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="font-sans text-base tracking-wider font-black text-white">
              Rain<span className="gold-gradient-text">Money</span>
            </span>
          </Link>
          <p className="text-xs text-neutral-500 mt-2 max-w-sm font-medium">
            Elevating virtual USD gaming into a premium, luxury experience. Built for entertainment and demonstrative play.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-gold-500/80 font-bold uppercase tracking-widest">Platform</span>
            <Link href="/" className="text-xs text-neutral-400 hover:text-white transition-colors">Games</Link>
            <Link href="/store" className="text-xs text-neutral-400 hover:text-white transition-colors">Virtual Store</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-gold-500/80 font-bold uppercase tracking-widest">User</span>
            <Link href="/profile" className="text-xs text-neutral-400 hover:text-white transition-colors">My Profile</Link>
            <Link href="/leaderboard" className="text-xs text-neutral-400 hover:text-white transition-colors">Leaderboard</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-gold-500/80 font-bold uppercase tracking-widest">Legal</span>
            <span className="text-xs text-neutral-400 cursor-not-allowed">Terms of Service</span>
            <span className="text-xs text-neutral-400 cursor-not-allowed">Privacy Statement</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[10px] text-neutral-600 font-bold tracking-wider uppercase">
          &copy; {new Date().getFullYear()} RAINMONEY. ALL RIGHTS RESERVED.
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4 text-[10px] text-neutral-500 font-medium">
          <span className="flex items-center gap-1 text-gold-500/60 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Virtual Sandbox
          </span>
          <span className="hidden md:inline text-neutral-700">|</span>
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            No Withdrawals or Real Value
          </span>
        </div>
      </div>
    </footer>
  );
}
