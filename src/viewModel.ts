import {
  HEARING_CEILING_DB,
  HEARING_FLOOR_DB,
  HEARING_FREQS,
  HEARING_FREQ_OFFSET_DB,
  HEARING_TEST_ORDER,
} from './constants';
import type { AppState, Ear, HearResults } from './types';
import type { Locale } from './i18n';
import { translate } from './i18n';

export interface GraphPoint {
  freq: number;
  x: number;
  y: number;
  noResponse: boolean;
}

export interface GraphTick {
  x: number;
  label: string;
}

export interface DbTick {
  y: number;
  label: string;
}

export interface DeviceOption {
  id: string;
  label: string;
  active: boolean;
}

export interface ListeningOption {
  id: string;
  label: string;
  active: boolean;
}

export interface HearGraphData {
  graphTicks: GraphTick[];
  rightPoints: GraphPoint[];
  leftPoints: GraphPoint[];
  rightPath: string;
  leftPath: string;
}

export interface ViewModel {
  isGate: boolean;
  isTablet: boolean;
  locale: Locale;
  localeMenuOpen: boolean;
  // Bound convenience wrapper around i18n's translate(), pre-applied to this
  // render's locale — lets templates.ts/mobileTemplates.ts call vm.t(key)
  // without importing i18n or threading vm.locale through separately.
  t: (key: string, vars?: Record<string, string | number>) => string;
  isHearing: boolean;
  isHearIntro: boolean;
  isHearSetup: boolean;
  isHearCalibrate: boolean;
  isHearMeasure: boolean;
  isHearDone: boolean;
  hearShowStop: boolean;
  hearDeviceOptions: DeviceOption[];
  hearListeningOptions: ListeningOption[];
  hearMeasureStatus: string;
  hearCurrentFreqLabel: string;
  hearProgressPct: number;
  hearPlayingClass: string;
  hearCalPlayingClass: string;
  hearGraph: HearGraphData;
  hearRefLineY: number;
  hearDbTicks: DbTick[];
  hearIsPartial: boolean;
  hearReportDate: string;
  hearReportNameDisplay: string;
}

// Shared by both the on-screen results graph and the printed report, fixed to
// this exact range independent of how many frequencies were actually measured.
const HEAR_AXIS_MIN_FREQ = 63;
const HEAR_AXIS_MAX_FREQ = 16000;
const HEAR_GRAPH_W = 860;
const HEAR_GRAPH_H = 280;

function hearGraphX(freq: number, axisMinFreq: number, axisMaxFreq: number): number {
  const logMin = Math.log10(axisMinFreq);
  const logMax = Math.log10(axisMaxFreq);
  const span = logMax - logMin;
  return span > 0 ? ((Math.log10(freq) - logMin) / span) * HEAR_GRAPH_W : HEAR_GRAPH_W / 2;
}

function hearGraphY(db: number): number {
  const top = HEARING_FLOOR_DB;
  const bottom = HEARING_CEILING_DB;
  const span = bottom - top;
  return span > 0 ? ((db - top) / span) * HEAR_GRAPH_H : HEAR_GRAPH_H / 2;
}

function buildHearPoints(
  results: HearResults,
  ear: Ear,
  listeningScale: number,
  axisMinFreq: number,
  axisMaxFreq: number
): GraphPoint[] {
  const pts: GraphPoint[] = [];
  for (const f of HEARING_FREQS) {
    const r = results[ear][f];
    if (!r) continue;
    const offset = (HEARING_FREQ_OFFSET_DB[f] || 0) * listeningScale;
    const rawDb = r.noResponse ? HEARING_CEILING_DB : (r.threshold as number);
    const db = Math.max(HEARING_FLOOR_DB, Math.min(HEARING_CEILING_DB, rawDb - offset));
    pts.push({ freq: f, x: hearGraphX(f, axisMinFreq, axisMaxFreq), y: hearGraphY(db), noResponse: !!r.noResponse });
  }
  return pts;
}

