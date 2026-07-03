'use client';

import React from 'react';

interface CustomEmojiProps {
  name:
    | 'balloon'
    | 'sparkles'
    | 'explosion'
    | 'rock'
    | 'paper'
    | 'scissors'
    | 'clover'
    | 'cherry'
    | 'lemon'
    | 'orange'
    | 'grape'
    | 'bell'
    | 'diamond'
    | 'seven'
    | 'skull'
    | 'coin';
  className?: string;
}

export function CustomEmoji({ name, className = 'w-6 h-6' }: CustomEmojiProps) {
  switch (name) {
    case 'balloon':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(14,165,233,0.5)]`}>
          <defs>
            <linearGradient id="balloonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Balloon string */}
          <path d="M 50 64 Q 45 76 53 88 Q 50 94 52 98" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
          {/* Balloon knot */}
          <polygon points="50,58 56,66 44,66" fill="#0284c7" />
          {/* Balloon body */}
          <ellipse cx="50" cy="38" rx="24" ry="26" fill="url(#balloonGrad)" />
          {/* Reflection highlight */}
          <ellipse cx="40" cy="28" rx="7" ry="9" fill="#ffffff" opacity="0.45" transform="rotate(-15 40 28)" />
        </svg>
      );

    case 'sparkles':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(253,224,71,0.6)]`}>
          <defs>
            <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          {/* Large Sparkle */}
          <path d="M 50 10 C 50 10 50 50 10 50 C 50 50 50 90 50 90 C 50 90 50 50 90 50 C 50 50 50 10 50 10 Z" fill="url(#sparkGrad)" />
          {/* Small Sparkle Offset */}
          <path d="M 22 18 C 22 18 22 34 6 34 C 22 34 22 50 22 50 C 22 50 22 34 38 34 C 22 34 22 18 22 18 Z" fill="url(#sparkGrad)" opacity="0.8" />
          {/* Tiny Sparkle Offset */}
          <path d="M 76 66 C 76 66 76 76 66 76 C 76 76 76 86 76 86 C 76 86 76 76 86 76 C 76 76 76 66 76 66 Z" fill="url(#sparkGrad)" opacity="0.9" />
        </svg>
      );

    case 'explosion':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]`}>
          <defs>
            <linearGradient id="expGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="35%" stopColor="#f87171" />
              <stop offset="70%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="innerExpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Outer Explosion spikes */}
          <polygon
            points="50,6 56,28 75,15 67,36 90,32 72,50 88,68 67,64 75,85 56,72 50,94 44,72 25,85 33,64 12,68 28,50 10,32 33,36 25,15 44,28"
            fill="url(#expGrad)"
          />
          {/* Inner core explosion */}
          <polygon
            points="50,22 54,37 68,28 62,42 78,39 65,50 76,62 62,59 68,74 54,65 50,80 46,65 32,74 38,59 24,62 35,50 22,39 38,42 32,28 46,37"
            fill="url(#innerExpGrad)"
          />
        </svg>
      );

    case 'rock':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]`}>
          <defs>
            <linearGradient id="rockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          {/* Wrist / Arm */}
          <path d="M 36 78 L 36 94 L 64 94 L 64 78 Z" fill="#c2410c" opacity="0.9" />
          {/* Fist Outline */}
          <path
            d="M 30 78 C 22 74, 18 62, 22 50 C 24 45, 30 40, 36 40 C 38 34, 46 32, 52 34 C 54 28, 62 28, 68 32 C 72 28, 80 28, 84 34 C 88 40, 88 56, 80 72 C 76 80, 64 84, 50 82 Z"
            fill="url(#rockGrad)"
            stroke="#7c2d12"
            strokeWidth="3.5"
          />
          {/* Thumb */}
          <path d="M 22 50 C 26 52, 38 52, 46 46 C 48 54, 38 64, 28 66 Z" fill="#ea580c" stroke="#7c2d12" strokeWidth="2.5" />
          {/* Finger divisions */}
          <path d="M 40 40 L 40 70" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 54 36 L 54 72" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 68 34 L 68 70" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'paper':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]`}>
          <defs>
            <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="50%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Wrist */}
          <path d="M 38 82 L 38 94 L 62 94 L 62 82 Z" fill="#ea580c" opacity="0.8" />
          {/* Open Hand */}
          <path
            d="M 38 82 C 30 82, 24 74, 24 64 L 24 40 C 24 35, 28 32, 32 32 C 36 32, 38 35, 38 40 L 38 20 C 38 15, 42 12, 46 12 C 50 12, 52 15, 52 20 L 52 22 C 52 16, 56 14, 60 14 C 64 14, 66 16, 66 22 L 66 26 C 66 20, 70 18, 74 18 C 78 18, 80 20, 80 26 L 80 56 C 80 68, 74 76, 62 80 Z"
            fill="url(#paperGrad)"
            stroke="#7c2d12"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Thumb */}
          <path d="M 24 62 C 14 58, 10 48, 16 42 C 22 36, 26 44, 28 48" fill="url(#paperGrad)" stroke="#7c2d12" strokeWidth="3" />
        </svg>
      );

    case 'scissors':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]`}>
          <defs>
            <linearGradient id="scissGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          {/* Wrist */}
          <path d="M 38 80 L 38 94 L 62 94 L 62 80 Z" fill="#c2410c" opacity="0.8" />
          {/* Fist base with Index and Middle fingers extended */}
          <path
            d="M 38 80 C 30 80, 24 72, 24 60 C 24 50, 32 45, 38 45 L 38 18 C 38 13, 42 10, 46 10 C 50 10, 52 13, 52 18 L 52 50 L 52 18 C 52 13, 56 10, 60 10 C 64 10, 66 13, 66 18 L 66 50 C 66 52, 70 54, 74 54 C 78 54, 80 50, 80 46 L 80 62 C 80 72, 72 80, 60 80 Z"
            fill="url(#scissGrad)"
            stroke="#7c2d12"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Thumb tucked */}
          <path d="M 24 55 C 28 57, 36 57, 42 50 C 44 58, 36 66, 28 66 Z" fill="#ea580c" stroke="#7c2d12" strokeWidth="2.5" />
          {/* Folded Ring and Pinky lines */}
          <path d="M 66 56 C 70 56, 74 62, 70 68" fill="none" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 52 58 C 56 58, 62 62, 58 68" fill="none" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'clover':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]`}>
          <defs>
            <linearGradient id="cloverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
          </defs>
          {/* Stem */}
          <path d="M 50 50 Q 52 75 64 88" fill="none" stroke="#059669" strokeWidth="6.5" strokeLinecap="round" />
          {/* 4 Leaves (drawn as hearts) */}
          {/* Top Leaf */}
          <path d="M 50 50 C 38 34, 40 18, 50 18 C 60 18, 62 34, 50 50 Z" fill="url(#cloverGrad)" stroke="#065f46" strokeWidth="2" />
          {/* Right Leaf */}
          <path d="M 50 50 C 66 38, 82 40, 82 50 C 82 60, 66 62, 50 50 Z" fill="url(#cloverGrad)" stroke="#065f46" strokeWidth="2" />
          {/* Bottom Leaf */}
          <path d="M 50 50 C 62 66, 60 82, 50 82 C 40 82, 38 66, 50 50 Z" fill="url(#cloverGrad)" stroke="#065f46" strokeWidth="2" />
          {/* Left Leaf */}
          <path d="M 50 50 C 34 62, 18 60, 18 50 C 18 40, 34 38, 50 50 Z" fill="url(#cloverGrad)" stroke="#065f46" strokeWidth="2" />
          {/* Center glow */}
          <circle cx="50" cy="50" r="5" fill="#a7f3d0" opacity="0.7" />
        </svg>
      );

    case 'cherry':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]`}>
          <defs>
            <linearGradient id="cherryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="40%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          {/* Stems */}
          <path d="M 50 20 Q 32 40 32 64" fill="none" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 50 20 Q 64 42 66 60" fill="none" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" />
          {/* Leaf */}
          <path d="M 50 20 Q 62 10 72 16 Q 62 26 50 20 Z" fill="url(#leafGrad)" stroke="#064e3b" strokeWidth="1.5" />
          {/* Left Cherry */}
          <circle cx="32" cy="66" r="16" fill="url(#cherryGrad)" stroke="#7f1d1d" strokeWidth="2" />
          <circle cx="27" cy="60" r="4.5" fill="#ffffff" opacity="0.65" />
          {/* Right Cherry */}
          <circle cx="68" cy="62" r="16" fill="url(#cherryGrad)" stroke="#7f1d1d" strokeWidth="2" />
          <circle cx="63" cy="56" r="4.5" fill="#ffffff" opacity="0.65" />
        </svg>
      );

    case 'lemon':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]`}>
          <defs>
            <linearGradient id="lemonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          {/* Lemon body */}
          <path
            d="M 18 50 C 26 30, 48 24, 68 32 C 82 38, 88 50, 82 64 C 72 80, 48 84, 28 74 C 18 66, 12 58, 18 50 Z"
            fill="url(#lemonGrad)"
            stroke="#713f12"
            strokeWidth="2.5"
          />
          {/* Left pointed tip */}
          <circle cx="16" cy="50" r="3.5" fill="#ca8a04" />
          {/* Right pointed tip */}
          <circle cx="83" cy="50" r="3.5" fill="#ca8a04" />
          {/* Leaf */}
          <path d="M 68 32 Q 80 18 76 10 Q 64 16 68 32 Z" fill="#15803d" stroke="#14532d" strokeWidth="1" />
          {/* Reflection */}
          <path d="M 30 38 Q 45 32 60 36" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.45" strokeLinecap="round" />
        </svg>
      );

    case 'orange':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]`}>
          <defs>
            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          {/* Leaf and stem */}
          <path d="M 50 24 L 50 14 Q 62 10 68 18 Q 58 24 50 24" fill="#15803d" stroke="#14532d" strokeWidth="1" />
          <path d="M 50 14 Q 40 18 36 12 Q 44 8 50 14" fill="#15803d" stroke="#14532d" strokeWidth="1" />
          {/* Orange body */}
          <circle cx="50" cy="54" r="30" fill="url(#orangeGrad)" stroke="#7c2d12" strokeWidth="2.5" />
          {/* Small dot details for texture */}
          <circle cx="42" cy="40" r="1" fill="#7c2d12" opacity="0.5" />
          <circle cx="60" cy="46" r="1.2" fill="#7c2d12" opacity="0.5" />
          <circle cx="36" cy="62" r="0.8" fill="#7c2d12" opacity="0.5" />
          <circle cx="54" cy="72" r="1" fill="#7c2d12" opacity="0.5" />
          <circle cx="64" cy="64" r="1.1" fill="#7c2d12" opacity="0.5" />
          {/* Highlight */}
          <path d="M 34 38 A 20 20 0 0 1 66 38" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
        </svg>
      );

    case 'grape':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]`}>
          <defs>
            <linearGradient id="grapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="60%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
          </defs>
          {/* Stem */}
          <path d="M 50 26 Q 52 14 62 10 Q 56 12 50 20 L 50 26" fill="none" stroke="#15803d" strokeWidth="3.5" strokeLinecap="round" />
          {/* Layer 1 - Grapes Cluster */}
          {/* Row 1 (top) */}
          <circle cx="36" cy="34" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          <circle cx="50" cy="34" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          <circle cx="64" cy="34" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          {/* Row 2 */}
          <circle cx="43" cy="50" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          <circle cx="57" cy="50" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          <circle cx="29" cy="46" r="10" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          <circle cx="71" cy="46" r="10" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          {/* Row 3 */}
          <circle cx="36" cy="64" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          <circle cx="50" cy="64" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          <circle cx="64" cy="64" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          {/* Row 4 */}
          <circle cx="43" cy="78" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          <circle cx="57" cy="78" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          {/* Bottom grape */}
          <circle cx="50" cy="90" r="11" fill="url(#grapeGrad)" stroke="#4c1d95" strokeWidth="1.5" />
          {/* Simple highlights */}
          <circle cx="48" cy="86" r="2.5" fill="#ffffff" opacity="0.5" />
          <circle cx="41" cy="74" r="2.5" fill="#ffffff" opacity="0.5" />
          <circle cx="47" cy="60" r="2.5" fill="#ffffff" opacity="0.5" />
          <circle cx="47" cy="30" r="2.5" fill="#ffffff" opacity="0.5" />
        </svg>
      );

    case 'bell':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]`}>
          <defs>
            <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* Hanger loop */}
          <circle cx="50" cy="20" r="10" fill="none" stroke="#d97706" strokeWidth="4.5" />
          {/* Bell clapper (bottom hammer) */}
          <circle cx="50" cy="80" r="8" fill="#78350f" stroke="#d97706" strokeWidth="2.5" />
          {/* Bell body */}
          <path
            d="M 50 24 C 34 24, 26 44, 24 64 C 24 72, 34 76, 50 76 C 66 76, 76 72, 76 64 C 74 44, 66 24, 50 24 Z"
            fill="url(#bellGrad)"
            stroke="#78350f"
            strokeWidth="3.5"
          />
          {/* Flared rim at bottom */}
          <path d="M 20 68 Q 50 74 80 68" fill="none" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
          {/* Highlight shine */}
          <path d="M 40 32 C 34 38, 32 50, 32 60" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.45" strokeLinecap="round" />
        </svg>
      );

    case 'diamond':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]`}>
          <defs>
            <linearGradient id="diamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ecfeff" />
              <stop offset="40%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          {/* Outer diamond border */}
          <polygon points="50,90 84,40 68,16 32,16 16,40" fill="url(#diamGrad)" stroke="#0e7490" strokeWidth="3.5" />
          {/* Inner facet lines */}
          <line x1="32" y1="16" x2="38" y2="40" stroke="#0e7490" strokeWidth="2" />
          <line x1="68" y1="16" x2="62" y2="40" stroke="#0e7490" strokeWidth="2" />
          <line x1="16" y1="40" x2="84" y2="40" stroke="#0e7490" strokeWidth="2" />
          <line x1="38" y1="40" x2="50" y2="90" stroke="#0e7490" strokeWidth="2" />
          <line x1="62" y1="40" x2="50" y2="90" stroke="#0e7490" strokeWidth="2" />
          <line x1="32" y1="16" x2="68" y2="16" stroke="#0e7490" strokeWidth="1.5" />
          <line x1="38" y1="40" x2="62" y2="40" stroke="#0e7490" strokeWidth="1.5" />
          {/* Glow reflection */}
          <polygon points="32,16 50,16 38,40 16,40" fill="#ffffff" opacity="0.35" />
        </svg>
      );

    case 'seven':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]`}>
          <defs>
            <linearGradient id="sevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          {/* Border shield */}
          <rect x="18" y="14" width="64" height="72" rx="14" fill="#0b0f19" stroke="url(#rimGrad)" strokeWidth="3" />
          {/* The Number '7' Shape */}
          <path
            d="M 28 26 L 70 26 L 70 34 L 44 76 L 32 76 L 56 38 L 28 38 Z"
            fill="url(#sevGrad)"
            stroke="#451a03"
            strokeWidth="1.5"
            strokeLinejoin="miter"
          />
          {/* Center glow bar */}
          <path d="M 40 44 L 56 44" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
        </svg>
      );

    case 'skull':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]`}>
          <defs>
            <linearGradient id="skullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="60%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          {/* Crossbones */}
          <path d="M 20 24 Q 50 50 80 76 M 80 24 Q 50 50 20 76" stroke="#475569" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
          <circle cx="20" cy="24" r="6" fill="#475569" opacity="0.6" />
          <circle cx="80" cy="76" r="6" fill="#475569" opacity="0.6" />
          <circle cx="80" cy="24" r="6" fill="#475569" opacity="0.6" />
          <circle cx="20" cy="76" r="6" fill="#475569" opacity="0.6" />
          {/* Skull head */}
          <path
            d="M 32 46 C 32 30, 68 30, 68 46 C 68 56, 62 62, 60 62 L 60 74 C 60 78, 40 78, 40 74 L 40 62 C 38 62, 32 56, 32 46 Z"
            fill="url(#skullGrad)"
            stroke="#450a0a"
            strokeWidth="3.5"
          />
          {/* Eye sockets */}
          <circle cx="43" cy="46" r="5" fill="#000000" />
          <circle cx="57" cy="46" r="5" fill="#000000" />
          {/* Nose cavity */}
          <polygon points="50,52 47,58 53,58" fill="#000000" />
          {/* Teeth slits */}
          <line x1="46" y1="68" x2="46" y2="74" stroke="#450a0a" strokeWidth="2" />
          <line x1="50" y1="68" x2="50" y2="74" stroke="#450a0a" strokeWidth="2" />
          <line x1="54" y1="68" x2="54" y2="74" stroke="#450a0a" strokeWidth="2" />
        </svg>
      );

    case 'coin':
      return (
        <svg viewBox="0 0 100 100" className={`${className} filter drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]`}>
          <defs>
            <linearGradient id="goldCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Outer Coin Circle */}
          <circle cx="50" cy="50" r="38" fill="url(#goldCoinGrad)" stroke="#fef08a" strokeWidth="3" />
          {/* Inner Ridges circle */}
          <circle cx="50" cy="50" r="30" fill="none" stroke="#854d0e" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
          {/* Dollar / Credit Symbol */}
          <text
            x="50"
            y="61"
            fontSize="32"
            fontWeight="950"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            fill="#713f12"
            opacity="0.9"
          >
            $
          </text>
          {/* Shiny overlay highlight */}
          <path d="M 16 35 C 24 20, 48 16, 74 24" fill="none" stroke="url(#goldHighlight)" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
}
