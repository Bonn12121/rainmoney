'use client';

import React from 'react';
import SlotsGame from '@/components/games/SlotsGame';
import { slotThemes } from '@/utils/slotThemes';

export default function NeonFruitsSlotsPage() {
  return <SlotsGame theme={slotThemes['slots-neon']} />;
}
