'use client';

import React from 'react';
import SlotsGame from '@/components/games/SlotsGame';
import { slotThemes } from '@/utils/slotThemes';

export default function SafariSlotsPage() {
  return <SlotsGame theme={slotThemes['slots-safari']} />;
}
