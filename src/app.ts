import { renderChassis } from './chassis';
import {
  GATE_PASSWORD,
  HEARING_CEILING_DB,
  HEARING_CONFIRMATIONS_NEEDED,
  HEARING_EARPHONE_OFFSET_DB,
  HEARING_FLOOR_DB,
  HEARING_GAP_MAX_MS,
  HEARING_GAP_MIN_MS,
  HEARING_MAX_RESPONSE_MS,
  HEARING_MAX_TRIALS_PER_FREQ,
  HEARING_PULSE_GAP_MS,
  HEARING_PULSE_ON_MS,
  HEARING_REF_GAIN,
  HEARING_STEP_BIG,
  HEARING_STEP_SMALL,
  HEARING_TEST_ORDER,
} from './constants';
import { renderScreenContent } from './templates';
import type { AppState, DeviceType, ListeningType } from './types';
import { createInitialHearingState, createInitialState } from './types';
import { computeViewModel } from './viewModel';

type HearDirection = 'descend' | 'ascend';

export class App {
  private state: AppState = createInitialState();
  private screenRoot: HTMLElement;

  private audioCtx: AudioContext | null = null;
  private hearOsc: OscillatorNode | null = null;
  private hearGain: GainNode | null = null;
  private hearCalOsc: OscillatorNode | null = null;
  private hearCalGain: GainNode | null = null;
  private hearCanRespond = false;
  private hearDirection: HearDirection = 'descend';
  private hearLevel = 0;
  private hearAscendHits: number[] = [];
  private hearTrialCount = 0;
  private hearTrialStartTimer: number | undefined;
  private hearTrialTimer: number | undefined;
  private hearGapTimer: number | undefined;

  constructor(root: HTMLElement) {
    root.innerHTML = renderChassis();
    const screenRoot = root.querySelector<HTMLElement>('#screen-root');
    if (!screenRoot) throw new Error('screen-root not found in chassis markup');
    this.screenRoot = screenRoot;

    this.screenRoot.addEventListener('click', this.handleClick);
    this.screenRoot.addEventListener('input', this.handleInput);
    this.screenRoot.addEventListener('keydown', this.handleFieldKeyDown);
    window.addEventListener('keydown', this.handleGlobalKeyDown);

    this.render();
  }

  private setState(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    this.render();
  }

  private render(): void {
    const vm = computeViewModel(this.state);
    this.screenRoot.innerHTML = renderScreenContent(this.state, vm);
  }

  // ---- event delegation -------------------------------------------------

