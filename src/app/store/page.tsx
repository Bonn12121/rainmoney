'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerJackpotConfetti } from '@/utils/confetti';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Coins, Check, ShieldCheck, ShoppingCart, CheckCircle, Sparkles } from 'lucide-react';

interface Pack {
  id: string;
  name: string;
  credits: number;
  priceUSD: number;
  bonus: string;
  popular: boolean;
  color: string;
  features: string[];
}

const PACKS: Pack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    priceUSD: 100,
    bonus: 'Standard',
    popular: false,
    color: 'border-luxury-border',
    features: ['$100 Virtual USD ($)', 'Bronze Membership Badge', 'Instant Balance Upgrade', '100% Virtual Asset'],
  },
  {
    id: 'silver',
    name: 'Silver Pack',
    credits: 500,
    priceUSD: 500,
    bonus: 'VIP Access',
    popular: false,
    color: 'border-luxury-border',
    features: ['$500 Virtual USD ($)', 'Silver Membership Badge', 'Instant Balance Upgrade', 'VIP Support Access'],
  },
  {
    id: 'gold',
    name: 'Gold Pack',
    credits: 1200,
    priceUSD: 1200,
    bonus: '20% Extra USD ($)',
    popular: true,
    color: 'gold-border-glow',
    features: ['$1,200 Virtual USD ($)', 'Gold Membership Badge', 'Instant Balance Upgrade', 'Gold Chat Glow', '$200 Bonus USD Included'],
  },
  {
    id: 'diamond',
    name: 'Diamond Pack',
    credits: 3000,
    priceUSD: 3000,
    bonus: '50% Extra USD ($)',
    popular: false,
    color: 'border-luxury-border hover:border-gold-500/35',
    features: ['$3,000 Virtual USD ($)', 'VIP Black Card Badge', 'Instant Balance Upgrade', 'Premium Lounge Access', '$1,000 Bonus USD Included'],
  },
];

