export interface SlotSymbol {
  name: string;
  char: string;
  multiplier3: number;
  multiplier4: number;
  multiplier5: number;
  isWild?: boolean;
  colorClass?: string;
  iconKey?:
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
}

export interface SlotTheme {
  id: string;
  name: string;
  description: string;
  primaryColor: string; // Tailwind hex or class color
  accentColor: string;
  bgGradient: string; // Full CSS or Tailwind gradient class
  themeColorGlow: string; // Glow color for shadows
  symbols: SlotSymbol[];
}

export const slotThemes: Record<string, SlotTheme> = {
  'slots-neon': {
    id: 'slots-neon',
    name: 'Neon Fruits Slots',
    description: 'Spin glowing classic fruit reels for retro neon payouts.',
    primaryColor: '#10b981',
    accentColor: '#3b82f6',
    bgGradient: 'from-emerald-950/80 via-emerald-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(16, 185, 129, 0.4)',
    symbols: [
      { name: 'Wild Star', char: '⭐', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-amber-400', iconKey: 'sparkles' },
      { name: 'Cherry', char: '🍒', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-rose-500', iconKey: 'cherry' },
      { name: 'Lemon', char: '🍋', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-yellow-400', iconKey: 'lemon' },
      { name: 'Orange', char: '🍊', multiplier3: 2.5, multiplier4: 5, multiplier5: 15, colorClass: 'text-orange-400', iconKey: 'orange' },
      { name: 'Grape', char: '🍇', multiplier3: 3.5, multiplier4: 8, multiplier5: 25, colorClass: 'text-purple-400', iconKey: 'grape' },
      { name: 'Bell', char: '🔔', multiplier3: 5, multiplier4: 12, multiplier5: 50, colorClass: 'text-yellow-300', iconKey: 'bell' },
      { name: 'Diamond', char: '💎', multiplier3: 10, multiplier4: 25, multiplier5: 150, colorClass: 'text-cyan-400', iconKey: 'diamond' },
      { name: 'Lucky 7', char: '🎰', multiplier3: 25, multiplier4: 75, multiplier5: 500, colorClass: 'text-red-500 animate-pulse', iconKey: 'seven' }
    ]
  },
  'slots-egypt': {
    id: 'slots-egypt',
    name: 'Pharaoh\'s Gold Slots',
    description: 'Uncover ancient treasures along Egyptian paylines.',
    primaryColor: '#ca8a04',
    accentColor: '#facc15',
    bgGradient: 'from-amber-950/80 via-amber-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(202, 138, 4, 0.4)',
    symbols: [
      { name: 'Scarabeus Wild', char: '🪲', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-teal-400', iconKey: 'sparkles' },
      { name: 'Lotus', char: '🪷', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-pink-400', iconKey: 'cherry' },
      { name: 'Papyrus', char: '📜', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-amber-200', iconKey: 'paper' },
      { name: 'Eye of Horus', char: '👁️', multiplier3: 3, multiplier4: 6, multiplier5: 20, colorClass: 'text-sky-400', iconKey: 'diamond' },
      { name: 'Ankh', char: '☥', multiplier3: 4, multiplier4: 10, multiplier5: 35, colorClass: 'text-yellow-400', iconKey: 'bell' },
      { name: 'Sarcophagus', char: '⚰️', multiplier3: 6, multiplier4: 15, multiplier5: 65, colorClass: 'text-yellow-600', iconKey: 'rock' },
      { name: 'Pyramid', char: '🔺', multiplier3: 12, multiplier4: 35, multiplier5: 200, colorClass: 'text-red-400', iconKey: 'seven' },
      { name: 'Pharaoh', char: '👑', multiplier3: 30, multiplier4: 100, multiplier5: 800, colorClass: 'text-yellow-500 font-extrabold drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]', iconKey: 'coin' }
    ]
  },
  'slots-sweet': {
    id: 'slots-sweet',
    name: 'Sweet Candy Reels',
    description: 'Spin delicious candy treats for colorful multipliers.',
    primaryColor: '#ec4899',
    accentColor: '#f43f5e',
    bgGradient: 'from-pink-950/80 via-pink-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(236, 72, 153, 0.4)',
    symbols: [
      { name: 'Lollipop Wild', char: '🍭', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-pink-500', iconKey: 'balloon' },
      { name: 'Candy Cane', char: '🍬', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-red-400', iconKey: 'cherry' },
      { name: 'Gummy Bear', char: '🧸', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-orange-400', iconKey: 'orange' },
      { name: 'Jelly Bean', char: '🫘', multiplier3: 2.5, multiplier4: 5, multiplier5: 15, colorClass: 'text-purple-400', iconKey: 'grape' },
      { name: 'Doughnut', char: '🍩', multiplier3: 4, multiplier4: 10, multiplier5: 30, colorClass: 'text-amber-500', iconKey: 'bell' },
      { name: 'Cupcake', char: '🧁', multiplier3: 6, multiplier4: 20, multiplier5: 75, colorClass: 'text-pink-300', iconKey: 'seven' },
      { name: 'Chocolate', char: '🍫', multiplier3: 15, multiplier4: 50, multiplier5: 300, colorClass: 'text-amber-800', iconKey: 'rock' }
    ]
  },
  'slots-pirate': {
    id: 'slots-pirate',
    name: 'Pirate\'s Bounty Slots',
    description: 'Search for hidden ocean chests on the pirate reels.',
    primaryColor: '#f97316',
    accentColor: '#ea580c',
    bgGradient: 'from-orange-950/80 via-orange-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(249, 115, 22, 0.4)',
    symbols: [
      { name: 'Pirate Flag Wild', char: '🏴‍☠️', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-white', iconKey: 'skull' },
      { name: 'Rum Bottle', char: '🧪', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-emerald-500', iconKey: 'balloon' },
      { name: 'Anchor', char: '⚓', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-slate-400', iconKey: 'rock' },
      { name: 'Spyglass', char: '🔭', multiplier3: 3, multiplier4: 6, multiplier5: 20, colorClass: 'text-amber-600', iconKey: 'bell' },
      { name: 'Pirate Hook', char: '🪝', multiplier3: 4, multiplier4: 10, multiplier5: 35, colorClass: 'text-zinc-300', iconKey: 'scissors' },
      { name: 'Parrot', char: '🦜', multiplier3: 8, multiplier4: 25, multiplier5: 100, colorClass: 'text-emerald-400', iconKey: 'cherry' },
      { name: 'Treasure Chest', char: '🪙', multiplier3: 20, multiplier4: 60, multiplier5: 450, colorClass: 'text-yellow-400 animate-bounce', iconKey: 'coin' }
    ]
  },
  'slots-zeus': {
    id: 'slots-zeus',
    name: 'Zeus Olympus Slots',
    description: 'Harness the thunder god\'s lightning for epic payouts.',
    primaryColor: '#a855f7',
    accentColor: '#c084fc',
    bgGradient: 'from-violet-950/80 via-violet-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(168, 85, 247, 0.4)',
    symbols: [
      { name: 'Lightning Wild', char: '⚡', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]', iconKey: 'sparkles' },
      { name: 'Shield', char: '🛡️', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-amber-500', iconKey: 'rock' },
      { name: 'Helmet', char: '🪖', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-amber-600', iconKey: 'bell' },
      { name: 'Goblet', char: '🍷', multiplier3: 3, multiplier4: 6, multiplier5: 20, colorClass: 'text-red-500', iconKey: 'orange' },
      { name: 'Harpie Eagle', char: '🦅', multiplier3: 5, multiplier4: 12, multiplier5: 50, colorClass: 'text-neutral-300', iconKey: 'cherry' },
      { name: 'Acropolis Temple', char: '🏛️', multiplier3: 8, multiplier4: 20, multiplier5: 85, colorClass: 'text-indigo-300', iconKey: 'seven' },
      { name: 'Zeus God', char: '🧔', multiplier3: 25, multiplier4: 85, multiplier5: 650, colorClass: 'text-cyan-300 font-extrabold', iconKey: 'coin' }
    ]
  },
  'slots-cyber': {
    id: 'slots-cyber',
    name: 'Cyberpunk Reels',
    description: 'Hack into the neon synthwave grid for cyber wins.',
    primaryColor: '#a855f7',
    accentColor: '#ec4899',
    bgGradient: 'from-purple-950/80 via-purple-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(168, 85, 247, 0.4)',
    symbols: [
      { name: 'Floppy Wild', char: '💿', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-pink-400', iconKey: 'balloon' },
      { name: 'Cyber Goggles', char: '🥽', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-cyan-400', iconKey: 'scissors' },
      { name: 'Laser Gun', char: '🔫', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-green-400', iconKey: 'rock' },
      { name: 'Memory Module', char: '💾', multiplier3: 3, multiplier4: 6, multiplier5: 20, colorClass: 'text-purple-400', iconKey: 'seven' },
      { name: 'Cybernetic Arm', char: '🦾', multiplier3: 5, multiplier4: 12, multiplier5: 50, colorClass: 'text-slate-400', iconKey: 'paper' },
      { name: 'Biohazard Core', char: '☣️', multiplier3: 8, multiplier4: 20, multiplier5: 100, colorClass: 'text-orange-500', iconKey: 'orange' },
      { name: 'Android Head', char: '🤖', multiplier3: 20, multiplier4: 70, multiplier5: 500, colorClass: 'text-emerald-400 font-bold', iconKey: 'skull' }
    ]
  },
  'slots-safari': {
    id: 'slots-safari',
    name: 'Safari Wilds Slots',
    description: 'Spot exotic wild beasts in the African savanna slots.',
    primaryColor: '#84cc16',
    accentColor: '#65a30d',
    bgGradient: 'from-lime-950/80 via-lime-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(132, 204, 22, 0.4)',
    symbols: [
      { name: 'Paw Print Wild', char: '🐾', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-amber-700', iconKey: 'sparkles' },
      { name: 'Safari Compass', char: '🧭', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-red-500', iconKey: 'coin' },
      { name: 'Savanna Zebra', char: '🦓', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-white', iconKey: 'paper' },
      { name: 'Jungle Giraffe', char: '🦒', multiplier3: 3, multiplier4: 6, multiplier5: 20, colorClass: 'text-yellow-500', iconKey: 'orange' },
      { name: 'Cheetah', char: '🐆', multiplier3: 5, multiplier4: 12, multiplier5: 50, colorClass: 'text-amber-500', iconKey: 'lemon' },
      { name: 'Savanna Elephant', char: '🐘', multiplier3: 8, multiplier4: 20, multiplier5: 100, colorClass: 'text-sky-300', iconKey: 'rock' },
      { name: 'King Lion', char: '🦁', multiplier3: 25, multiplier4: 80, multiplier5: 600, colorClass: 'text-amber-400 font-extrabold', iconKey: 'seven' }
    ]
  },
  'slots-dragon': {
    id: 'slots-dragon',
    name: 'Dragon\'s Fortune Slots',
    description: 'Spin the imperial Chinese dragons for ancient fortune.',
    primaryColor: '#dc2626',
    accentColor: '#facc15',
    bgGradient: 'from-red-950/80 via-red-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(220, 38, 38, 0.4)',
    symbols: [
      { name: 'Lantern Wild', char: '🏮', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]', iconKey: 'orange' },
      { name: 'Chinese Fan', char: '🪭', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-pink-600', iconKey: 'paper' },
      { name: 'Firecracker', char: '🧨', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-red-400', iconKey: 'cherry' },
      { name: 'Gold Coin', char: '🪙', multiplier3: 3.5, multiplier4: 8, multiplier5: 25, colorClass: 'text-yellow-400', iconKey: 'coin' },
      { name: 'Pagoda Temple', char: '🏯', multiplier3: 5, multiplier4: 15, multiplier5: 60, colorClass: 'text-amber-700', iconKey: 'seven' },
      { name: 'Golden Phoenix', char: '🦚', multiplier3: 10, multiplier4: 30, multiplier5: 150, colorClass: 'text-emerald-400', iconKey: 'sparkles' },
      { name: 'Golden Dragon', char: '🐲', multiplier3: 30, multiplier4: 100, multiplier5: 800, colorClass: 'text-yellow-500 font-extrabold animate-pulse', iconKey: 'skull' }
    ]
  },
  'slots-irish': {
    id: 'slots-irish',
    name: 'Leprechaun Gold Slots',
    description: 'Find the pot of gold at the end of the clover reels.',
    primaryColor: '#22c55e',
    accentColor: '#16a34a',
    bgGradient: 'from-green-950/80 via-green-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(34, 197, 94, 0.4)',
    symbols: [
      { name: 'Rainbow Wild', char: '🌈', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-rose-500 font-black', iconKey: 'sparkles' },
      { name: 'Pint of Stout', char: '🍺', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-amber-500', iconKey: 'orange' },
      { name: 'Wood Pipe', char: '🪵', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-amber-800', iconKey: 'rock' },
      { name: 'Golden Horseshoe', char: '🧲', multiplier3: 3, multiplier4: 6, multiplier5: 20, colorClass: 'text-zinc-300', iconKey: 'bell' },
      { name: 'Leprechaun Hat', char: '🎩', multiplier3: 5, multiplier4: 12, multiplier5: 50, colorClass: 'text-emerald-500', iconKey: 'clover' },
      { name: 'Four-Leaf Clover', char: '🍀', multiplier3: 10, multiplier4: 30, multiplier5: 160, colorClass: 'text-green-400', iconKey: 'clover' },
      { name: 'Pot of Gold', char: '🍯', multiplier3: 30, multiplier4: 100, multiplier5: 800, colorClass: 'text-yellow-400 font-bold', iconKey: 'coin' }
    ]
  },
  'slots-undersea': {
    id: 'slots-undersea',
    name: 'Undersea Riches',
    description: 'Dive deep into ocean reefs to uncover lost treasures.',
    primaryColor: '#0ea5e9',
    accentColor: '#0284c7',
    bgGradient: 'from-sky-950/80 via-sky-900/40 to-[#0c0f1c]',
    themeColorGlow: 'rgba(14, 165, 233, 0.4)',
    symbols: [
      { name: 'Trident Wild', char: '🔱', multiplier3: 0, multiplier4: 0, multiplier5: 0, isWild: true, colorClass: 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.7)]', iconKey: 'scissors' },
      { name: 'Sea Shell', char: '🐚', multiplier3: 1.5, multiplier4: 3, multiplier5: 8, colorClass: 'text-rose-200', iconKey: 'cherry' },
      { name: 'Tropical Fish', char: '🐟', multiplier3: 2, multiplier4: 4, multiplier5: 12, colorClass: 'text-orange-400', iconKey: 'orange' },
      { name: 'Ocean Starfish', char: '⭐', multiplier3: 3, multiplier4: 6, multiplier5: 20, colorClass: 'text-yellow-400', iconKey: 'sparkles' },
      { name: 'Kraken Octopus', char: '🐙', multiplier3: 5, multiplier4: 12, multiplier5: 50, colorClass: 'text-purple-400', iconKey: 'grape' },
      { name: 'Pearl Oyster', char: '🦪', multiplier3: 10, multiplier4: 30, multiplier5: 150, colorClass: 'text-sky-200', iconKey: 'diamond' },
      { name: 'Poseidon King', char: '👑', multiplier3: 30, multiplier4: 100, multiplier5: 800, colorClass: 'text-yellow-400 font-bold', iconKey: 'coin' }
    ]
  }
};
