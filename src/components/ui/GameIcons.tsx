'use client';

import React from 'react';

interface GameIconProps {
  id: string;
  className?: string;
}

export function GameIcon({ id, className = 'w-12 h-12' }: GameIconProps) {
  switch (id) {
    case 'rocket':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]`}>
          <defs>
            <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="70%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
              <stop offset="40%" stopColor="#ef4444" />
              <stop offset="80%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
          </defs>
          {/* Orbit dash path */}
          <path d="M 15 85 Q 50 50 85 15" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 5" opacity="0.3" />
          
          {/* The exact transformed Rocket component matching the game canvas */}
          <g transform="translate(50, 50) rotate(-45) scale(1.15)">
            {/* Flame trail (thick and robust) */}
            <path d="M -18 0 L -32 -9 L -42 0 L -32 9 Z" fill="url(#fireGrad)" />
            
            {/* Bottom booster ring */}
            <rect x="-18" y="-8" width="3" height="16" fill="#475569" />

            {/* Big side fins (sleek and thick) */}
            {/* Top fin */}
            <path d="M -5 -12 L -20 -22 L -15 -12 Z" fill="#be123c" stroke="#9f1239" strokeWidth="1.5" />
            
            {/* Bottom fin */}
            <path d="M -5 12 L -20 22 L -15 12 Z" fill="#be123c" stroke="#9f1239" strokeWidth="1.5" />

            {/* Main Rocket fuselage (Thick capsule cylinder) */}
            <path d="M -15 -12 L 8 -12 Q 24 -8 24 0 Q 24 8 8 12 L -15 12 Z" fill="url(#rocketGrad)" stroke="#9f1239" strokeWidth="2" />
            
            {/* Center cockpit window (larger glass bubble) */}
            <circle cx="4" cy="0" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            
            {/* Window shine */}
            <circle cx="2.5" cy="-1.5" r="1.5" fill="#ffffff" />
          </g>
        </svg>
      );
    case 'mines':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]`}>
          <defs>
            <linearGradient id="mineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="gemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          {/* Grid lines in background */}
          <rect x="15" y="15" width="70" height="70" rx="8" fill="none" stroke="#ca8a04" strokeWidth="2" opacity="0.2" />
          <line x1="38" y1="15" x2="38" y2="85" stroke="#ca8a04" strokeWidth="1.5" opacity="0.2" />
          <line x1="62" y1="15" x2="62" y2="85" stroke="#ca8a04" strokeWidth="1.5" opacity="0.2" />
          <line x1="15" y1="38" x2="85" y2="38" stroke="#ca8a04" strokeWidth="1.5" opacity="0.2" />
          <line x1="15" y1="62" x2="85" y2="62" stroke="#ca8a04" strokeWidth="1.5" opacity="0.2" />
          {/* Gem (diamond) */}
          <path d="M50 25 L70 45 L50 65 L30 45 Z" fill="url(#gemGrad)" />
          {/* Dark Mine */}
          <circle cx="50" cy="52" r="14" fill="#1e293b" stroke="#eab308" strokeWidth="2.5" />
          <circle cx="50" cy="52" r="6" fill="#eab308" />
          {/* Spikes */}
          <line x1="50" y1="34" x2="50" y2="38" stroke="#eab308" strokeWidth="2.5" />
          <line x1="50" y1="66" x2="50" y2="70" stroke="#eab308" strokeWidth="2.5" />
          <line x1="34" y1="52" x2="38" y2="52" stroke="#eab308" strokeWidth="2.5" />
          <line x1="66" y1="52" x2="70" y2="52" stroke="#eab308" strokeWidth="2.5" />
          {/* Sparkles */}
          <circle cx="75" cy="25" r="2" fill="#ffffff" />
          <circle cx="25" cy="70" r="1.5" fill="#ffffff" />
        </svg>
      );
    case 'dice':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]`}>
          <defs>
            <linearGradient id="diceGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="diceGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* First Dice (Main) */}
          <rect x="20" y="25" width="42" height="42" rx="8" fill="url(#diceGrad1)" transform="rotate(-12 40 45)" />
          {/* Dots on first dice */}
          <circle cx="31" cy="37" r="3" fill="#000000" opacity="0.75" />
          <circle cx="49" cy="55" r="3" fill="#000000" opacity="0.75" />
          <circle cx="40" cy="46" r="3" fill="#000000" opacity="0.75" />
          {/* Second Dice (Back offset) */}
          <rect x="48" y="38" width="34" height="34" rx="6" fill="url(#diceGrad2)" transform="rotate(18 65 55)" />
          {/* Dots on second dice */}
          <circle cx="61" cy="48" r="2.5" fill="#ffffff" opacity="0.9" />
          <circle cx="69" cy="56" r="2.5" fill="#ffffff" opacity="0.9" />
        </svg>
      );
    case 'coin-flip':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(202,138,4,0.4)]`}>
          <defs>
            <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          {/* Flip motion arcs */}
          <path d="M 50 12 A 38 38 0 0 1 88 50" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
          <path d="M 50 88 A 38 38 0 0 1 12 50" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
          {/* Shiny coin base */}
          <circle cx="50" cy="50" r="32" fill="url(#coinGrad)" stroke="#fef08a" strokeWidth="2.5" />
          {/* Inner circle ridged */}
          <circle cx="50" cy="50" r="26" fill="none" stroke="#854d0e" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          {/* Dollar symbol ($) inside */}
          <text x="50" y="60" fontSize="30" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#854d0e" opacity="0.8">$</text>
        </svg>
      );
    case 'wheel':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]`}>
          <defs>
            <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          {/* Wheel Frame */}
          <circle cx="50" cy="50" r="36" fill="url(#wheelGrad)" stroke="#f59e0b" strokeWidth="3" />
          {/* inner rings */}
          <circle cx="50" cy="50" r="28" fill="none" stroke="#fef08a" strokeWidth="1.5" opacity="0.4" />
          {/* Sectors */}
          <line x1="50" y1="14" x2="50" y2="86" stroke="#f59e0b" strokeWidth="2.5" />
          <line x1="14" y1="50" x2="86" y2="50" stroke="#f59e0b" strokeWidth="2.5" />
          <line x1="24.5" y1="24.5" x2="75.5" y2="75.5" stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
          <line x1="24.5" y1="75.5" x2="75.5" y2="24.5" stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
          {/* Center Hub */}
          <circle cx="50" cy="50" r="9" fill="#151515" stroke="#f59e0b" strokeWidth="2" />
          {/* Needle at top */}
          <polygon points="50,6 55,20 45,20" fill="#ef4444" />
          <circle cx="50" cy="18" r="2" fill="#ffffff" />
        </svg>
      );
    case 'plinko':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(253,224,71,0.4)]`}>
          {/* Peg Board dots */}
          <circle cx="50" cy="20" r="2.5" fill="#fef08a" opacity="0.7" />
          <circle cx="38" cy="35" r="2.5" fill="#fef08a" opacity="0.7" />
          <circle cx="62" cy="35" r="2.5" fill="#fef08a" opacity="0.7" />
          <circle cx="26" cy="50" r="2.5" fill="#fef08a" opacity="0.7" />
          <circle cx="50" cy="50" r="2.5" fill="#fef08a" opacity="0.7" />
          <circle cx="74" cy="50" r="2.5" fill="#fef08a" opacity="0.7" />
          <circle cx="38" cy="65" r="2.5" fill="#fef08a" opacity="0.7" />
          <circle cx="62" cy="65" r="2.5" fill="#fef08a" opacity="0.7" />
          {/* Bouncing ball and path */}
          <path d="M 50 15 Q 44 28 38 35 T 50 50 T 62 65" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="48" cy="46" r="6" fill="#facc15" />
          <circle cx="48" cy="46" r="3.5" fill="#ffffff" opacity="0.8" />
          {/* Plinko Buckets at bottom */}
          <rect x="20" y="80" width="12" height="10" rx="2" fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.8" />
          <rect x="36" y="80" width="12" height="10" rx="2" fill="none" stroke="#facc15" strokeWidth="2" />
          <rect x="52" y="80" width="12" height="10" rx="2" fill="none" stroke="#facc15" strokeWidth="2" />
          <rect x="68" y="80" width="12" height="10" rx="2" fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.8" />
        </svg>
      );
    case 'towers':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(252,211,77,0.4)]`}>
          <defs>
            <linearGradient id="towGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          {/* Tower blocks stacked */}
          <rect x="25" y="68" width="50" height="16" rx="4" fill="url(#towGrad)" stroke="#78350f" strokeWidth="1" />
          <rect x="30" y="48" width="40" height="16" rx="4" fill="url(#towGrad)" stroke="#78350f" strokeWidth="1" />
          <rect x="35" y="28" width="30" height="16" rx="4" fill="url(#towGrad)" stroke="#78350f" strokeWidth="1" />
          {/* Top Crown/Star */}
          <polygon points="50,6 54,14 62,14 56,19 58,26 50,22 42,26 44,19 38,14 46,14" fill="#ffffff" />
          {/* Gems on blocks */}
          <circle cx="50" cy="76" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="50" cy="56" r="2" fill="#ffffff" opacity="0.8" />
          <circle cx="50" cy="36" r="1.5" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    case 'limbo':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]`}>
          <defs>
            <linearGradient id="limGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          {/* Glowing bar */}
          <line x1="15" y1="50" x2="85" y2="50" stroke="#fda4af" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
          <line x1="15" y1="50" x2="70" y2="50" stroke="url(#limGrad)" strokeWidth="6" strokeLinecap="round" />
          {/* lightning bolt crossing the bar */}
          <path d="M52 18 L32 52 L50 52 L42 82 L70 42 L48 42 Z" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
          {/* Multiplier text label */}
          <text x="50" y="32" fontSize="11" fontWeight="900" fontFamily="sans-serif" fill="#ffffff" textAnchor="middle" opacity="0.9">100.0x</text>
        </svg>
      );
    case 'keno':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]`}>
          <defs>
            <linearGradient id="kenoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/* Keno grid container */}
          <rect x="20" y="20" width="60" height="60" rx="8" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
          {/* grid lines */}
          <line x1="40" y1="20" x2="40" y2="80" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3" />
          <line x1="60" y1="20" x2="60" y2="80" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3" />
          <line x1="20" y1="40" x2="80" y2="40" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3" />
          <line x1="20" y1="60" x2="80" y2="60" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3" />
          {/* Selected squares */}
          <rect x="23" y="23" width="14" height="14" rx="3" fill="url(#kenoGrad)" />
          <rect x="43" y="43" width="14" height="14" rx="3" fill="url(#kenoGrad)" />
          <rect x="63" y="63" width="14" height="14" rx="3" fill="url(#kenoGrad)" />
          {/* numbers inside */}
          <text x="30" y="34" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#ffffff">7</text>
          <text x="50" y="54" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#ffffff">22</text>
          <text x="70" y="74" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#ffffff">40</text>
        </svg>
      );
    case 'hi-lo':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]`}>
          <defs>
            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          {/* Two cards */}
          <rect x="18" y="25" width="28" height="42" rx="4" fill="#ffffff" stroke="#059669" strokeWidth="1.5" transform="rotate(-10 32 46)" />
          <text x="27" y="48" fontSize="18" fontWeight="900" fontFamily="serif" fill="#059669" transform="rotate(-10 32 46)">K</text>
          
          <rect x="48" y="30" width="28" height="42" rx="4" fill="url(#cardGrad)" stroke="#10b981" strokeWidth="1.5" transform="rotate(15 62 51)" />
          <text x="58" y="55" fontSize="18" fontWeight="900" fontFamily="serif" fill="#ffffff" transform="rotate(15 62 51)">3</text>
          {/* Up arrow for Higher, down arrow for Lower */}
          <path d="M 32 78 L 42 68 L 52 78" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <path d="M 52 78 L 62 88 L 72 78" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </svg>
      );
    case 'casino':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]`}>
          <defs>
            <linearGradient id="casGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
          </defs>
          {/* Slot Machine Frame */}
          <rect x="22" y="20" width="56" height="60" rx="8" fill="url(#casGrad)" stroke="#9d174d" strokeWidth="2" />
          {/* Screen */}
          <rect x="28" y="32" width="44" height="24" rx="4" fill="#000000" stroke="#db2777" strokeWidth="1.5" />
          {/* Slot Reels (Cherries/7) */}
          <g transform="translate(36, 44)">
            <path d="M -3 2 Q 0 -4 1 -6 M 2 1 Q 0 -4 1 -6" fill="none" stroke="#34d399" strokeWidth="1" strokeLinecap="round" />
            <circle cx="-3" cy="2" r="3.5" fill="#f43f5e" />
            <circle cx="2" cy="1" r="3.5" fill="#f43f5e" />
            <circle cx="-4" cy="0.5" r="1" fill="#ffffff" opacity="0.6" />
          </g>
          <g transform="translate(50, 44)">
            <path d="M -4 -6 L 4 -6 L 4 -3 L -1 6 L -5 6 L 1 -1 L -4 -1 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="0.5" />
          </g>
          <g transform="translate(64, 44)">
            <path d="M -3 2 Q 0 -4 1 -6 M 2 1 Q 0 -4 1 -6" fill="none" stroke="#34d399" strokeWidth="1" strokeLinecap="round" />
            <circle cx="-3" cy="2" r="3.5" fill="#f43f5e" />
            <circle cx="2" cy="1" r="3.5" fill="#f43f5e" />
            <circle cx="-4" cy="0.5" r="1" fill="#ffffff" opacity="0.6" />
          </g>
          {/* Lever */}
          <path d="M 78 56 L 86 38" stroke="#db2777" strokeWidth="3" strokeLinecap="round" />
          <circle cx="87" cy="36" r="5" fill="#f472b6" />
          {/* Winning gold stars */}
          <polygon points="50,10 52,14 56,14 53,17 54,21 50,19 46,21 47,17 44,14 48,14" fill="#ffffff" />
        </svg>
      );
    case 'pump':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]`}>
          <defs>
            <linearGradient id="pumpBGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          {/* Inflating Balloon */}
          <circle cx="50" cy="40" r="22" fill="url(#pumpBGrad)" stroke="#e0f2fe" strokeWidth="1" />
          {/* Balloon knot */}
          <polygon points="50,60 54,66 46,66" fill="#0284c7" />
          <path d="M 50 66 Q 48 76 54 82" fill="none" stroke="#0284c7" strokeWidth="1.5" />
          {/* Pump nozzle */}
          <rect x="42" y="82" width="16" height="8" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
          {/* Sparkles of air pressure */}
          <circle cx="22" cy="22" r="2" fill="#e0f2fe" opacity="0.6" />
          <circle cx="78" cy="30" r="1.5" fill="#e0f2fe" opacity="0.6" />
        </svg>
      );
    case 'rps':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]`}>
          <defs>
            <linearGradient id="rpsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          {/* Circular shield */}
          <circle cx="50" cy="50" r="36" fill="none" stroke="url(#rpsGrad)" strokeWidth="3" strokeDasharray="6 3" />
          {/* RPS Emojis positioned in circle */}
          <g transform="translate(50, 26) scale(0.24)">
            <path d="M-6,8 C-12,8 -15,2 -13,-4 C-12,-8 -6,-10 0,-10 C6,-10 12,-8 13,-4 C15,2 12,8 6,8 Z" fill="#f97316" stroke="#ffedd5" strokeWidth="2.5" />
            <path d="M-3,-2 L-3,6" stroke="#ffedd5" strokeWidth="2" strokeLinecap="round" />
            <path d="M3,-2 L3,6" stroke="#ffedd5" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g transform="translate(32, 57) scale(0.24)">
            <path d="M-5,10 C-10,10 -12,4 -12,-5 L-12,-12 C-12,-15 -8,-15 -8,-12 L-8,-5 L-8,-16 C-8,-19 -4,-19 -4,-16 L-4,-5 L-4,-18 C-4,-21 0,-21 0,-18 L0,-5 L0,-15 C0,-18 4,-18 4,-15 L4,5 C4,10 0,10 -5,10 Z" fill="#f97316" stroke="#ffedd5" strokeWidth="2.5" strokeLinejoin="round" />
          </g>
          <g transform="translate(68, 57) scale(0.24)">
            <path d="M-6,-18 L2,4" stroke="#ffedd5" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M6,-18 L-2,4" stroke="#ffedd5" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="-5" cy="10" r="6" fill="none" stroke="#f97316" strokeWidth="4.5" />
            <circle cx="5" cy="10" r="6" fill="none" stroke="#f97316" strokeWidth="4.5" />
            <circle cx="0" cy="-3" r="2.5" fill="#ffedd5" />
          </g>
          {/* Center VS */}
          <text x="50" y="55" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#ffedd5" opacity="0.6">VS</text>
        </svg>
      );
    case 'cup':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]`}>
          <defs>
            <linearGradient id="goldCup" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="50%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#115e59" />
            </linearGradient>
          </defs>
          {/* Diamond showing slightly from behind */}
          <polygon points="50,68 59,76 50,84 41,76" fill="#ffffff" stroke="#2dd4bf" strokeWidth="1" />
          {/* Golden Cup overlay */}
          <path 
            d="M 28 25 L 72 25 C 70 32, 68 62, 62 70 C 56 76, 44 76, 38 70 C 32 62, 30 32, 28 25 Z" 
            fill="url(#goldCup)" 
            stroke="#115e59" 
            strokeWidth="1.5" 
          />
          <ellipse cx="50" cy="25" rx="22" ry="4" fill="#115e59" stroke="#99f6e4" strokeWidth="0.75" />
          {/* Star logo on cup */}
          <polygon points="50,42 52,47 57,47 53,50 54,55 50,52 46,55 47,50 43,47 48,47" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    case 'toe':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]`}>
          {/* Tic Tac Toe Grid */}
          <line x1="40" y1="20" x2="40" y2="80" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="60" y1="20" x2="60" y2="80" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="20" y1="40" x2="80" y2="40" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="20" y1="60" x2="80" y2="60" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" />
          {/* Glowing X */}
          <line x1="26" y1="26" x2="34" y2="34" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="34" y1="26" x2="26" y2="34" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
          {/* Glowing O */}
          <circle cx="50" cy="50" r="5" fill="none" stroke="#f472b6" strokeWidth="4" />
        </svg>
      );
    case 'scratch':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]`}>
          <defs>
            <linearGradient id="scrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          {/* Ticket Body */}
          <rect x="18" y="22" width="64" height="56" rx="6" fill="url(#scrGrad)" stroke="#be123c" strokeWidth="2" />
          {/* Scratch foil overlay areas */}
          <rect x="26" y="30" width="14" height="12" rx="2" fill="#be123c" opacity="0.6" />
          <rect x="43" y="30" width="14" height="12" rx="2" fill="#be123c" opacity="0.6" />
          <rect x="60" y="30" width="14" height="12" rx="2" fill="#be123c" opacity="0.6" />
          
          <rect x="26" y="46" width="14" height="12" rx="2" fill="#ffffff" opacity="0.8" />
          <rect x="43" y="46" width="14" height="12" rx="2" fill="#be123c" opacity="0.6" />
          <rect x="60" y="46" width="14" height="12" rx="2" fill="#be123c" opacity="0.6" />
          
          {/* Diamond vector inside scratch ticket */}
          <polygon 
            points="33,48 37,52 33,56 29,52" 
            fill="#0891b2" 
            stroke="#ecfeff" 
            strokeWidth="0.8" 
          />
          <polygon 
            points="31,48 35,48 33,52" 
            fill="#22d3ee" 
          />
          
          <rect x="26" y="62" width="48" height="10" rx="2" fill="#be123c" opacity="0.3" />
          <text x="50" y="70" fontSize="7" textAnchor="middle" fill="#ffffff" fontWeight="bold">SCRATCH TO WIN</text>
        </svg>
      );
    case 'sports':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]`}>
          <defs>
            <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="ballGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          {/* Soccer pitch field representation in background */}
          <rect x="18" y="18" width="64" height="64" rx="8" fill="url(#pitchGrad)" stroke="#10b981" strokeWidth="2" />
          <circle cx="50" cy="50" r="14" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.25" />
          <line x1="50" y1="18" x2="50" y2="82" stroke="#ffffff" strokeWidth="1" opacity="0.25" />
          
          {/* Soccer Ball (Fifa/Sports themed) */}
          <circle cx="50" cy="50" r="15" fill="url(#ballGrad)" stroke="#111827" strokeWidth="1.5" />
          
          {/* Pentagons & Lines on the ball */}
          <polygon points="50,41.5 54.5,45.5 52.5,51 47.5,51 45.5,45.5" fill="#111827" />
          {/* Lines going outward from the center pentagon */}
          <line x1="50" y1="41.5" x2="50" y2="35" stroke="#111827" strokeWidth="1.2" />
          <line x1="54.5" y1="45.5" x2="60.5" y2="46.5" stroke="#111827" strokeWidth="1.2" />
          <line x1="52.5" y1="51" x2="56.5" y2="58" stroke="#111827" strokeWidth="1.2" />
          <line x1="47.5" y1="51" x2="43.5" y2="58" stroke="#111827" strokeWidth="1.2" />
          <line x1="45.5" y1="45.5" x2="39.5" y2="46.5" stroke="#111827" strokeWidth="1.2" />
          
          {/* Outer edge shapes to make it look like a soccer ball */}
          <polygon points="50,35 44,31 40.5,34 46,39.5" fill="#111827" opacity="0.85" />
          <polygon points="50,35 56,31 59.5,34 54,39.5" fill="#111827" opacity="0.85" />
          <polygon points="60.5,46.5 64,41.5 65.5,47.5 60,51.5" fill="#111827" opacity="0.85" />
          <polygon points="56.5,58 61,60.5 57,65 52.5,61" fill="#111827" opacity="0.85" />
          <polygon points="43.5,58 39,60.5 43,65 47.5,61" fill="#111827" opacity="0.85" />
          
          {/* Decorative gold trophies/stars in top-left and top-right corners */}
          <path d="M 28 26 L 31 20 L 25 20 Z" fill="#fbbf24" opacity="0.8" />
          <path d="M 72 26 L 69 20 L 75 20 Z" fill="#fbbf24" opacity="0.8" />
        </svg>
      );
    case 'cases':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]`}>
          <defs>
            <linearGradient id="briefcaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          {/* Handle */}
          <path d="M 38 32 L 38 24 Q 38 20 42 20 L 58 20 Q 62 20 62 24 L 62 32" fill="none" stroke="#60a5fa" strokeWidth="3" />
          {/* Main Case Body */}
          <rect x="18" y="32" width="64" height="46" rx="8" fill="url(#briefcaseGrad)" stroke="#1e40af" strokeWidth="2" />
          {/* Metallic Corners */}
          <path d="M 18 42 L 26 32" stroke="#93c5fd" strokeWidth="2.5" />
          <path d="M 82 42 L 74 32" stroke="#93c5fd" strokeWidth="2.5" />
          {/* Latches */}
          <rect x="30" y="32" width="8" height="6" rx="1" fill="#93c5fd" />
          <rect x="62" y="32" width="8" height="6" rx="1" fill="#93c5fd" />
          {/* Gold / Diamond Emblem in center */}
          <polygon points="50,44 55,52 50,60 45,52" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
          <circle cx="50" cy="52" r="2.5" fill="#3b82f6" />
        </svg>
      );
    case 'blackjack':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]`}>
          <defs>
            <linearGradient id="bjCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          {/* Card Backing/Background felt color */}
          <rect x="18" y="18" width="64" height="64" rx="8" fill="url(#bjCardGrad)" opacity="0.15" stroke="#10b981" strokeWidth="1" />
          {/* Ace Card */}
          <g transform="translate(24, 26) rotate(-8)">
            <rect x="0" y="0" width="30" height="42" rx="4" fill="#090d16" stroke="#10b981" strokeWidth="1.5" />
            <text x="6" y="14" fontSize="10" fontWeight="black" fill="#10b981" fontFamily="sans-serif">A</text>
            <text x="15" y="28" fontSize="14" fill="#10b981">♠</text>
          </g>
          {/* King Card */}
          <g transform="translate(44, 30) rotate(8)">
            <rect x="0" y="0" width="30" height="42" rx="4" fill="#090d16" stroke="#10b981" strokeWidth="1.5" />
            <text x="6" y="14" fontSize="10" fontWeight="black" fill="#ef4444" fontFamily="sans-serif">K</text>
            <text x="15" y="28" fontSize="14" fill="#ef4444">♥</text>
          </g>
        </svg>
      );
    case 'derby':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(250,204,21,0.4)]`}>
          <defs>
            <linearGradient id="derbyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          {/* Horseshoe */}
          <path 
            d="M 32 30 C 32 60 68 60 68 30 C 68 25 64 25 64 30 C 64 52 36 52 36 30 C 36 25 32 25 32 30 Z" 
            fill="url(#derbyGrad)" 
          />
          {/* Star studs in horseshoe */}
          <circle cx="39" cy="42" r="2.5" fill="#1e293b" />
          <circle cx="50" cy="48" r="2.5" fill="#1e293b" />
          <circle cx="61" cy="42" r="2.5" fill="#1e293b" />
          {/* Running horse silhouette simple vector */}
          <path 
            d="M 40 32 Q 44 26 48 30 Q 56 30 60 26 L 56 34 Q 52 36 48 38 L 44 38 L 40 32" 
            fill="url(#derbyGrad)" 
          />
        </svg>
      );
    case 'penalty':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]`}>
          <defs>
            <linearGradient id="penaltyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
          </defs>
          {/* Goal Net posts */}
          <rect x="20" y="24" width="60" height="42" rx="2" fill="none" stroke="#2dd4bf" strokeWidth="3" />
          {/* Cross lines for net effect */}
          <path d="M 20 31 L 80 31 M 20 38 L 80 38 M 20 45 L 80 45 M 20 52 L 80 52 M 20 59 L 80 59" stroke="#2dd4bf" strokeWidth="0.8" opacity="0.3" />
          <path d="M 30 24 L 30 66 M 40 24 L 40 66 M 50 24 L 50 66 M 60 24 L 60 66 M 70 24 L 70 66" stroke="#2dd4bf" strokeWidth="0.8" opacity="0.3" />
          {/* Soccer Ball entering the net */}
          <circle cx="62" cy="40" r="8" fill="#ffffff" stroke="#111827" strokeWidth="1" />
          <path d="M 58 37 L 66 43 M 66 37 L 58 43 M 62 32 L 62 48" stroke="#111827" strokeWidth="1" />
          {/* Goal word mark */}
          <text x="50" y="60" fontSize="7" fontWeight="black" fill="#2dd4bf" textAnchor="middle" letterSpacing="1">GOAL</text>
        </svg>
      );
    case 'claw':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]`}>
          <defs>
            <linearGradient id="clawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>
          {/* Claw machinery head */}
          <rect x="42" y="16" width="16" height="12" rx="3" fill="url(#clawGrad)" />
          {/* Metal cable */}
          <line x1="50" y1="28" x2="50" y2="44" stroke="#a855f7" strokeWidth="2.5" />
          {/* Left claw prong */}
          <path d="M 50 44 Q 38 48 38 60 Q 38 62 42 62" fill="none" stroke="#c084fc" strokeWidth="3.5" strokeLinecap="round" />
          {/* Right claw prong */}
          <path d="M 50 44 Q 62 48 62 60 Q 62 62 58 62" fill="none" stroke="#c084fc" strokeWidth="3.5" strokeLinecap="round" />
          {/* Floating capsule prize */}
          <circle cx="50" cy="62" r="9" fill="#eab308" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M 41 62 H 59" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );
    case 'baccarat':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]`}>
          <defs>
            <linearGradient id="bacGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          {/* Golden background shield crown shape */}
          <polygon points="50,18 72,32 66,68 50,82 34,68 28,32" fill="url(#bacGrad)" opacity="0.1" stroke="#4f46e5" strokeWidth="1.5" />
          {/* Nine numeric digit symbol of Baccarat ultimate score */}
          <text x="50" y="56" fontSize="30" fontWeight="black" fill="url(#bacGrad)" textAnchor="middle" fontFamily="serif">9</text>
          {/* Golden stars crown emblem */}
          <path d="M 40 28 L 44 24 L 50 28 L 56 24 L 60 28" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'slots-neon':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]`}>
          <defs>
            <linearGradient id="neonFGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />
          <g transform="translate(15, 12) scale(0.7)">
            <path d="M 50 20 Q 32 40 32 64" fill="none" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 50 20 Q 64 42 66 60" fill="none" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 50 20 Q 62 10 72 16 Q 62 26 50 20 Z" fill="#059669" />
            <circle cx="32" cy="66" r="16" fill="url(#neonFGrad)" stroke="#064e3b" strokeWidth="2" />
            <circle cx="27" cy="60" r="4.5" fill="#ffffff" opacity="0.75" />
            <circle cx="68" cy="62" r="16" fill="url(#neonFGrad)" stroke="#064e3b" strokeWidth="2" />
            <circle cx="63" cy="56" r="4.5" fill="#ffffff" opacity="0.75" />
          </g>
          <rect x="30" y="66" width="40" height="15" rx="3" fill="#000000" stroke="#facc15" strokeWidth="1.5" />
          <line x1="38" y1="66" x2="38" y2="81" stroke="#facc15" strokeWidth="1" />
          <line x1="62" y1="66" x2="62" y2="81" stroke="#facc15" strokeWidth="1" />
          <circle cx="50" cy="73.5" r="3" fill="#fbbf24" />
        </svg>
      );
    case 'slots-egypt':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(202,138,4,0.5)]`}>
          <defs>
            <linearGradient id="egyptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <polygon points="50,15 85,75 15,75" fill="url(#egyptGrad)" stroke="#facc15" strokeWidth="1.5" />
          <polygon points="50,15 50,75 85,75" fill="#a16207" opacity="0.5" />
          <polygon points="50,42 62,54 50,66 38,54" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="50" cy="54" r="3" fill="#ffffff" />
        </svg>
      );
    case 'slots-sweet':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(236,72,153,0.5)]`}>
          <defs>
            <linearGradient id="sweetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="45" r="22" fill="url(#sweetGrad)" stroke="#fdf2f8" strokeWidth="1.5" />
          <path d="M 50 67 L 50 88" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <path d="M 36 38 Q 45 42 50 34 Q 55 42 64 38" fill="none" stroke="#fdf2f8" strokeWidth="2.5" />
          <polygon points="30,37 38,45 30,53" fill="#ffffff" />
          <polygon points="70,37 62,45 70,53" fill="#ffffff" />
          <circle cx="50" cy="45" r="9" fill="#f43f5e" />
        </svg>
      );
    case 'slots-pirate':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]`}>
          <defs>
            <linearGradient id="pirateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          <rect x="20" y="25" width="60" height="50" rx="8" fill="url(#pirateGrad)" stroke="#ea580c" strokeWidth="2" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="#7c2d12" strokeWidth="3" />
          <circle cx="50" cy="50" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <g transform="translate(10, 0)">
            <circle cx="40" cy="38" r="6" fill="#ffffff" />
            <rect x="36" y="42" width="8" height="6" fill="#ffffff" rx="1.5" />
            <circle cx="38" cy="38" r="1.5" fill="#000000" />
            <circle cx="42" cy="38" r="1.5" fill="#000000" />
          </g>
        </svg>
      );
    case 'slots-zeus':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]`}>
          <defs>
            <linearGradient id="zeusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
          </defs>
          <path d="M 18 20 H 82 V 26 H 18 Z M 24 26 L 28 76 H 72 L 76 26 Z" fill="url(#zeusGrad)" opacity="0.3" stroke="#c084fc" strokeWidth="1" />
          <path d="M 50 10 L 32 50 H 52 L 40 90 L 72 42 H 48 L 56 10 Z" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );
    case 'slots-cyber':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(236,72,153,0.5)]`}>
          <rect x="20" y="20" width="60" height="60" rx="6" fill="#0f0717" stroke="#d946ef" strokeWidth="2.5" />
          <rect x="28" y="28" width="44" height="44" rx="3" fill="#1e1b4b" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 2" />
          <rect x="42" y="42" width="16" height="16" rx="2" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="46" y="44" width="8" height="5" fill="#0b0f19" />
        </svg>
      );
    case 'slots-safari':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(132,204,22,0.5)]`}>
          <defs>
            <linearGradient id="safariGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#3f6212" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="32" fill="url(#safariGrad)" stroke="#4d7c0f" strokeWidth="1.5" />
          <circle cx="50" cy="54" r="10" fill="#ffffff" />
          <circle cx="36" cy="40" r="5" fill="#ffffff" />
          <circle cx="45" cy="34" r="5" fill="#ffffff" />
          <circle cx="55" cy="34" r="5" fill="#ffffff" />
          <circle cx="64" cy="40" r="5" fill="#ffffff" />
        </svg>
      );
    case 'slots-dragon':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]`}>
          <defs>
            <linearGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="45" r="25" fill="url(#dragonGrad)" stroke="#facc15" strokeWidth="2" />
          <path d="M 50 70 L 50 90" stroke="#facc15" strokeWidth="3" />
          <rect x="42" y="70" width="16" height="5" fill="#dc2626" rx="1" />
          <polygon points="50,32 54,42 64,42 56,48 59,58 50,51 41,58 44,48 36,42 46,42" fill="#facc15" />
        </svg>
      );
    case 'slots-irish':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]`}>
          <defs>
            <linearGradient id="irishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
          </defs>
          <path d="M 22 75 C 22 55 35 48 50 48 C 65 48 78 55 78 75 Z" fill="url(#irishGrad)" stroke="#166534" strokeWidth="2" />
          <ellipse cx="50" cy="76" rx="34" ry="7" fill="#15803d" />
          <g transform="translate(18, 14) scale(0.65)">
            <path d="M 50 50 Q 52 75 64 88" fill="none" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="50" cy="34" r="13" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="66" cy="50" r="13" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="50" cy="66" r="13" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="34" cy="50" r="13" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        </svg>
      );
    case 'slots-undersea':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(14,165,233,0.5)]`}>
          <defs>
            <linearGradient id="aquaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="32" fill="url(#aquaGrad)" opacity="0.2" stroke="#0ea5e9" strokeWidth="1.5" />
          <path d="M 50 85 L 50 25 M 36 35 L 50 25 L 64 35 M 40 45 L 60 45" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <g transform="translate(20, 42) scale(0.6)">
            <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="#facc15" stroke="#ffffff" strokeWidth="2.5" />
          </g>
        </svg>
      );
    case 'rain-catch':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]`}>
          <defs>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
            <linearGradient id="basketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          </defs>
          {/* Cloud at top */}
          <path d="M 30 35 Q 20 35 22 25 Q 26 15 40 18 Q 50 10 65 18 Q 78 15 76 28 Q 82 35 70 35 Z" fill="url(#cloudGrad)" opacity="0.8" />
          {/* Falling Coins and Drops */}
          <circle cx="34" cy="46" r="3.5" fill="#facc15" />
          <path d="M 52 42 Q 52 50 50 52 Q 48 50 48 42 Z" fill="#38bdf8" />
          <circle cx="68" cy="48" r="4.5" fill="#facc15" />
          <path d="M 40 58 Q 40 66 38 68 Q 36 66 36 58 Z" fill="#38bdf8" />
          {/* Basket at bottom */}
          <path d="M 24 64 L 76 64 L 68 84 L 32 84 Z" fill="url(#basketGrad)" stroke="#38bdf8" strokeWidth="2" />
          <line x1="32" y1="64" x2="32" y2="84" stroke="#0369a1" strokeWidth="1.5" />
          <line x1="44" y1="64" x2="44" y2="84" stroke="#0369a1" strokeWidth="1.5" />
          <line x1="56" y1="64" x2="56" y2="84" stroke="#0369a1" strokeWidth="1.5" />
          <line x1="68" y1="64" x2="68" y2="84" stroke="#0369a1" strokeWidth="1.5" />
        </svg>
      );
    case 'crypto-miner':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]`}>
          <defs>
            <linearGradient id="goldBlockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          {/* Mining Rope */}
          <line x1="50" y1="12" x2="50" y2="52" stroke="#d97706" strokeWidth="2" strokeDasharray="3 3" />
          {/* Claw / Hook */}
          <path d="M 38 42 Q 50 56 62 42" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <path d="M 44 48 L 41 54 M 56 48 L 59 54" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          {/* Bitcoin gold block being mined */}
          <rect x="36" y="58" width="28" height="28" rx="6" fill="url(#goldBlockGrad)" stroke="#f59e0b" strokeWidth="2" />
          <text x="50" y="78" fontSize="18" fontWeight="black" fontFamily="sans-serif" textAnchor="middle" fill="#78350f" opacity="0.9">฿</text>
          {/* Sparkles */}
          <polygon points="28,52 30,55 33,52 30,49" fill="#ffffff" />
          <polygon points="72,66 74,69 77,66 74,63" fill="#ffffff" />
        </svg>
      );
    case 'chicken-cross':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]`}>
          <defs>
            <linearGradient id="chickenBGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
          </defs>
          {/* Background road stripes */}
          <rect x="15" y="15" width="70" height="70" rx="10" fill="none" stroke="#22c55e" strokeWidth="2.5" opacity="0.3" />
          <path d="M 25 35 H 75 M 25 50 H 75 M 25 65 H 75" stroke="#ffffff" strokeWidth="6" strokeDasharray="12 8" opacity="0.15" />
          
          {/* Stylized Chicken body */}
          <circle cx="50" cy="53" r="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="58" cy="40" r="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          
          {/* Comb (Red) */}
          <path d="M 54 28 Q 58 20 62 28 Z" fill="#ef4444" />
          <path d="M 50 29 Q 53 22 56 29 Z" fill="#ef4444" />
          
          {/* Beak (Orange) */}
          <polygon points="66,38 74,42 66,44" fill="#f97316" />
          
          {/* Eye (Black) */}
          <circle cx="60" cy="38" r="2" fill="#000000" />
          
          {/* Wing (White/Gray) */}
          <path d="M 40 52 Q 44 44 52 52 Q 44 60 40 52 Z" fill="#f1f5f9" />
          
          {/* Legs (Yellow) */}
          <line x1="46" y1="68" x2="46" y2="78" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
          <line x1="54" y1="68" x2="54" y2="78" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
          <path d="M 42 78 H 48 M 50 78 H 56" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="30" fill="#3b82f6" />
        </svg>
      );
  }
}
