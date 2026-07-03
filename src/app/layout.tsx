import type { Metadata } from 'next';
import { Playfair_Display, Montserrat } from 'next/font/google';
import './globals.css';
import { GameStateProvider } from '@/context/GameStateContext';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { NotificationOverlay } from '@/components/ui/NotificationOverlay';

const montserrat = Montserrat({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RainMoney | Premium Virtual-USD Gaming Platform',
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
      className={`${montserrat.variable} ${playfair.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-luxury-bg text-white selection:bg-blue-500/20 selection:text-blue-200 relative overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Animated background ambient glow orbs */}
        <div className="absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vw] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none -z-10 animate-float"></div>
        <div className="absolute top-[40%] right-[-10%] w-[35vw] h-[35vw] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        {/* Fine grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),rgba(255,255,255,0))] pointer-events-none -z-10"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-10"></div>

        <GameStateProvider>
          <div className="flex flex-col min-h-screen w-full">
            <Navigation />
            <div className="flex-grow flex flex-col min-w-0 md:pl-20 w-full">
              <main className="flex-grow flex flex-col relative z-10">
                {children}
              </main>
              <Footer />
            </div>
          </div>
          <NotificationOverlay />
        </GameStateProvider>
      </body>
    </html>
  );
}

