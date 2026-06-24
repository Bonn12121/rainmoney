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

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';
  
  const variants = {
    gold: 'gold-gradient-bg text-black shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 hover:brightness-110 font-bold',
    dark: 'bg-luxury-surface text-white border border-luxury-border hover:bg-luxury-surface-hover hover:border-luxury-border-active',
    outline: 'bg-transparent text-gold-500 border border-gold-500/30 hover:border-gold-500/60 hover:bg-gold-500/5',
    glass: 'bg-white/5 text-white backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20',
    danger: 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/30 hover:border-red-500/40',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs tracking-wider uppercase',
    md: 'px-5 py-2.5 text-sm tracking-wide',
    lg: 'px-7 py-3 text-base font-semibold tracking-wide',
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
