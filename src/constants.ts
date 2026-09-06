// Ported verbatim from design/HearingCheck.dc.html — see memory file
// hearing-check-standalone-app.md for the tuning history behind these numbers.

export const HEARING_FREQS = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 10000] as const;
export const HEARING_TEST_ORDER = [1000, 2000, 4000, 8000, 10000, 500, 250, 125, 63] as const;

// Pricing tiers, per explicit direction — designed from day one (not a
// free-then-paywalled bait-and-switch): free covers a real but reduced
// low/mid/high check; Plan A adds four more points; Plan B adds the
// remaining two plus PDF/image export. "Plan B-A" is the discounted
// upgrade path offered only to existing Plan A owners, covering exactly
// what A doesn't already have (not full Plan B priced again). Actual
// payment (StoreKit) isn't wired up yet — `plan` is currently just app
// state, settable via `?plan=a`/`?plan=b` or the mock purchase buttons —
// but the frequency gating and locked-state UI are real from this point on.
export type Plan = 'none' | 'A' | 'B';

const PLAN_FREE_FREQS = [250, 1000, 4000];
const PLAN_A_EXTRA_FREQS = [125, 500, 2000, 8000];
const PLAN_B_EXTRA_FREQS = [63, 10000];

export function unlockedFrequencies(plan: Plan): number[] {
  const freqs: number[] = [...PLAN_FREE_FREQS];
  if (plan === 'A' || plan === 'B') freqs.push(...PLAN_A_EXTRA_FREQS);
  if (plan === 'B') freqs.push(...PLAN_B_EXTRA_FREQS);
  return freqs;
}

// The actual test order (HEARING_TEST_ORDER's own low/high alternating
// sequence), filtered down to only this plan's unlocked frequencies —
// this is what actually drives how many points get measured.
export function testOrderForPlan(plan: Plan): number[] {
  const unlocked = unlockedFrequencies(plan);
  return HEARING_TEST_ORDER.filter((f) => unlocked.includes(f));
}

// PDF/image export is a Plan B feature (per explicit direction).
export function canExportReport(plan: Plan): boolean {
  return plan === 'B';
}

// Pricing tiers apply only to the mobile/tablet app (what actually ships on
// the App Store) — per explicit direction, the plain desktop/PC chassis is
// for internal company distribution and stays fully unlocked regardless of
// `plan`. Both app.ts (the measurement loop) and viewModel.ts (graph locks,
// export gating, upsell UI) run everything through this instead of reading
// state.plan directly, so "PC always full" can't drift out of sync between
// the two.
export function effectivePlan(state: { isMobile: boolean; isTablet: boolean; plan: Plan }): Plan {
  return state.isMobile || state.isTablet ? state.plan : 'B';
}

// StoreKit product identifiers — must match the products configured both in
// ios/App/App/Products.storekit (local Simulator/Xcode testing) and, later,
// in App Store Connect's real in-app purchase records. UPGRADE_B is the
// discounted Plan A -> B delta purchase, only ever offered to existing Plan
// A owners (see renderPlanUpsell).
export const STORE_PRODUCT_ID_A = 'com.hearingcheck.app.planA';
export const STORE_PRODUCT_ID_B = 'com.hearingcheck.app.planB';
export const STORE_PRODUCT_ID_UPGRADE_B = 'com.hearingcheck.app.upgradeB';

// Derives the effective plan from StoreKit's own list of owned (verified,
// current-entitlement) product IDs — this is the source of truth on native,
// checked at every launch via StoreKitPurchase.getEntitlements(), rather
// than trusting any client-side flag to persist across reinstalls/devices.
// Owning planB outright, or owning planA + the upgrade delta, both count as
// full Plan B; owning only the upgrade (not normally reachable through the
// UI, which only offers it to Plan A owners) is treated as no plan at all
// rather than silently granting B for free.
export function planFromEntitlements(ownedProductIds: string[]): Plan {
  const owns = (id: string) => ownedProductIds.includes(id);
  if (owns(STORE_PRODUCT_ID_B)) return 'B';
  if (owns(STORE_PRODUCT_ID_A)) return owns(STORE_PRODUCT_ID_UPGRADE_B) ? 'B' : 'A';
  return 'none';
}

export const HEARING_STEP_BIG = 10;
export const HEARING_STEP_SMALL = 5;
export const HEARING_FLOOR_DB = -60;
export const HEARING_CEILING_DB = 20;
export const HEARING_CONFIRMATIONS_NEEDED = 2;
export const HEARING_MAX_TRIALS_PER_FREQ = 16;
export const HEARING_REF_GAIN = 0.16;
export const HEARING_PULSE_ON_MS = 150;
export const HEARING_PULSE_GAP_MS = 200;
export const HEARING_MAX_RESPONSE_MS = 4000;
export const HEARING_GAP_MIN_MS = 900;
export const HEARING_GAP_MAX_MS = 1700;

export const HEARING_FREQ_OFFSET_DB: Record<number, number> = {
  63: 22,
  125: 12,
  250: 5,
  500: 1,
  1000: 0,
  2000: -2,
  4000: -6,
  8000: 8,
  10000: 8,
};

// Device-type output offset (earphone sits closer to the ear canal than headphones).
export const HEARING_EARPHONE_OFFSET_DB = -6;

export const GATE_PASSWORD = 'HEARINGCHECK';
