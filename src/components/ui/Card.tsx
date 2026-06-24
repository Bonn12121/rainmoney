'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  glass?: boolean;
}

export function Card({
  children,
  glow = false,
  glass = false,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl border transition-all duration-300';
  
  const borders = glow 
    ? 'gold-border-glow' 
    : 'border-luxury-border';
    
  const background = glass 
    ? 'glass-panel' 
    : 'bg-luxury-surface';

  return (
    <div
      className={`${baseStyles} ${borders} ${background} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 border-b border-luxury-border ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-bold text-white tracking-wide ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-neutral-400 mt-1 font-medium ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 border-t border-luxury-border bg-black/20 rounded-b-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}
