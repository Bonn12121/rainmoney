'use client';

import React from 'react';
import { useAudio } from '@/hooks/useAudio';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'dark' | 'outline' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'gold',
  size = 'md',
  fullWidth = false,
  className = '',
  onClick,
  ...props
}: ButtonProps) {
  const { playClick } = useAudio();

  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    if (onClick) onClick(e);
  };

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.96] hover:scale-[1.02] cursor-pointer tracking-wide';
  
  const variants = {
    gold: 'gold-gradient-bg text-amber-950 shadow-lg shadow-amber-500/15 hover:shadow-amber-500/30 hover:brightness-110 font-bold border border-amber-300/20',
    dark: 'bg-[#0f172a] text-white border border-slate-800 hover:bg-[#1e293b] hover:border-slate-700 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]',
    outline: 'bg-transparent text-blue-400 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    glass: 'bg-white/5 text-white backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]',
    danger: 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/30 hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-[10px] tracking-wider uppercase',
    md: 'px-4 py-2 text-xs tracking-wide',
    lg: 'px-6 py-2.5 text-sm font-semibold tracking-wide',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={handlePress}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
