import type { Badge } from '../types/badge'

/** Fallback catalog when DB seed unavailable (matches migration-collector-badges.sql). */
export const BADGE_CATALOG: Badge[] = [
  { id: 'first_can', name: 'First Can', description: 'Added your first can', category: 'collection', emoji: '🥫', tier: 'bronze', sort_order: 10, is_manual_only: false },
  { id: 'cans_10', name: '10 Cans', description: 'Collected 10 cans', category: 'collection', emoji: '📦', tier: 'bronze', sort_order: 20, is_manual_only: false },
  { id: 'cans_25', name: '25 Cans', description: 'Collected 25 cans', category: 'collection', emoji: '📦', tier: 'silver', sort_order: 30, is_manual_only: false },
  { id: 'cans_50', name: '50 Cans', description: 'Collected 50 cans', category: 'collection', emoji: '🗃️', tier: 'silver', sort_order: 40, is_manual_only: false },
  { id: 'cans_100', name: '100 Cans', description: 'Collected 100 cans', category: 'collection', emoji: '🏆', tier: 'gold', sort_order: 50, is_manual_only: false },
  { id: 'cans_250', name: '250 Cans', description: 'Collected 250 cans', category: 'collection', emoji: '💎', tier: 'gold', sort_order: 60, is_manual_only: false },
  { id: 'cans_500', name: '500 Cans', description: 'Collected 500 cans', category: 'collection', emoji: '👑', tier: 'platinum', sort_order: 70, is_manual_only: false },
  { id: 'ultra_collector', name: 'Ultra Collector', description: 'Strong Ultra set progress', category: 'set', emoji: '⚡', tier: 'gold', sort_order: 110, is_manual_only: false },
  { id: 'java_collector', name: 'Java Collector', description: 'Strong Java set progress', category: 'set', emoji: '☕', tier: 'gold', sort_order: 120, is_manual_only: false },
  { id: 'juice_collector', name: 'Juice Collector', description: 'Strong Juice set progress', category: 'set', emoji: '🍹', tier: 'gold', sort_order: 130, is_manual_only: false },
  { id: 'rehab_collector', name: 'Rehab Collector', description: 'Strong Rehab set progress', category: 'set', emoji: '🍵', tier: 'gold', sort_order: 140, is_manual_only: false },
  { id: 'reserve_collector', name: 'Reserve Collector', description: 'Strong Reserve set progress', category: 'set', emoji: '🎖️', tier: 'gold', sort_order: 150, is_manual_only: false },
  { id: 'nitro_collector', name: 'Nitro Collector', description: 'Strong Nitro set progress', category: 'set', emoji: '💨', tier: 'gold', sort_order: 160, is_manual_only: false },
  { id: 'zero_sugar_collector', name: 'Zero Sugar Collector', description: 'Strong Zero Sugar set progress', category: 'set', emoji: '🍬', tier: 'gold', sort_order: 170, is_manual_only: false },
  { id: 'first_trade_listing', name: 'First Trade Listing', description: 'First trade listing posted', category: 'trade', emoji: '🤝', tier: 'bronze', sort_order: 210, is_manual_only: false },
  { id: 'trade_ready', name: 'Trade Ready', description: 'Cans marked for trade', category: 'trade', emoji: '🔄', tier: 'silver', sort_order: 220, is_manual_only: false },
  { id: 'active_trader', name: 'Active Trader', description: 'Multiple active listings', category: 'trade', emoji: '⚖️', tier: 'gold', sort_order: 230, is_manual_only: false },
  { id: 'barcode_helper', name: 'Barcode Helper', description: 'Linked barcodes to master catalog', category: 'community', emoji: '📊', tier: 'silver', sort_order: 310, is_manual_only: false },
  { id: 'image_contributor', name: 'Image Contributor', description: 'Contributed catalog images', category: 'community', emoji: '📸', tier: 'silver', sort_order: 320, is_manual_only: false },
  { id: 'master_db_contributor', name: 'Master DB Contributor', description: 'Approved master DB contribution', category: 'community', emoji: '🗄️', tier: 'gold', sort_order: 330, is_manual_only: false },
  { id: 'feedback_helper', name: 'Feedback Helper', description: 'Submitted CanTrove feedback', category: 'community', emoji: '💬', tier: 'bronze', sort_order: 340, is_manual_only: false },
  { id: 'beta_tester', name: 'Beta Tester', description: 'Early beta tester', category: 'special', emoji: '🧪', tier: 'special', sort_order: 410, is_manual_only: true },
  { id: 'founder', name: 'Founder', description: 'CanTrove founder', category: 'special', emoji: '👑', tier: 'special', sort_order: 420, is_manual_only: true },
  { id: 'community_contributor', name: 'Community Contributor', description: 'Outstanding contributor', category: 'special', emoji: '⭐', tier: 'special', sort_order: 430, is_manual_only: true },
]

export const BADGE_BY_ID = new Map(BADGE_CATALOG.map((b) => [b.id, b]))
