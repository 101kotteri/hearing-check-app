// Ported verbatim from design/HearingCheck.dc.html — see memory file
// hearing-check-standalone-app.md for the tuning history behind these numbers.

export const HEARING_FREQS = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 10000] as const;
export const HEARING_TEST_ORDER = [1000, 2000, 4000, 8000, 10000, 500, 250, 125, 63] as const;

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
