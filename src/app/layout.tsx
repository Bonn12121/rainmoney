import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { GameStateProvider } from '@/context/GameStateContext';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RainMoney | Premium Virtual-Credit Gaming Platform',
  description: 'A modern virtual-credit gaming platform featuring simple mini-games and a clean luxury user experience. Built for entertainment purposes only.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-luxury-bg text-white selection:bg-gold-500/20 selection:text-gold-200"
        suppressHydrationWarning
      >
        <GameStateProvider>
          <Navigation />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
        </GameStateProvider>
      </body>
    </html>
  );
}