export default function Store() {
  const { addCredits } = useGameState();
  const { playWin } = useAudio();
  const [purchasedPack, setPurchasedPack] = useState<{ name: string; credits: number; priceUSD: number } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(500);

  const handleBuy = (pack: { id: string; name: string; credits: number; priceUSD: number }) => {
    setCheckoutLoading(pack.id);
    // Simulate premium banking verification delay
    setTimeout(() => {
      addCredits(pack.credits);
      playWin();
      triggerJackpotConfetti();
      setPurchasedPack({ name: pack.name, credits: pack.credits, priceUSD: pack.priceUSD });
      setCheckoutLoading(null);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10 flex-grow relative">
      
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
        <span className="text-[10px] tracking-widest font-extrabold text-gold-500 uppercase">Virtual Exchange</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight">
          Acquire <span className="gold-gradient-text">Virtual USD ($)</span>
        </h1>
        <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
          Fictional USD ($) is strictly a virtual currency used for gameplay and design testing. 
          Acquire a custom quantity below or select one of our quick checkout packs.
        </p>
      </div>

      {/* Custom Amount Acquisition Panel */}
      <div className="max-w-3xl mx-auto w-full">
        <Card glow className="bg-luxury-surface/90 border-gold-500/20">
          <CardHeader className="p-6 border-b-0 pb-3">
            <span className="text-[10px] tracking-widest font-extrabold text-gold-500 uppercase flex items-center gap-1.5 leading-none">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              Custom Amount Acquisition
            </span>
            <CardTitle className="text-xl font-bold text-white mt-1">Acquire Custom USD</CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Type the exact quantity of virtual USD you need. Fictional conversion: 1 USD Real = 1 USD Virtual.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow flex flex-col gap-2 w-full">
              <span className="text-xs font-bold text-neutral-500">Virtual USD to Acquire ($)</span>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xs text-neutral-500 font-bold uppercase select-none">
                  $
                </span>
                <input
                  type="number"
                  min="10"
                  max="1000000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  disabled={checkoutLoading !== null}
                  className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-4 py-3.5 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
            
            <div className="w-full md:w-56 flex flex-col gap-2">
              <span className="text-xs font-bold text-neutral-500">USD Price (Demo)</span>
              <div className="bg-black border border-luxury-border rounded-xl px-4 py-3.5 font-bold text-sm text-neutral-300 select-none">
                ${customAmount.toLocaleString()} USD
              </div>
            </div>

            <Button
              variant="gold"
              onClick={() => handleBuy({ id: 'custom', name: 'Custom Amount', credits: customAmount, priceUSD: customAmount })}
              disabled={checkoutLoading !== null || customAmount <= 0}
              className="w-full md:w-auto h-[48px] px-8"
            >
              {checkoutLoading === 'custom' ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border border-black/20 border-t-black rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 justify-center whitespace-nowrap">
                  <ShoppingCart className="w-4 h-4" />
                  Checkout Now
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <span className="text-[10px] tracking-widest font-extrabold text-neutral-500 uppercase">Or select a Quick Pack</span>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PACKS.map((pack) => (
          <Card 
            key={pack.id} 
            glow={pack.popular}
            className={`flex flex-col justify-between bg-luxury-surface/80 relative overflow-hidden transition-all duration-300 ${pack.color}`}
          >
            {pack.popular && (
              <div className="absolute top-0 right-0 bg-gold-500 text-black text-[9px] font-extrabold px-3 py-1 uppercase rounded-bl-xl tracking-wider shadow-md">
                RECOMMENDED
              </div>
            )}
            
            <div>
              <CardHeader className="p-6 pb-2 border-b-0">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{pack.bonus}</span>
                <CardTitle className="text-lg font-bold text-white mt-1">{pack.name}</CardTitle>
                
                {/* Large USD Count */}
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-black text-white">${pack.credits.toLocaleString()}</span>
                  <span className="text-xs text-gold-500 font-extrabold uppercase">Virtual USD</span>
                </div>
                
                {/* Price */}
                <div className="text-xs text-neutral-400 font-medium mt-1">
                  Exchange price: <span className="text-neutral-200 font-bold">${pack.priceUSD} USD</span> (Demo)
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2">
                <hr className="border-luxury-border/60 my-4" />
                <ul className="flex flex-col gap-2.5">
                  {pack.features.map((feat, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-neutral-400 font-medium leading-tight">
                      <Check className="w-3.5 h-3.5 text-gold-500 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </div>

            <CardFooter className="p-6 pt-0 border-t-0 bg-transparent">
              <Button
                variant={pack.popular ? 'gold' : 'dark'}
                fullWidth
                size="md"
                onClick={() => handleBuy(pack)}
                disabled={checkoutLoading !== null}
              >
                {/* Click buy triggers checkout delay */}
                {checkoutLoading === pack.id ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border border-black/20 border-t-black rounded-full animate-spin"></span>
                    Verifying payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 justify-center">
                    <ShoppingCart className="w-4 h-4" />
                    Buy Package
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Disclaimer details */}
      <Card className="bg-black/40 border-luxury-border/60">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-3.5 bg-gold-500/10 rounded-2xl border border-gold-500/20 text-gold-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">SECURE SANDBOX GUARANTEE</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-3xl leading-relaxed font-medium">
              RainMoney is a fully localized demonstration platform. Clicking any purchase package mimics a banking payment gateway, updating your wallet balance instantly. 
              No credit cards, bank accounts, or real funds are collected. Transactions are virtual and non-refundable.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Success Celebration Overlay Modal */}
      {purchasedPack && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <Card glow className="max-w-md w-full bg-luxury-surface border-gold-500/20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 gold-gradient-bg"></div>
            
            <CardContent className="p-8 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <div>
                <span className="text-[10px] tracking-widest font-extrabold text-gold-500 uppercase">TRANSACTION SUCCESSFUL</span>
                <h3 className="font-serif text-2xl font-black text-white mt-1">Package Delivered</h3>
                <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Your purchase of the <strong className="text-white">{purchasedPack.name}</strong> was verified.
                </p>
              </div>

              <div className="w-full bg-black border border-luxury-border rounded-xl p-4 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase leading-none">Delivered</span>
                  <span className="text-lg font-black text-white block mt-1.5">+${purchasedPack.credits.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase leading-none">Bill</span>
                  <span className="text-sm font-extrabold text-gold-500 block mt-1.5">${purchasedPack.priceUSD} USD</span>
                </div>
              </div>

              <Button
                variant="gold"
                fullWidth
                size="md"
                onClick={() => setPurchasedPack(null)}
                className="mt-2"
              >
                Return to Lobby
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
