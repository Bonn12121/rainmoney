'use client';

import React from 'react';

interface SlotSymbolIconProps {
  themeId: string;
  symbolName: string;
  className?: string;
  fallbackChar?: string;
}

export function SlotSymbolIcon({ themeId, symbolName, className = 'w-12 h-12', fallbackChar }: SlotSymbolIconProps) {
  // Normalize names for easier matching
  const name = symbolName.toLowerCase().trim();

  // Helper to render fallback
  const renderFallback = () => {
    return <span className="text-white text-3xl font-extrabold select-none">{fallbackChar || '🎰'}</span>;
  };

  // 1. NEON FRUITS Theme
  if (themeId === 'slots-neon') {
    switch (name) {
      case 'wild star':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#facc15]`}>
            <polygon points="50,10 64,38 95,38 70,57 81,88 50,70 19,88 30,57 5,38 36,38" fill="none" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="10" fill="#facc15" opacity="0.3" />
          </svg>
        );
      case 'cherry':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ef4444]`}>
            <path d="M 60 20 C 50 30, 35 45, 35 65" fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 60 20 C 65 35, 65 45, 65 65" fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 60 20 C 70 15, 75 10, 80 15 Z" fill="#10b981" />
            <circle cx="35" cy="68" r="15" fill="none" stroke="#ef4444" strokeWidth="5" />
            <circle cx="65" cy="68" r="15" fill="none" stroke="#ef4444" strokeWidth="5" />
            <circle cx="31" cy="64" r="3" fill="#ffffff" />
            <circle cx="61" cy="64" r="3" fill="#ffffff" />
          </svg>
        );
      case 'lemon':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fbbf24]`}>
            <ellipse cx="50" cy="50" rx="32" ry="22" fill="none" stroke="#fbbf24" strokeWidth="4.5" transform="rotate(-30 50 50)" />
            <line x1="30" y1="38" x2="70" y2="62" stroke="#fbbf24" strokeWidth="3" opacity="0.5" />
            <line x1="38" y1="62" x2="62" y2="38" stroke="#fbbf24" strokeWidth="3" opacity="0.5" />
          </svg>
        );
      case 'orange':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#f97316]`}>
            <circle cx="50" cy="50" r="30" fill="none" stroke="#f97316" strokeWidth="4.5" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="6" fill="#f97316" />
          </svg>
        );
      case 'grape':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#a855f7]`}>
            <path d="M 50 15 Q 55 25, 52 32" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="38" r="8" fill="none" stroke="#a855f7" strokeWidth="3.5" />
            <circle cx="38" cy="46" r="8" fill="none" stroke="#a855f7" strokeWidth="3.5" />
            <circle cx="62" cy="46" r="8" fill="none" stroke="#a855f7" strokeWidth="3.5" />
            <circle cx="50" cy="54" r="8" fill="none" stroke="#a855f7" strokeWidth="3.5" />
            <circle cx="38" cy="62" r="8" fill="none" stroke="#a855f7" strokeWidth="3.5" />
            <circle cx="62" cy="62" r="8" fill="none" stroke="#a855f7" strokeWidth="3.5" />
            <circle cx="50" cy="70" r="8" fill="none" stroke="#a855f7" strokeWidth="3.5" />
          </svg>
        );
      case 'bell':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#facc15]`}>
            <path d="M 50 15 C 32 15, 30 50, 22 68 L 78 68 C 70 50, 68 15, 50 15 Z" fill="none" stroke="#facc15" strokeWidth="4.5" strokeLinejoin="round" />
            <circle cx="50" cy="76" r="7.5" fill="none" stroke="#facc15" strokeWidth="4" />
          </svg>
        );
      case 'diamond':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#22d3ee]`}>
            <polygon points="50,15 82,45 50,75 18,45" fill="none" stroke="#22d3ee" strokeWidth="4.5" strokeLinejoin="round" />
            <line x1="50" y1="15" x2="50" y2="75" stroke="#22d3ee" strokeWidth="2.5" opacity="0.4" />
            <line x1="18" y1="45" x2="82" y2="45" stroke="#22d3ee" strokeWidth="2.5" opacity="0.4" />
          </svg>
        );
      case 'lucky 7':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#ec4899]`}>
            <path d="M 25 25 H 75 L 42 75" fill="none" stroke="#ec4899" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="38" y1="46" x2="62" y2="46" stroke="#ec4899" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 2. PHARAOH'S GOLD Theme
  if (themeId === 'slots-egypt') {
    switch (name) {
      case 'scarabeus wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#0d9488]`}>
            <circle cx="50" cy="50" r="28" fill="#115e59" opacity="0.3" stroke="#0d9488" strokeWidth="2" />
            <path d="M 50 25 C 62 25, 68 38, 68 55 C 68 70, 58 78, 50 78 C 42 78, 32 70, 32 55 C 32 38, 38 25, 50 25 Z" fill="#0d9488" />
            <path d="M 50 25 V 78 M 32 52 H 68" stroke="#115e59" strokeWidth="3" />
            <path d="M 32 40 Q 20 35, 18 25 M 68 40 Q 80 35, 82 25 M 32 60 Q 18 65, 15 75 M 68 60 Q 82 65, 85 75" fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'lotus':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#f472b6]`}>
            <path d="M 50 75 C 30 75, 20 50, 50 25 C 80 50, 70 75, 50 75 Z" fill="#f472b6" opacity="0.9" />
            <path d="M 50 75 C 15 65, 15 45, 42 38 C 30 55, 38 70, 50 75 Z" fill="#db2777" />
            <path d="M 50 75 C 85 65, 85 45, 58 38 C 70 55, 62 70, 50 75 Z" fill="#db2777" />
          </svg>
        );
      case 'papyrus':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_6px_#d97706]`}>
            <rect x="25" y="28" width="50" height="44" rx="3" fill="#fef3c7" stroke="#b45309" strokeWidth="3" />
            <circle cx="25" cy="50" r="7" fill="#b45309" />
            <circle cx="75" cy="50" r="7" fill="#b45309" />
            <line x1="35" y1="40" x2="65" y2="40" stroke="#b45309" strokeWidth="2.5" />
            <line x1="35" y1="50" x2="65" y2="50" stroke="#b45309" strokeWidth="2.5" />
            <line x1="35" y1="60" x2="55" y2="60" stroke="#b45309" strokeWidth="2.5" />
          </svg>
        );
      case 'eye of horus':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#0284c7]`}>
            <path d="M 15 50 Q 50 18, 85 50 Q 50 82, 15 50 Z" fill="none" stroke="#0284c7" strokeWidth="4.5" />
            <circle cx="52" cy="50" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <circle cx="56" cy="46" r="4.5" fill="#ffffff" />
            <path d="M 28 45 L 20 62 M 72 45 L 80 62" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
            <path d="M 52 64 Q 45 78, 32 78" fill="none" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );
      case 'ankh':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fbbf24]`}>
            <path d="M 50 50 V 85 M 32 50 H 68" stroke="#fbbf24" strokeWidth="5.5" strokeLinecap="round" />
            <ellipse cx="50" cy="32" rx="14" ry="18" fill="none" stroke="#fbbf24" strokeWidth="5.5" />
          </svg>
        );
      case 'sarcophagus':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_#a16207]`}>
            <path d="M 50 15 C 65 15, 72 25, 72 42 C 72 65, 62 82, 50 88 C 38 82, 28 65, 28 42 C 28 25, 35 15, 50 15 Z" fill="#d97706" stroke="#78350f" strokeWidth="3.5" />
            <circle cx="50" cy="34" r="10" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
            <path d="M 45 32 Q 50 28, 55 32" stroke="#78350f" strokeWidth="2.5" />
            <path d="M 34 50 H 66 M 38 62 H 62 M 42 74 H 58" stroke="#78350f" strokeWidth="2.5" />
          </svg>
        );
      case 'pyramid':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ca8a04]`}>
            <polygon points="50,18 85,75 15,75" fill="#facc15" stroke="#a16207" strokeWidth="3" />
            <polygon points="50,18 50,75 85,75" fill="#ca8a04" />
            <line x1="50" y1="18" x2="32" y2="75" stroke="#78350f" strokeWidth="1.5" />
            <line x1="50" y1="18" x2="68" y2="75" stroke="#78350f" strokeWidth="1.5" />
          </svg>
        );
      case 'pharaoh':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#fbbf24]`}>
            {/* Nemes headdress back */}
            <path d="M 22 45 L 12 68 L 28 75 L 35 55 Z M 78 45 L 88 68 L 72 75 L 65 55 Z" fill="#ca8a04" stroke="#78350f" strokeWidth="2.5" />
            {/* Nemes stripes */}
            <path d="M 12 68 H 28 M 88 68 H 72 M 16 56 L 26 62 M 84 56 L 74 62" stroke="#1e3a8a" strokeWidth="2.5" />
            {/* Mask base */}
            <path d="M 32 30 C 32 15, 68 15, 68 30 C 68 55, 60 72, 50 78 C 40 72, 32 55, 32 30 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="3" />
            {/* Beard */}
            <rect x="46" y="78" width="8" height="12" fill="#1e3a8a" stroke="#78350f" strokeWidth="2" />
            {/* Eyes */}
            <ellipse cx="42" cy="38" rx="4" ry="2" fill="#ffffff" stroke="#000000" />
            <ellipse cx="58" cy="38" rx="4" ry="2" fill="#ffffff" stroke="#000000" />
            <circle cx="42" cy="38" r="1.5" fill="#000000" />
            <circle cx="58" cy="38" r="1.5" fill="#000000" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 3. SWEET CANDY REELS Theme
  if (themeId === 'slots-sweet') {
    switch (name) {
      case 'lollipop wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ec4899]`}>
            <path d="M 50 55 L 50 90" stroke="#fbcfe8" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="50" cy="38" r="24" fill="#ec4899" stroke="#db2777" strokeWidth="3" />
            {/* Spiral swirly lines */}
            <path d="M 50 14 A 24 24 0 0 0 26 38 A 24 24 0 0 0 50 62 A 18 18 0 0 0 68 44 A 12 12 0 0 0 50 32 A 6 6 0 0 0 44 38" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
        );
      case 'candy cane':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_6px_#f43f5e]`}>
            <path d="M 35 85 V 35 C 35 15, 65 15, 65 30" fill="none" stroke="#f43f5e" strokeWidth="9.5" strokeLinecap="round" />
            <path d="M 35 85 V 35 C 35 15, 65 15, 65 30" fill="none" stroke="#ffffff" strokeWidth="9.5" strokeLinecap="round" strokeDasharray="8 8" />
          </svg>
        );
      case 'gummy bear':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fb923c]`}>
            <path d="M 32 30 C 26 30, 26 20, 34 20 C 40 20, 42 26, 42 30 Z M 68 30 C 74 30, 74 20, 66 20 C 60 20, 58 26, 58 30 Z" fill="#fb923c" />
            <rect x="30" y="30" width="40" height="42" rx="14" fill="#fb923c" />
            <ellipse cx="38" cy="74" rx="8" ry="10" fill="#fb923c" />
            <ellipse cx="62" cy="74" rx="8" ry="10" fill="#fb923c" />
            <ellipse cx="26" cy="50" rx="6" ry="8" fill="#fb923c" />
            <ellipse cx="74" cy="50" rx="6" ry="8" fill="#fb923c" />
            {/* Glossy highlight */}
            <ellipse cx="40" cy="42" rx="2.5" ry="5" fill="#ffffff" opacity="0.4" />
          </svg>
        );
      case 'jelly bean':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#c084fc]`}>
            <path d="M 30 35 C 22 45, 22 65, 35 75 C 48 85, 68 75, 75 62 C 82 48, 70 30, 55 25 C 45 22, 35 28, 30 35 Z" fill="#a855f7" transform="rotate(-15 50 50)" />
            <path d="M 50 42 C 45 42, 42 46, 42 50 C 42 54, 45 58, 50 58 Z" fill="#070913" opacity="0.15" />
            <ellipse cx="44" cy="38" rx="4" ry="8" fill="#ffffff" opacity="0.45" transform="rotate(30 44 38)" />
          </svg>
        );
      case 'doughnut':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#f59e0b]`}>
            <circle cx="50" cy="50" r="30" fill="#d97706" />
            <circle cx="50" cy="50" r="26" fill="#ec4899" />
            <circle cx="50" cy="50" r="10" fill="#070913" />
            {/* Sprinkles */}
            <line x1="38" y1="36" x2="44" y2="34" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="62" y1="36" x2="58" y2="40" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="34" y1="56" x2="38" y2="62" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="60" y1="60" x2="66" y2="56" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case 'cupcake':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_#f472b6]`}>
            <polygon points="26,62 74,62 66,85 34,85" fill="#d97706" />
            {/* Stripes on cup */}
            <line x1="38" y1="62" x2="42" y2="85" stroke="#78350f" strokeWidth="1.5" />
            <line x1="50" y1="62" x2="50" y2="85" stroke="#78350f" strokeWidth="1.5" />
            <line x1="62" y1="62" x2="58" y2="85" stroke="#78350f" strokeWidth="1.5" />
            {/* Frosting cloud */}
            <path d="M 22 62 Q 18 50, 32 46 Q 30 32, 50 30 Q 70 32, 68 46 Q 82 50, 78 62 Z" fill="#fdf2f8" stroke="#f472b6" strokeWidth="2" />
            <path d="M 32 48 Q 50 44, 68 48" fill="none" stroke="#f472b6" strokeWidth="2" />
            {/* Cherry */}
            <circle cx="50" cy="24" r="6" fill="#e11d48" />
            <path d="M 50 18 Q 56 10, 62 14" fill="none" stroke="#10b981" strokeWidth="2" />
          </svg>
        );
      case 'chocolate':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#78350f]`}>
            <rect x="22" y="22" width="56" height="56" rx="4" fill="#451a03" stroke="#78350f" strokeWidth="3" />
            {/* Chocolate squares grid */}
            <rect x="28" y="28" width="20" height="20" rx="1.5" fill="#78350f" />
            <rect x="52" y="28" width="20" height="20" rx="1.5" fill="#78350f" />
            <rect x="28" y="52" width="20" height="20" rx="1.5" fill="#78350f" />
            <rect x="52" y="52" width="20" height="20" rx="1.5" fill="#78350f" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 4. PIRATE'S BOUNTY Theme
  if (themeId === 'slots-pirate') {
    switch (name) {
      case 'pirate flag wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ffffff]`}>
            <rect x="20" y="25" width="60" height="42" fill="#18181b" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="20" y1="25" x2="20" y2="85" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
            {/* Skull & Crossbones inside */}
            <circle cx="50" cy="42" r="7.5" fill="#ffffff" />
            <rect x="46" y="48" width="8" height="6" fill="#ffffff" rx="1" />
            <line x1="38" y1="36" x2="62" y2="52" stroke="#ffffff" strokeWidth="3.5" />
            <line x1="38" y1="52" x2="62" y2="36" stroke="#ffffff" strokeWidth="3.5" />
            <circle cx="48" cy="42" r="1.5" fill="#000000" />
            <circle cx="52" cy="42" r="1.5" fill="#000000" />
          </svg>
        );
      case 'rum bottle':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#059669]`}>
            <rect x="42" y="15" width="16" height="15" fill="#d97706" rx="1" />
            <path d="M 50 30 Q 30 38, 30 55 V 82 C 30 86, 70 86, 70 82 V 55 Q 70 38, 50 30 Z" fill="#047857" stroke="#34d399" strokeWidth="3" />
            <rect x="36" y="55" width="28" height="18" fill="#fef3c7" rx="1" />
            <text x="50" y="68" fontSize="11" fontWeight="bold" fill="#78350f" textAnchor="middle">RUM</text>
          </svg>
        );
      case 'anchor':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#94a3b8]`}>
            <line x1="50" y1="20" x2="50" y2="78" stroke="#94a3b8" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="50" cy="20" r="7.5" fill="none" stroke="#94a3b8" strokeWidth="4" />
            <line x1="34" y1="36" x2="66" y2="36" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            <path d="M 22 55 C 22 75, 78 75, 78 55" fill="none" stroke="#94a3b8" strokeWidth="5.5" strokeLinecap="round" />
            <polygon points="22,55 16,50 28,46" fill="#94a3b8" />
            <polygon points="78,55 84,50 72,46" fill="#94a3b8" />
          </svg>
        );
      case 'spyglass':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ca8a04]`}>
            <g transform="translate(50, 50) rotate(-35) translate(-50, -50)">
              <rect x="20" y="44" width="25" height="12" fill="#78350f" />
              <rect x="45" y="42" width="20" height="16" fill="#ca8a04" stroke="#fbbf24" strokeWidth="1" />
              <rect x="65" y="40" width="15" height="20" fill="#a16207" />
              <rect x="80" y="38" width="8" height="24" fill="#fbbf24" />
              <ellipse cx="88" cy="50" rx="1.5" ry="10" fill="#38bdf8" />
            </g>
          </svg>
        );
      case 'pirate hook':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#cbd5e1]`}>
            <rect x="36" y="65" width="28" height="20" rx="3" fill="#334155" stroke="#1e293b" strokeWidth="2.5" />
            <path d="M 50 65 V 45 C 50 25, 22 25, 22 45 Q 22 55, 30 55 C 34 55, 34 45, 30 45 C 30 35, 42 35, 42 45 V 65" fill="none" stroke="#cbd5e1" strokeWidth="6.5" strokeLinecap="round" />
          </svg>
        );
      case 'parrot':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ef4444]`}>
            <ellipse cx="50" cy="45" rx="18" ry="24" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
            {/* Face details */}
            <path d="M 55 35 Q 72 40, 62 52 Q 54 44, 55 35 Z" fill="#facc15" />
            <circle cx="44" cy="38" r="7.5" fill="#ffffff" />
            <circle cx="44" cy="38" r="2.5" fill="#000000" />
            {/* Wing */}
            <path d="M 32 42 Q 22 55, 35 72 Q 45 55, 32 42 Z" fill="#3b82f6" />
            {/* Crest feathers */}
            <path d="M 45 22 Q 50 10, 56 16 M 52 20 Q 58 10, 62 18" stroke="#facc15" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        );
      case 'treasure chest':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#fbbf24]`}>
            <rect x="18" y="44" width="64" height="42" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="3" />
            <path d="M 18 44 C 18 25, 82 25, 82 44 Z" fill="#a16207" stroke="#451a03" strokeWidth="3" />
            {/* Gold coins overflowing */}
            <circle cx="34" cy="44" r="5" fill="#facc15" stroke="#ca8a04" />
            <circle cx="45" cy="42" r="5" fill="#facc15" stroke="#ca8a04" />
            <circle cx="55" cy="43" r="5" fill="#facc15" stroke="#ca8a04" />
            <circle cx="66" cy="44" r="5" fill="#facc15" stroke="#ca8a04" />
            {/* Lock */}
            <rect x="46" y="42" width="8" height="12" fill="#fbbf24" stroke="#a16207" strokeWidth="1.5" />
            <circle cx="50" cy="46" r="1.5" fill="#000000" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 5. ZEUS OLYMPUS Theme
  if (themeId === 'slots-zeus') {
    switch (name) {
      case 'lightning wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#fbbf24]`}>
            <polygon points="65,10 25,52 48,52 35,90 75,44 52,44" fill="#fbbf24" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
          </svg>
        );
      case 'shield':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ca8a04]`}>
            <circle cx="50" cy="50" r="32" fill="#d97706" stroke="#fbbf24" strokeWidth="3.5" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="#78350f" strokeWidth="2.5" />
            {/* Medusa face simple sketch */}
            <circle cx="50" cy="50" r="8" fill="#fbbf24" />
            <path d="M 45 42 Q 50 38, 55 42 M 42 48 Q 50 54, 58 48" fill="none" stroke="#78350f" strokeWidth="2" />
          </svg>
        );
      case 'helmet':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fbbf24]`}>
            <path d="M 50 12 Q 35 10, 32 25 Q 32 30, 22 28 Q 28 8, 50 8 Z" fill="#ef4444" />
            <path d="M 32 32 C 32 22, 68 22, 68 32 V 68 H 32 Z" fill="#d97706" stroke="#fbbf24" strokeWidth="2.5" />
            {/* T-shape visor opening */}
            <path d="M 42 42 H 58 V 52 H 53 V 72 H 47 V 52 H 42 Z" fill="#070913" />
          </svg>
        );
      case 'goblet':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fbbf24]`}>
            <ellipse cx="50" cy="22" rx="20" ry="6" fill="#b91c1c" />
            <path d="M 30 22 C 30 45, 70 45, 70 22 Z" fill="none" stroke="#fbbf24" strokeWidth="4.5" />
            <line x1="50" y1="42" x2="50" y2="76" stroke="#fbbf24" strokeWidth="5.5" />
            <ellipse cx="50" cy="78" rx="16" ry="6" fill="none" stroke="#fbbf24" strokeWidth="4.5" />
          </svg>
        );
      case 'harpie eagle':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#cbd5e1]`}>
            <path d="M 50 22 C 38 22, 28 32, 24 50 L 50 78 L 76 50 C 72 32, 62 22, 50 22 Z" fill="#94a3b8" />
            <path d="M 50 25 L 42 36 H 58 Z" fill="#cbd5e1" />
            <polygon points="50,78 45,86 55,86" fill="#facc15" />
            <circle cx="42" cy="36" r="1.5" fill="#000000" />
            <circle cx="58" cy="36" r="1.5" fill="#000000" />
          </svg>
        );
      case 'acropolis temple':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#93c5fd]`}>
            <polygon points="50,22 82,38 18,38" fill="#60a5fa" />
            {/* Columns */}
            <rect x="25" y="42" width="6" height="32" fill="#93c5fd" />
            <rect x="41" y="42" width="6" height="32" fill="#93c5fd" />
            <rect x="53" y="42" width="6" height="32" fill="#93c5fd" />
            <rect x="69" y="42" width="6" height="32" fill="#93c5fd" />
            {/* Base */}
            <rect x="15" y="74" width="70" height="8" fill="#60a5fa" />
          </svg>
        );
      case 'zeus god':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#38bdf8]`}>
            {/* Beard */}
            <path d="M 32 50 C 32 75, 68 75, 68 50 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Hair */}
            <path d="M 30 42 C 18 30, 82 30, 70 42" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
            {/* Face */}
            <circle cx="50" cy="44" r="16" fill="#fed7aa" />
            {/* Eyes glowing blue */}
            <circle cx="44" cy="42" r="3" fill="#00efff" className="animate-pulse" />
            <circle cx="56" cy="42" r="3" fill="#00efff" className="animate-pulse" />
            {/* Laurel wreath */}
            <path d="M 34 32 Q 50 25, 66 32" fill="none" stroke="#10b981" strokeWidth="4.5" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 6. CYBERPUNK REELS Theme
  if (themeId === 'slots-cyber') {
    switch (name) {
      case 'floppy wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ec4899]`}>
            <polygon points="22,22 66,22 78,34 78,78 22,78" fill="#ec4899" stroke="#ffffff" strokeWidth="3" />
            <rect x="34" y="52" width="32" height="26" fill="#ffffff" />
            <rect x="42" y="22" width="20" height="18" fill="#1e293b" />
          </svg>
        );
      case 'cyber goggles':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#06b6d4]`}>
            <path d="M 18 42 H 82 V 58 C 82 66, 68 66, 68 58 Q 50 64, 32 58 C 32 66, 18 66, 18 58 Z" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="18" y1="50" x2="82" y2="50" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        );
      case 'laser gun':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#10b981]`}>
            <rect x="22" y="38" width="40" height="14" rx="2" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <rect x="42" y="52" width="10" height="24" fill="#374151" transform="rotate(15 47 64)" />
            <circle cx="22" cy="45" r="4" fill="#a7f3d0" />
            <line x1="62" y1="45" x2="85" y2="45" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
        );
      case 'memory module':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#a855f7]`}>
            <rect x="15" y="38" width="70" height="24" rx="2" fill="#7e22ce" stroke="#d8b4fe" strokeWidth="2" />
            {/* Pins */}
            <line x1="20" y1="62" x2="20" y2="66" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="30" y1="62" x2="30" y2="66" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="40" y1="62" x2="40" y2="66" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="50" y1="62" x2="50" y2="66" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="60" y1="62" x2="60" y2="66" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="70" y1="62" x2="70" y2="66" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="80" y1="62" x2="80" y2="66" stroke="#fbbf24" strokeWidth="2.5" />
          </svg>
        );
      case 'cybernetic arm':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#94a3b8]`}>
            <rect x="25" y="70" width="16" height="20" fill="#475569" />
            <path d="M 33 70 V 40 C 33 30, 50 30, 50 40 L 45 42 V 70" fill="none" stroke="#94a3b8" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 50 40 Q 64 35, 68 45" fill="none" stroke="#64748b" strokeWidth="4" />
          </svg>
        );
      case 'biohazard core':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#f97316]`}>
            <polygon points="50,15 85,75 15,75" fill="none" stroke="#f97316" strokeWidth="4.5" strokeLinejoin="round" />
            <circle cx="50" cy="56" r="10" fill="none" stroke="#f97316" strokeWidth="3" />
            <line x1="50" y1="36" x2="50" y2="46" stroke="#f97316" strokeWidth="3" />
            <line x1="38" y1="64" x2="44" y2="58" stroke="#f97316" strokeWidth="3" />
            <line x1="62" y1="64" x2="56" y2="58" stroke="#f97316" strokeWidth="3" />
          </svg>
        );
      case 'android head':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#a855f7]`}>
            <rect x="28" y="28" width="44" height="44" rx="8" fill="#1e1b4b" stroke="#a855f7" strokeWidth="3.5" />
            <circle cx="40" cy="45" r="4.5" fill="#00efff" className="animate-pulse" />
            <circle cx="60" cy="45" r="4.5" fill="#00efff" className="animate-pulse" />
            {/* Circuits on face */}
            <path d="M 50 28 V 38 M 50 56 V 72 M 28 50 H 38 M 72 50 H 62" stroke="#ec4899" strokeWidth="2.5" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 7. SAFARI WILDS Theme
  if (themeId === 'slots-safari') {
    switch (name) {
      case 'paw print wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ca8a04]`}>
            <circle cx="50" cy="58" r="18" fill="#a16207" />
            {/* Toes */}
            <circle cx="28" cy="38" r="7.5" fill="#a16207" />
            <circle cx="42" cy="28" r="7.5" fill="#a16207" />
            <circle cx="58" cy="28" r="7.5" fill="#a16207" />
            <circle cx="72" cy="38" r="7.5" fill="#a16207" />
          </svg>
        );
      case 'safari compass':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ef4444]`}>
            <circle cx="50" cy="50" r="30" fill="none" stroke="#94a3b8" strokeWidth="4.5" />
            <polygon points="50,26 56,50 50,56" fill="#ef4444" />
            <polygon points="50,74 44,50 50,44" fill="#cbd5e1" />
            <circle cx="50" cy="50" r="3" fill="#ffffff" />
          </svg>
        );
      case 'savanna zebra':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_6px_#ffffff]`}>
            <circle cx="50" cy="50" r="30" fill="#18181b" stroke="#ffffff" strokeWidth="2.5" />
            {/* Zebra Stripes */}
            <path d="M 28 35 H 46 L 36 45 H 24 Z M 32 50 H 52 L 44 60 H 28 Z M 36 65 H 58 L 50 75 H 32 Z" fill="#ffffff" />
          </svg>
        );
      case 'jungle giraffe':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#f59e0b]`}>
            {/* Giraffe Head Silhouette */}
            <path d="M 40 85 V 38 L 30 22 C 34 22, 42 28, 46 32 L 48 20 C 50 20, 52 24, 52 28 L 52 38 L 56 34 C 62 34, 64 42, 58 48 L 52 52 V 85 Z" fill="#eab308" />
            <circle cx="45" cy="55" r="2.5" fill="#78350f" />
            <circle cx="48" cy="72" r="2.5" fill="#78350f" />
          </svg>
        );
      case 'cheetah':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fb923c]`}>
            <circle cx="50" cy="50" r="30" fill="#fb923c" stroke="#ca8a04" strokeWidth="2" />
            {/* Spots */}
            <circle cx="36" cy="36" r="3" fill="#1e293b" />
            <circle cx="64" cy="36" r="3" fill="#1e293b" />
            <circle cx="50" cy="46" r="3.5" fill="#1e293b" />
            <circle cx="34" cy="58" r="3" fill="#1e293b" />
            <circle cx="66" cy="58" r="3" fill="#1e293b" />
            <circle cx="50" cy="66" r="2.5" fill="#1e293b" />
          </svg>
        );
      case 'savanna elephant':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#cbd5e1]`}>
            <path d="M 32 36 C 18 36, 18 56, 32 60 C 35 70, 48 76, 62 76 C 75 76, 85 64, 85 50 C 85 32, 68 28, 50 32 C 45 32, 38 34, 32 36 Z" fill="#94a3b8" />
            {/* Trunk */}
            <path d="M 74 46 Q 88 52, 85 68 Q 80 72, 75 64" fill="none" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
            {/* Ear */}
            <ellipse cx="44" cy="46" rx="14" ry="18" fill="#cbd5e1" />
          </svg>
        );
      case 'king lion':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#fbbf24]`}>
            {/* Mane */}
            <path d="M 50 15 C 30 15, 20 28, 20 50 C 20 72, 30 85, 50 85 C 70 85, 80 72, 80 50 C 80 28, 70 15, 50 15 Z" fill="#ca8a04" stroke="#78350f" strokeWidth="2.5" />
            {/* Face */}
            <ellipse cx="50" cy="54" rx="20" ry="22" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
            {/* Eyes */}
            <polygon points="40,46 46,48 42,42" fill="#ffffff" stroke="#000000" />
            <polygon points="60,46 54,48 58,42" fill="#ffffff" stroke="#000000" />
            {/* Nose & Mouth */}
            <polygon points="46,56 54,56 50,62" fill="#78350f" />
            <path d="M 50 62 Q 46 68, 42 66 M 50 62 Q 54 68, 58 66" fill="none" stroke="#78350f" strokeWidth="2" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 8. DRAGON'S FORTUNE Theme
  if (themeId === 'slots-dragon') {
    switch (name) {
      case 'lantern wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ef4444]`}>
            <ellipse cx="50" cy="50" rx="24" ry="30" fill="#dc2626" stroke="#facc15" strokeWidth="3" />
            <line x1="50" y1="12" x2="50" y2="20" stroke="#facc15" strokeWidth="4.5" />
            <line x1="50" y1="80" x2="50" y2="88" stroke="#facc15" strokeWidth="4.5" />
            <path d="M 50 20 Q 34 50, 50 80 Q 66 50, 50 20" fill="none" stroke="#facc15" strokeWidth="2" />
          </svg>
        );
      case 'chinese fan':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ec4899]`}>
            <path d="M 18 64 C 18 36, 82 36, 82 64 Z" fill="#db2777" stroke="#fbbf24" strokeWidth="2.5" />
            {/* Spokes */}
            <line x1="50" y1="64" x2="22" y2="54" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="50" y1="64" x2="32" y2="40" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="50" y1="64" x2="50" y2="36" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="50" y1="64" x2="68" y2="40" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="50" y1="64" x2="78" y2="54" stroke="#fbbf24" strokeWidth="2.5" />
          </svg>
        );
      case 'firecracker':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_6px_#ef4444]`}>
            <rect x="30" y="24" width="10" height="26" fill="#dc2626" rx="1.5" stroke="#facc15" strokeWidth="1" />
            <rect x="44" y="32" width="10" height="26" fill="#dc2626" rx="1.5" stroke="#facc15" strokeWidth="1" />
            <rect x="58" y="24" width="10" height="26" fill="#dc2626" rx="1.5" stroke="#facc15" strokeWidth="1" />
            {/* Fuse */}
            <path d="M 35 24 Q 44 14, 50 14" fill="none" stroke="#facc15" strokeWidth="2" />
            <path d="M 63 24 Q 54 14, 50 14" fill="none" stroke="#facc15" strokeWidth="2" />
          </svg>
        );
      case 'gold coin':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fbbf24]`}>
            <circle cx="50" cy="50" r="30" fill="#facc15" stroke="#ca8a04" strokeWidth="3.5" />
            {/* Square Hole */}
            <rect x="42" y="42" width="16" height="16" fill="#070913" stroke="#ca8a04" strokeWidth="2" />
          </svg>
        );
      case 'pagoda temple':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#b45309]`}>
            <path d="M 28 62 H 72 V 75 H 28 Z" fill="#d97706" />
            <path d="M 32 44 H 68 V 62 H 32 Z" fill="#b45309" />
            <path d="M 38 26 H 62 V 44 H 38 Z" fill="#78350f" />
            {/* Flared roofs */}
            <path d="M 20 62 Q 50 50, 80 62" fill="none" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 24 44 Q 50 32, 76 44" fill="none" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 30 26 Q 50 15, 70 26" fill="none" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
        );
      case 'golden phoenix':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fb923c]`}>
            <path d="M 50 22 C 34 22, 24 35, 20 54 C 20 74, 38 82, 50 82 C 62 82, 80 74, 80 54 C 80 35, 66 22, 50 22 Z" fill="#f97316" opacity="0.3" />
            <path d="M 50 25 L 34 44 Q 50 48, 66 44 Z" fill="#fb923c" />
            <polygon points="50,82 45,90 55,90" fill="#facc15" />
            {/* Eye */}
            <circle cx="50" cy="32" r="1.5" fill="#ffffff" />
          </svg>
        );
      case 'golden dragon':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#facc15]`}>
            <ellipse cx="50" cy="48" rx="24" ry="20" fill="#15803d" stroke="#facc15" strokeWidth="3" />
            {/* Whiskers */}
            <path d="M 34 52 C 22 55, 18 45, 12 50 M 66 52 C 78 55, 82 45, 88 50" fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
            {/* Horns */}
            <path d="M 38 32 Q 32 18, 22 20 M 62 32 Q 68 18, 78 20" fill="none" stroke="#facc15" strokeWidth="3.5" strokeLinecap="round" />
            {/* Eyes glowing red */}
            <circle cx="42" cy="40" r="3.5" fill="#ef4444" />
            <circle cx="58" cy="40" r="3.5" fill="#ef4444" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 9. LEPRECHAUN GOLD Theme
  if (themeId === 'slots-irish') {
    switch (name) {
      case 'rainbow wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#f43f5e]`}>
            <path d="M 18 70 A 32 32 0 0 1 82 70" fill="none" stroke="#ef4444" strokeWidth="4" />
            <path d="M 23 70 A 27 27 0 0 1 77 70" fill="none" stroke="#fb923c" strokeWidth="4" />
            <path d="M 28 70 A 22 22 0 0 1 72 70" fill="none" stroke="#fbbf24" strokeWidth="4" />
            <path d="M 33 70 A 17 17 0 0 1 67 70" fill="none" stroke="#10b981" strokeWidth="4" />
            <path d="M 38 70 A 12 12 0 0 1 62 70" fill="none" stroke="#3b82f6" strokeWidth="4" />
          </svg>
        );
      case 'pint of stout':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#f59e0b]`}>
            <polygon points="34,28 66,28 60,78 40,78" fill="#18181b" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Cream head foam */}
            <rect x="32" y="20" width="36" height="10" rx="3" fill="#fef3c7" />
          </svg>
        );
      case 'wood pipe':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_6px_#78350f]`}>
            <path d="M 18 42 H 44 Q 50 42, 50 50 V 62 Q 50 68, 62 68 H 82" fill="none" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
            <rect x="14" y="34" width="12" height="16" rx="1.5" fill="#facc15" />
            <circle cx="80" cy="68" r="6" fill="#a16207" />
          </svg>
        );
      case 'golden horseshoe':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#fbbf24]`}>
            <path d="M 28 25 V 50 C 28 65, 72 65, 72 50 V 25" fill="none" stroke="#facc15" strokeWidth="7.5" strokeLinecap="round" />
            {/* Ridges/dots */}
            <circle cx="34" cy="38" r="2.5" fill="#78350f" />
            <circle cx="34" cy="50" r="2.5" fill="#78350f" />
            <circle cx="50" cy="58" r="2.5" fill="#78350f" />
            <circle cx="66" cy="50" r="2.5" fill="#78350f" />
            <circle cx="66" cy="38" r="2.5" fill="#78350f" />
          </svg>
        );
      case 'leprechaun hat':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#10b981]`}>
            <rect x="32" y="22" width="36" height="42" fill="#047857" stroke="#064e3b" strokeWidth="2.5" />
            {/* Gold buckle band */}
            <rect x="32" y="52" width="36" height="12" fill="#111827" />
            <rect x="44" y="50" width="12" height="16" fill="#fbbf24" stroke="#ca8a04" strokeWidth="1.5" />
            {/* Brim */}
            <ellipse cx="50" cy="64" rx="30" ry="6" fill="#047857" stroke="#064e3b" strokeWidth="2.5" />
          </svg>
        );
      case 'four-leaf clover':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#22c55e]`}>
            <path d="M 50 50 Q 52 75, 64 88" fill="none" stroke="#166534" strokeWidth="6" strokeLinecap="round" />
            {/* Four petals */}
            <circle cx="50" cy="34" r="11" fill="#22c55e" stroke="#166534" strokeWidth="2" />
            <circle cx="66" cy="50" r="11" fill="#22c55e" stroke="#166534" strokeWidth="2" />
            <circle cx="50" cy="66" r="11" fill="#22c55e" stroke="#166534" strokeWidth="2" />
            <circle cx="34" cy="50" r="11" fill="#22c55e" stroke="#166534" strokeWidth="2" />
          </svg>
        );
      case 'leprechaun gold pot':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_#fbbf24]`}>
            <path d="M 24 55 C 24 75, 76 75, 76 55 Z" fill="#1f2937" stroke="#111827" strokeWidth="3" />
            <ellipse cx="50" cy="54" rx="26" ry="6" fill="#111827" />
            {/* Gold overflowing */}
            <circle cx="36" cy="50" r="6.5" fill="#facc15" stroke="#ca8a04" />
            <circle cx="46" cy="46" r="6.5" fill="#facc15" stroke="#ca8a04" />
            <circle cx="56" cy="48" r="6.5" fill="#facc15" stroke="#ca8a04" />
            <circle cx="64" cy="52" r="6.5" fill="#facc15" stroke="#ca8a04" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // 10. UNDERSEA RICHES Theme
  if (themeId === 'slots-undersea') {
    switch (name) {
      case 'trident wild':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#38bdf8]`}>
            <line x1="50" y1="18" x2="50" y2="85" stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 30 36 C 30 54, 70 54, 70 36" fill="none" stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="30" y1="36" x2="30" y2="22" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
            <line x1="70" y1="36" x2="70" y2="22" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );
      case 'pearl':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#e2e8f0]`}>
            <path d="M 22 55 C 22 36, 78 36, 78 55 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2.5" />
            <path d="M 22 55 C 22 74, 78 74, 78 55 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2.5" />
            {/* Pearl inside */}
            <circle cx="50" cy="54" r="8.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="48" cy="51" r="2" fill="#ffffff" />
          </svg>
        );
      case 'coral':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ef4444]`}>
            <path d="M 50 85 V 50 M 50 62 Q 36 54, 30 42 M 50 55 Q 64 48, 68 38 M 30 42 V 32 M 68 38 V 26" fill="none" stroke="#f87171" strokeWidth="8" strokeLinecap="round" />
          </svg>
        );
      case 'jellyfish':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#38bdf8]`}>
            <path d="M 26 50 C 26 30, 74 30, 74 50 Z" fill="#38bdf8" opacity="0.8" />
            {/* Tentacles */}
            <path d="M 34 50 Q 32 68, 38 82 M 50 50 Q 48 68, 52 82 M 66 50 Q 64 68, 68 82" fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'crab':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#ef4444]`}>
            <ellipse cx="50" cy="54" rx="22" ry="15" fill="#ef4444" />
            {/* Legs */}
            <path d="M 28 58 Q 14 62, 12 70 M 72 58 Q 86 62, 88 70 M 34 62 Q 22 68, 18 78 M 66 62 Q 78 68, 82 78" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
            {/* Claws */}
            <path d="M 32 44 Q 24 32, 18 42 M 68 44 Q 76 32, 82 42" fill="none" stroke="#b91c1c" strokeWidth="4.5" strokeLinecap="round" />
            {/* Eyes */}
            <circle cx="44" cy="38" r="2.5" fill="#000000" />
            <circle cx="56" cy="38" r="2.5" fill="#000000" />
          </svg>
        );
      case 'octopus':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_8px_#c084fc]`}>
            <circle cx="50" cy="42" r="18" fill="#a855f7" />
            {/* Tentacles */}
            <path d="M 36 50 Q 22 64, 30 78 M 64 50 Q 78 64, 70 78 M 45 56 Q 40 70, 50 82 M 55 56 Q 60 70, 50 82" fill="none" stroke="#c084fc" strokeWidth="4" strokeLinecap="round" />
            <circle cx="44" cy="42" r="2" fill="#000000" />
            <circle cx="56" cy="42" r="2" fill="#000000" />
          </svg>
        );
      case 'sunken chest':
        return (
          <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_#047857]`}>
            <rect x="20" y="44" width="60" height="38" fill="#15803d" stroke="#052e16" strokeWidth="2.5" />
            <path d="M 20 44 C 20 25, 80 25, 80 44 Z" fill="#16a34a" stroke="#052e16" strokeWidth="2.5" />
            {/* Seaweed */}
            <path d="M 28 32 Q 32 45, 26 55 T 32 75" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
            <path d="M 72 32 Q 68 45, 74 55 T 68 75" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      default:
        return renderFallback();
    }
  }

  // Final fallback
  return renderFallback();
}
