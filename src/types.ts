export type Ear = 'right' | 'left';
export type DeviceType = 'headphone' | 'earphone';
export type ListeningType = 'reference' | 'listening';
export type Screen = 'gate' | 'opening' | 'hearing';
export type HearStep = 'intro' | 'setup' | 'calibrate' | 'measure' | 'done';

export interface FrequencyResult {
  threshold: number | null;
  noResponse: boolean;
}

export type EarResults = Partial<Record<number, FrequencyResult>>;

export interface HearResults {
  right: EarResults;
  left: EarResults;
}

export interface AppState {
  screen: Screen;
  password: string;
  passwordError: boolean;
  hearStep: HearStep;
  hearEar: Ear;
  hearFreqPos: number;
  hearResults: HearResults;
  hearPlaying: boolean;
  hearCalPlaying: boolean;
  hearReportName: string;
  hearDeviceType: DeviceType;
  hearListeningType: ListeningType;
}

export function createInitialHearingState(): Pick<
  AppState,
  | 'hearStep'
  | 'hearEar'
  | 'hearFreqPos'
  | 'hearResults'
  | 'hearPlaying'
  | 'hearCalPlaying'
  | 'hearReportName'
  | 'hearDeviceType'
  | 'hearListeningType'
> {
  return {
    hearStep: 'intro',
    hearEar: 'right',
    hearFreqPos: 0,
    hearResults: { right: {}, left: {} },
    hearPlaying: false,
    hearCalPlaying: false,
    hearReportName: '',
    hearDeviceType: 'headphone',
    hearListeningType: 'reference',
  };
}

export function createInitialState(isMobile: boolean): AppState {
  return {
    screen: isMobile ? 'opening' : 'gate',
    password: '',
    passwordError: false,
    ...createInitialHearingState(),
  };
}