function buildHearPath(pts: GraphPoint[]): string {
  return pts.length
    ? pts.map((p, i) => (i === 0 ? 'M ' : 'L ') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ')
    : '';
}

function buildHearGraphData(
  results: HearResults,
  listeningScale: number,
  axisMinFreq: number,
  axisMaxFreq: number
): HearGraphData {
  const graphTicks: GraphTick[] = HEARING_FREQS.map((f) => ({
    x: hearGraphX(f, axisMinFreq, axisMaxFreq),
    label: f >= 1000 ? f / 1000 + 'k' : String(f),
  }));
  const rightPoints = buildHearPoints(results, 'right', listeningScale, axisMinFreq, axisMaxFreq);
  const leftPoints = buildHearPoints(results, 'left', listeningScale, axisMinFreq, axisMaxFreq);
  return {
    graphTicks,
    rightPoints,
    leftPoints,
    rightPath: buildHearPath(rightPoints),
    leftPath: buildHearPath(leftPoints),
  };
}

export function computeViewModel(s: AppState): ViewModel {
  const t = (key: string, vars?: Record<string, string | number>) => translate(s.locale, key, vars);
  const hearRefLineY = hearGraphY(0);
  const hearDbTickValues: number[] = [];
  for (let db = HEARING_CEILING_DB; db >= HEARING_FLOOR_DB; db -= 10) hearDbTickValues.push(db);
  const hearDbTicks: DbTick[] = hearDbTickValues.map((db) => ({
    y: hearGraphY(db),
    label: (db > 0 ? '+' : '') + db,
  }));
  const listeningScale = s.hearListeningType === 'listening' ? 0.5 : 1;
  const hearGraph = buildHearGraphData(s.hearResults, listeningScale, HEAR_AXIS_MIN_FREQ, HEAR_AXIS_MAX_FREQ);

  const hearCurrentFreq = HEARING_TEST_ORDER[s.hearFreqPos] || 0;
  const hearCurrentFreqLabel = hearCurrentFreq >= 1000 ? hearCurrentFreq / 1000 + 'kHz' : hearCurrentFreq + 'Hz';
  const hearMeasureStatus = t('measure.status', {
    ear: t(s.hearEar === 'right' ? 'ear.right' : 'ear.left'),
    freq: hearCurrentFreqLabel,
  });
  const hearEarIndex = s.hearEar === 'right' ? 0 : 1;
  const hearProgressPct = ((hearEarIndex * HEARING_TEST_ORDER.length + s.hearFreqPos) / (HEARING_TEST_ORDER.length * 2)) * 100;

  const hearRecordedCount = Object.keys(s.hearResults.right).length + Object.keys(s.hearResults.left).length;
  const hearIsPartial = hearRecordedCount > 0 && hearRecordedCount < HEARING_TEST_ORDER.length * 2;

  const now = new Date();
  const hearReportDate =
    now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const hearReportNameDisplay = s.hearReportName.trim() ? s.hearReportName.trim() : t('done.nameEmpty');

  const hearDeviceOptions: DeviceOption[] = ['headphone', 'earphone'].map((id) => ({
    id,
    label: id === 'headphone' ? t('setup.deviceHeadphone') : t('setup.deviceEarphone'),
    active: s.hearDeviceType === id,
  }));
  const hearListeningOptions: ListeningOption[] = ['reference', 'listening'].map((id) => ({
    id,
    label: id === 'reference' ? t('setup.listeningReference') : t('setup.listeningType'),
    active: s.hearListeningType === id,
  }));

  return {
    isGate: s.screen === 'gate',
    isTablet: s.isTablet,
    locale: s.locale,
    localeMenuOpen: s.localeMenuOpen,
    t,
    isHearing: s.screen === 'hearing',
    isHearIntro: s.screen === 'hearing' && s.hearStep === 'intro',
    isHearSetup: s.screen === 'hearing' && s.hearStep === 'setup',
    isHearCalibrate: s.screen === 'hearing' && s.hearStep === 'calibrate',
    isHearMeasure: s.screen === 'hearing' && s.hearStep === 'measure',
    isHearDone: s.screen === 'hearing' && s.hearStep === 'done',
    hearShowStop: s.screen === 'hearing' && s.hearStep === 'calibrate',
    hearDeviceOptions,
    hearListeningOptions,
    hearMeasureStatus,
    hearCurrentFreqLabel,
    hearProgressPct,
    hearPlayingClass: s.hearPlaying ? 'is-playing' : '',
    hearCalPlayingClass: s.hearCalPlaying ? 'is-playing' : '',
    hearGraph,
    hearRefLineY,
    hearDbTicks,
    hearIsPartial,
    hearReportDate,
    hearReportNameDisplay,
  };
}
