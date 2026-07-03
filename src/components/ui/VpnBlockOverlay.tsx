'use client';

import React from 'react';
import { ShieldAlert, RefreshCw, Network, Globe } from 'lucide-react';

interface VpnBlockOverlayProps {
  ip: string;
  country: string;
  region: string;
  isp: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function VpnBlockOverlay({
  ip,
  country,
  region,
  isp,
  onRefresh,
  isRefreshing,
}: VpnBlockOverlayProps) {
  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-luxury-bg font-sans overflow-hidden select-none">
      {/* Animated luxury ambient background glow orbs */}
      <div className="absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] bg-red-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vw] bg-rose-500/5 rounded-full blur-[160px] pointer-events-none animate-float"></div>

      {/* Fine grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.1),rgba(255,255,255,0))] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Container */}
      <div className="relative max-w-lg w-full mx-4 p-8 sm:p-10 rounded-[32px] border border-red-500/25 bg-[#0d070b]/95 backdrop-blur-3xl shadow-[0_30px_70px_-15px_rgba(239,68,68,0.2)] flex flex-col items-center text-center animate-fade-in">
        {/* Hazard Shield Icon Container */}
        <div className="relative w-24 h-24 flex items-center justify-center rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)] mb-8">
          <div className="absolute inset-2 bg-red-500/5 rounded-[20px] animate-pulse"></div>
          <ShieldAlert className="w-12 h-12 relative z-10 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mb-3">
          Access Restricted
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed max-w-sm mb-8">
          To maintain platform security, RainMoney does not permit access via VPNs, proxy servers, or hosting provider networks.
        </p>

        {/* IP and Connection Info Cards */}
        <div className="w-full flex flex-col gap-3.5 mb-8 text-left">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
            <div className="w-10 h-10 rounded-xl bg-neutral-800/50 border border-neutral-700/50 flex items-center justify-center text-neutral-400">
              <Network className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Detected IP Address</span>
              <span className="text-sm font-bold text-red-400/90 font-mono mt-0.5">{ip || 'Detecting...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
            <div className="w-10 h-10 rounded-xl bg-neutral-800/50 border border-neutral-700/50 flex items-center justify-center text-neutral-400">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Geographic Location</span>
              <span className="text-sm font-bold text-white mt-0.5">
                {country ? `${region ? `${region}, ` : ''}${country}` : 'Checking GeoIP...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
            <div className="w-10 h-10 rounded-xl bg-neutral-800/50 border border-neutral-700/50 flex items-center justify-center text-neutral-400">
              <Network className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Network Provider (ISP)</span>
              <span className="text-xs font-semibold text-neutral-300 mt-0.5 truncate max-w-[280px]">
                {isp || 'Retrieving ISP...'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="group relative w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs border border-red-500/20 shadow-[0_10px_25px_rgba(239,68,68,0.25)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          {isRefreshing ? 'Re-verifying Connection...' : 'Re-verify Connection'}
        </button>

        {/* Fine-print details */}
        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mt-6 leading-none">
          SECURED BY RAINMONEY ANTI-SHIELD
        </span>
      </div>
    </div>
  );
}