  private handleClick = (e: MouseEvent): void => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action!;
    const value = target.dataset.value;
    switch (action) {
      case 'submitPassword':
        this.submitPassword();
        break;
      case 'goToGate':
        this.goToGate();
        break;
      case 'goToHearSetup':
        this.goToHearSetup();
        break;
      case 'selectHearDeviceType':
        this.selectHearDeviceType(value as DeviceType);
        break;
      case 'selectHearListeningType':
        this.selectHearListeningType(value as ListeningType);
        break;
      case 'beginHearingCalibration':
        this.beginHearingCalibration();
        break;
      case 'confirmHearingCalibration':
        this.confirmHearingCalibration();
        break;
      case 'handleHearingHeard':
        this.handleHearingHeard();
        break;
      case 'stopHearingTest':
        this.stopHearingTest();
        break;
      case 'printHearingReport':
        this.printHearingReport();
        break;
    }
  };

  private handleInput = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    const bind = target.dataset.bind;
    if (!bind) return;
    if (bind === 'password') {
      this.state = { ...this.state, password: target.value, passwordError: false };
      // Avoid a full re-render while typing so the input keeps focus/caret.
    } else if (bind === 'hearReportName') {
      this.state = { ...this.state, hearReportName: target.value };
    }
  };

  private handleFieldKeyDown = (e: KeyboardEvent): void => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-enter-action]');
    if (!target) return;
    if (e.key === 'Enter' && target.dataset.enterAction === 'submitPassword') {
      this.submitPassword();
    }
  };

  private handleGlobalKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    if (this.state.screen !== 'hearing' || this.state.hearStep !== 'measure') return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    this.handleHearingHeard();
  };

  // ---- gate ---------------------------------------------------------------

  private submitPassword(): void {
    if (this.state.password.trim().toUpperCase() === GATE_PASSWORD) {
      this.setState({
        screen: 'hearing',
        passwordError: false,
        password: '',
        ...createInitialHearingState(),
      });
    } else {
      this.setState({ passwordError: true });
    }
  }

  private goToGate(): void {
    this.stopHearingAudio();
    this.setState({
      screen: 'gate',
      password: '',
      passwordError: false,
      ...createInitialHearingState(),
    });
  }

  private goToHearSetup(): void {
    this.setState({ hearStep: 'setup' });
  }

  private selectHearDeviceType(type: DeviceType): void {
    this.setState({ hearDeviceType: type });
  }

  private selectHearListeningType(type: ListeningType): void {
    this.setState({ hearListeningType: type });
  }

  // ---- audio ---------------------------------------------------------------

  private ensureAudioCtx(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }

  private getHearingRefGain(): number {
    const deviceOffsetDb = this.state.hearDeviceType === 'earphone' ? HEARING_EARPHONE_OFFSET_DB : 0;
    return HEARING_REF_GAIN * Math.pow(10, deviceOffsetDb / 20);
  }

  private beginHearingCalibration(): void {
    const ctx = this.ensureAudioCtx();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(this.getHearingRefGain(), now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    this.hearCalOsc = osc;
    this.hearCalGain = gain;
    this.setState({ hearStep: 'calibrate', hearCalPlaying: true });
  }

  private confirmHearingCalibration(): void {
    if (this.hearCalOsc && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.hearCalGain!.gain.cancelScheduledValues(now);
        this.hearCalGain!.gain.setValueAtTime(this.hearCalGain!.gain.value, now);
        this.hearCalGain!.gain.linearRampToValueAtTime(0.0001, now + 0.15);
        this.hearCalOsc.stop(now + 0.2);
      } catch {
        /* ignore */
      }
    }
    this.hearCalOsc = null;
    this.hearCalGain = null;
    this.hearDirection = 'descend';
    this.hearLevel = 0;
    this.hearAscendHits = [];
    this.hearTrialCount = 0;
    this.setState({ hearStep: 'measure', hearEar: 'right', hearFreqPos: 0, hearCalPlaying: false });
    this.hearTrialStartTimer = window.setTimeout(() => this.playHearingTrial(), 500);
  }

  private currentHearingFreq(): number {
    return HEARING_TEST_ORDER[this.state.hearFreqPos];
  }

  private playHearingTrial(): void {
    if (this.state.screen !== 'hearing' || this.state.hearStep !== 'measure') return;
    this.hearTrialCount += 1;
    if (this.hearTrialCount > HEARING_MAX_TRIALS_PER_FREQ) {
      const fallback = this.hearAscendHits.length ? Math.min(...this.hearAscendHits) : null;
      this.finishHearingFrequency(fallback, fallback === null);
      return;
    }
    this.hearLevel = Math.max(HEARING_FLOOR_DB, Math.min(HEARING_CEILING_DB, this.hearLevel));
    const ctx = this.ensureAudioCtx();
    const now = ctx.currentTime;
    const freq = this.currentHearingFreq();
    const gainValue = this.getHearingRefGain() * Math.pow(10, this.hearLevel / 20);
    const pulseOnSec = HEARING_PULSE_ON_MS / 1000;
    const pulseGapSec = HEARING_PULSE_GAP_MS / 1000;
    const rampSec = Math.min(0.006, pulseOnSec / 4);
    const windowSec = HEARING_MAX_RESPONSE_MS / 1000;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    let t = now;
    while (t - now < windowSec) {
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainValue, t + rampSec);
      gain.gain.setValueAtTime(gainValue, t + pulseOnSec - rampSec);
      gain.gain.linearRampToValueAtTime(0, t + pulseOnSec);
      t += pulseOnSec + pulseGapSec;
    }
    const panner = ctx.createStereoPanner();
    panner.pan.value = this.state.hearEar === 'right' ? 1 : -1;
    osc.connect(gain).connect(panner).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + windowSec + 0.1);
    this.hearOsc = osc;
    this.hearGain = gain;
    this.hearCanRespond = true;
    this.setState({ hearPlaying: true });
    this.hearTrialTimer = window.setTimeout(() => this.resolveHearingTrial(false), HEARING_MAX_RESPONSE_MS);
  }

  private handleHearingHeard(): void {
    if (this.state.screen !== 'hearing' || this.state.hearStep !== 'measure') return;
    if (!this.hearCanRespond) return;
    window.clearTimeout(this.hearTrialTimer);
    this.resolveHearingTrial(true);
  }

  private resolveHearingTrial(responded: boolean): void {
    this.hearCanRespond = false;
    this.setState({ hearPlaying: false });
    if (responded && this.hearOsc && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.hearGain!.gain.cancelScheduledValues(now);
        this.hearGain!.gain.setValueAtTime(this.hearGain!.gain.value, now);
        this.hearGain!.gain.linearRampToValueAtTime(0, now + 0.03);
        this.hearOsc.stop(now + 0.05);
      } catch {
        /* ignore */
      }
    }

    if (this.hearDirection === 'descend') {
      if (responded) {
        if (this.hearLevel <= HEARING_FLOOR_DB) {
          this.hearDirection = 'ascend';
          this.hearLevel = HEARING_FLOOR_DB;
        } else {
          this.hearLevel -= HEARING_STEP_BIG;
        }
      } else {
        this.hearDirection = 'ascend';
        this.hearLevel += HEARING_STEP_SMALL;
      }
    } else {
      if (responded) {
        this.hearAscendHits.push(this.hearLevel);
        const hitsAtLevel = this.hearAscendHits.filter((l) => l === this.hearLevel).length;
        if (hitsAtLevel >= HEARING_CONFIRMATIONS_NEEDED) {
          this.finishHearingFrequency(this.hearLevel, false);
          return;
        }
        this.hearLevel = Math.max(HEARING_FLOOR_DB, this.hearLevel - HEARING_STEP_BIG);
      } else if (this.hearLevel >= HEARING_CEILING_DB) {
        this.finishHearingFrequency(null, true);
        return;
      } else {
        this.hearLevel += HEARING_STEP_SMALL;
      }
    }

    const gap = HEARING_GAP_MIN_MS + Math.random() * (HEARING_GAP_MAX_MS - HEARING_GAP_MIN_MS);
    this.hearGapTimer = window.setTimeout(() => this.playHearingTrial(), gap);
  }

  private finishHearingFrequency(threshold: number | null, noResponse: boolean): void {
    const freq = this.currentHearingFreq();
    const ear = this.state.hearEar;
    const results = {
      ...this.state.hearResults,
      [ear]: { ...this.state.hearResults[ear], [freq]: { threshold, noResponse } },
    };
    const nextPos = this.state.hearFreqPos + 1;
    this.hearDirection = 'descend';
    this.hearAscendHits = [];
    this.hearTrialCount = 0;
    if (nextPos < HEARING_TEST_ORDER.length) {
      this.hearLevel = 0;
      this.setState({ hearResults: results, hearFreqPos: nextPos });
      this.hearGapTimer = window.setTimeout(() => this.playHearingTrial(), 700);
    } else if (ear === 'right') {
      this.hearLevel = 0;
      this.setState({ hearResults: results, hearEar: 'left', hearFreqPos: 0 });
      this.hearGapTimer = window.setTimeout(() => this.playHearingTrial(), 1200);
    } else {
      this.setState({ hearResults: results, hearStep: 'done' });
    }
  }

  private stopHearingAudio(): void {
    window.clearTimeout(this.hearTrialStartTimer);
    window.clearTimeout(this.hearTrialTimer);
    window.clearTimeout(this.hearGapTimer);
    this.hearCanRespond = false;
    if (this.audioCtx) {
      const now = this.audioCtx.currentTime;
      try {
        if (this.hearGain) {
          this.hearGain.gain.cancelScheduledValues(now);
          this.hearGain.gain.setValueAtTime(this.hearGain.gain.value, now);
          this.hearGain.gain.linearRampToValueAtTime(0.0001, now + 0.02);
        }
        if (this.hearOsc) this.hearOsc.stop(now + 0.03);
      } catch {
        /* ignore */
      }
      try {
        if (this.hearCalGain) {
          this.hearCalGain.gain.cancelScheduledValues(now);
          this.hearCalGain.gain.setValueAtTime(this.hearCalGain.gain.value, now);
          this.hearCalGain.gain.linearRampToValueAtTime(0.0001, now + 0.02);
        }
        if (this.hearCalOsc) this.hearCalOsc.stop(now + 0.03);
      } catch {
        /* ignore */
      }
    }
    this.hearOsc = null;
    this.hearGain = null;
    this.hearCalOsc = null;
    this.hearCalGain = null;
  }

  private stopHearingTest(): void {
    this.stopHearingAudio();
    if (this.state.hearStep === 'measure') {
      const freq = this.currentHearingFreq();
      const ear = this.state.hearEar;
      const results = {
        ...this.state.hearResults,
        [ear]: { ...this.state.hearResults[ear], [freq]: { threshold: null, noResponse: true } },
      };
      this.setState({ hearResults: results, hearStep: 'done' });
    } else {
      this.setState({ hearStep: 'done' });
    }
  }

  private printHearingReport(): void {
    window.print();
  }
}
