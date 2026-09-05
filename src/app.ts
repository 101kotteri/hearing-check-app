import {
  MOBILE_CHASSIS_H,
  MOBILE_CHASSIS_W,
  MOBILE_OPENING_FRAME_H,
  MOBILE_OPENING_FRAME_W,
  PC_CHASSIS_H,
  PC_CHASSIS_W,
  TABLET_FRAME_H,
  TABLET_FRAME_W,
  renderChassis,
  renderMobileOpeningFrame,
  renderMobileRoot,
  renderTabletFrame,
} from './chassis';
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
import {
  renderMobileBackButtonOverlay,
  renderMobileCalibrate,
  renderMobileDone,
  renderMobileIntro,
  renderMobileMeasure,
  renderMobileOpening,
  renderMobileSetup,
} from './mobileTemplates';
import { renderPrintReport, renderScreenContent } from './templates';
import type { AppState, DeviceType, ListeningType } from './types';
import { createInitialHearingState, createInitialState } from './types';
import { computeViewModel } from './viewModel';
import type { Locale } from './i18n';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { registerPlugin } from '@capacitor/core';

// Local plugin (no npm package — registered directly in the Xcode project,
// see ios/App/App/SavePhotoPlugin.swift + project.pbxproj) that writes an
// image straight to the Photos library via PHPhotoLibrary. Used instead of
// routing the image save through Share.share: sharing an image put "Add to
// Shared Album" (an iCloud Shared Albums action needing a signed-in Apple
// ID) ahead of/alongside plain "Save Image" in the share sheet, which was
// confusing and didn't work at all on a not-signed-in simulator — this
// saves directly, no share sheet, no account needed.
interface SavePhotoPlugin {
  saveImage(options: { data: string }): Promise<void>;
}
const SavePhoto = registerPlugin<SavePhotoPlugin>('SavePhoto');
// Dynamically imported inside shareHearingReportNative() instead of here —
// jsPDF (plus its own bundled dependencies) adds real weight (400KB+) that
// only the native app's save flow ever needs. A static import here would
// ship all of that to every plain WebApp visitor too, who never takes this
// code path (they still use window.print(), unchanged).

type HearDirection = 'descend' | 'ascend';

const OPENING_FRAME_FADE_IN_MS = 1500;
const OPENING_HOLD_MS = 4500;
const OPENING_ZOOM_MS = 600;
const OPENING_REVEAL_MS = 400;
const OPENING_ZOOM_SCALE = 2.4;

// iPad's opening→explanation transition, per explicit direction: unlike
// phone, the frame is never remounted going into intro (tablet is always
// framed), so it should never animate AT ALL — no fade-in, no zoom-out, no
// black cover. Only the CONTENT crossfades in place: the logo/title slowly
// fades out while the explanation screen simultaneously fades in underneath,
// overlapping visibly mid-transition (not a sequential fade-out-then-in).
const TABLET_OPENING_HOLD_MS = 4500;
const TABLET_OPENING_CROSSFADE_MS = 1800;

// Calibrate's decorative frame is mounted fresh (setup is frame-less) each
// time it's entered — fades in like the opening screen's frame, just shorter
// since there's no logo/title sequence waiting on it.
const CALIBRATE_FRAME_FADE_IN_MS = 500;

// How far down the frame (0-1) lands at the viewport's bottom edge when a
// screen uses the 'overflow-top' fit mode (calibrate/measure) — tuned to crop
// partway through the decorative button row, not the functional screen area.
const OVERFLOW_CROP_FRACTION = 0.82;

export class App {
  private state: AppState;
  private rootEl: HTMLElement;
  private screenRoot!: HTMLElement;
  private printRoot: HTMLElement;
  private transitionOverlay: HTMLElement;
  private backBtnOverlay: HTMLElement;
  private isMobile: boolean;
  private isTablet: boolean;
  // Which outer shell is currently mounted in rootEl — PC always stays framed
  // (chassis, 1504x838); mobile is framed only on the opening screen and
  // frame-less everywhere after it (see mountRoot). Starts null so the first
  // render() always performs an initial mount.
  private isCurrentlyFramed: boolean | null = null;
  // 'contain': fit entirely within the viewport, centered (opening screen, PC).
  // 'overflow-top': enlarged, top-aligned, bottom deliberately cropped
  // (calibrate/measure — see wantsOverflowTopFit).
  private framedFitMode: 'contain' | 'overflow-top' = 'contain';

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
  private openingTimer1: number | undefined;
  private openingTimer2: number | undefined;

  constructor(
    root: HTMLElement,
    isMobile: boolean,
    isTablet: boolean = false,
    locale: Locale = 'en',
    isNative: boolean = false
  ) {
    this.isMobile = isMobile;
    // Tablet deliberately does NOT set isMobile — it stays on the PC-based
    // chassis/fit/mount path (always framed, no back-btn-overlay) and reuses
    // PC's own templates for every screen after the opening one, per explicit
    // direction to base it on the PC version rather than the phone's frame-
    // less mobile UI. It DOES get its own taller frame variant (see
    // renderTabletFrame) and, per a later explicit request, the phone's
    // opening screen/animation with no password gate — see wantsFramedChassis,
    // mountRoot, and goToGate for where isTablet is checked alongside isMobile.
    this.isTablet = isTablet;
    this.state = createInitialState(isMobile, isTablet, locale, isNative);
    this.rootEl = root;

    // A body-level sibling of the chassis, not a descendant of it — the print
    // report must live outside the chassis's scaled/clipped wrapper hierarchy
    // (see chassis.ts) so print layout isn't affected by that hierarchy's
    // transform/overflow, and so hiding the chassis for print is one line.
    this.printRoot = document.createElement('div');
    this.printRoot.id = 'print-root';
    document.body.appendChild(this.printRoot);

    // Also body-level: the opening→explanation transition fades this to black
    // and back independent of the templated re-render (see startOpeningSequence),
    // the same reasoning as printRoot.
    this.transitionOverlay = document.createElement('div');
    this.transitionOverlay.id = 'transition-overlay';
    document.body.appendChild(this.transitionOverlay);

    // Also body-level: calibrate/measure's back button is drawn here instead
    // of inside the decorative frame's bezel, transformed with the frame-less
    // canvas's own fit math (see render()) so it lands at the same screen
    // position as the explanation screen's button rather than wherever the
    // frame's bezel happens to be scaled to.
    this.backBtnOverlay = document.createElement('div');
    this.backBtnOverlay.id = 'back-btn-overlay';
    this.backBtnOverlay.style.position = 'fixed';
    this.backBtnOverlay.style.top = '0';
    this.backBtnOverlay.style.left = '0';
    this.backBtnOverlay.style.transformOrigin = 'top left';
    this.backBtnOverlay.style.pointerEvents = 'none';
    this.backBtnOverlay.addEventListener('click', this.handleClick);
    document.body.appendChild(this.backBtnOverlay);

    window.addEventListener('keydown', this.handleGlobalKeyDown);
    window.addEventListener('resize', this.fitToScreen);
    window.addEventListener('orientationchange', this.fitToScreen);

    this.render();
  }

  private setState(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    this.render();
  }

  // Framed on: PC and tablet always; mobile's opening screen; mobile's
  // calibrate/measure steps (brought back by explicit request — everything
  // else from the explanation screen on stays frame-less).
  private wantsFramedChassis(): boolean {
    if (!this.isMobile) return true; // covers both PC and tablet
    if (this.state.screen === 'opening') return true;
    return (
      this.state.screen === 'hearing' && (this.state.hearStep === 'calibrate' || this.state.hearStep === 'measure')
    );
  }

  // calibrate/measure want the frame enlarged and top-aligned, deliberately
  // cropped at the bottom (through the decorative button row) rather than
  // shrunk to fit like the opening screen — see fitToScreen.
  private wantsOverflowTopFit(): boolean {
    return (
      this.isMobile &&
      this.state.screen === 'hearing' &&
      (this.state.hearStep === 'calibrate' || this.state.hearStep === 'measure')
    );
  }

  // Rebuilds rootEl's shell (chassis vs. frame-less canvas) and re-mounts
  // #screen-root + its event listeners — only called when the shell markup
  // itself needs to change (see render()). Positioning/scale is handled
  // separately by fitToScreen, which render() always calls afterward.
  private mountRoot(framed: boolean): void {
    if (framed) {
      // PC always gets the full-width chassis (unchanged); mobile gets its
      // own narrower, closer-to-square variant for the opening screen and
      // calibrate/measure; tablet gets its own taller-bezel variant, used
      // for every screen (tablet is always framed — see wantsFramedChassis).
      this.rootEl.innerHTML = this.isTablet
        ? renderTabletFrame()
        : this.isMobile
          ? renderMobileOpeningFrame()
          : renderChassis();
    } else {
      this.rootEl.innerHTML = renderMobileRoot();
    }
    const screenRoot = this.rootEl.querySelector<HTMLElement>('#screen-root');
    if (!screenRoot) throw new Error('screen-root not found in mounted shell markup');
    this.screenRoot = screenRoot;
    this.screenRoot.addEventListener('click', this.handleClick);
    this.screenRoot.addEventListener('input', this.handleInput);
    this.screenRoot.addEventListener('keydown', this.handleFieldKeyDown);
  }

  // Shared "shrink/grow to fit, centered" math (the frame-less canvas's own
  // fit mode) — factored out so the back-button overlay can use it too, even
  // when the frame-less canvas isn't the thing actually mounted.
  private computeContainTransform(w: number, h: number): { scale: number; offsetX: number; offsetY: number } {
    const scale = Math.min(window.innerWidth / w, window.innerHeight / h, 1);
    const offsetX = (window.innerWidth - w * scale) / 2;
    const offsetY = (window.innerHeight - h * scale) / 2;
    return { scale, offsetX, offsetY };
  }

  private framedW(): number {
    return this.isTablet ? TABLET_FRAME_W : this.isMobile ? MOBILE_OPENING_FRAME_W : PC_CHASSIS_W;
  }

  private framedH(): number {
    return this.isTablet ? TABLET_FRAME_H : this.isMobile ? MOBILE_OPENING_FRAME_H : PC_CHASSIS_H;
  }

  private fitToScreen = (): void => {
    const w = this.isCurrentlyFramed ? this.framedW() : MOBILE_CHASSIS_W;
    const h = this.isCurrentlyFramed ? this.framedH() : MOBILE_CHASSIS_H;

    if (this.isCurrentlyFramed && this.framedFitMode === 'overflow-top') {
      // Scale so that OVERFLOW_CROP_FRACTION down the frame lands exactly at
      // the viewport's bottom edge (top-aligned, horizontally centered) —
      // deliberately bigger than a "contain" fit, cropping the bottom of the
      // decorative casing rather than shrinking the whole frame to fit it.
      const scale = window.innerHeight / (h * OVERFLOW_CROP_FRACTION);
      const offsetX = (window.innerWidth - w * scale) / 2;
      this.rootEl.style.transform = `translate(${offsetX}px, 0px) scale(${scale})`;
    } else {
      const { scale, offsetX, offsetY } = this.computeContainTransform(w, h);
      this.rootEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }

    // Always positioned with the frame-less canvas's own fit math, regardless
    // of what's actually mounted — see the backBtnOverlay field comment.
    const { scale: bScale, offsetX: bOffsetX, offsetY: bOffsetY } = this.computeContainTransform(
      MOBILE_CHASSIS_W,
      MOBILE_CHASSIS_H
    );
    this.backBtnOverlay.style.transform = `translate(${bOffsetX}px, ${bOffsetY}px) scale(${bScale})`;
  };

  private render(): void {
    const wantFramed = this.wantsFramedChassis();
    const enteringFramed = wantFramed && !this.isCurrentlyFramed;
    if (wantFramed !== this.isCurrentlyFramed) {
      this.mountRoot(wantFramed);
    }
    this.isCurrentlyFramed = wantFramed;
    this.framedFitMode = this.wantsOverflowTopFit() ? 'overflow-top' : 'contain';
    this.fitToScreen();

    // Setup (frame-less) leading into calibrate (framed) mounts the frame
    // fresh — fade it in rather than have it pop in instantly. Measure stays
    // framed the whole time (no re-mount, see wantsFramedChassis), so this
    // only ever fires on the setup->calibrate transition, not calibrate-
    // >measure. The opening screen's own framed entry is handled separately
    // by startOpeningSequence, so it's excluded here.
    if (enteringFramed && this.isMobile && this.state.screen === 'hearing' && this.state.hearStep === 'calibrate') {
      const shell = this.rootEl.querySelector<HTMLElement>('#app-shell');
      if (shell) {
        shell.style.transition = 'none';
        shell.style.opacity = '0';
        void shell.offsetHeight; // force reflow before re-enabling transitions
        shell.style.transition = `opacity ${CALIBRATE_FRAME_FADE_IN_MS}ms ease-out`;
        shell.style.opacity = '1';
      }
    }

    const vm = computeViewModel(this.state);

    if (this.wantsOverflowTopFit()) {
      const backAction = this.state.hearStep === 'calibrate' ? 'goBackToHearSetup' : 'goToGate';
      const backLabel = this.state.hearStep === 'calibrate' ? vm.t('nav.back') : 'EXIT';
      this.backBtnOverlay.innerHTML = renderMobileBackButtonOverlay(backAction, backLabel);
    } else {
      this.backBtnOverlay.innerHTML = '';
    }

    if ((this.isMobile || this.isTablet) && this.state.screen === 'opening') {
      // Tablet reuses the exact same opening content as phone, per explicit
      // request ("iPhoneと同じものを採用してください") — only the frame
      // around it differs (renderTabletFrame vs. renderMobileOpeningFrame).
      this.screenRoot.innerHTML = renderMobileOpening();
    } else if (this.isMobile && this.state.screen === 'hearing' && this.state.hearStep === 'intro') {
      this.screenRoot.innerHTML = renderMobileIntro(vm);
    } else if (this.isMobile && this.state.screen === 'hearing' && this.state.hearStep === 'setup') {
      this.screenRoot.innerHTML = renderMobileSetup(vm);
    } else if (this.isMobile && this.state.screen === 'hearing' && this.state.hearStep === 'calibrate') {
      this.screenRoot.innerHTML = renderMobileCalibrate(vm);
    } else if (this.isMobile && this.state.screen === 'hearing' && this.state.hearStep === 'measure') {
      this.screenRoot.innerHTML = renderMobileMeasure(vm);
    } else if (this.isMobile && this.state.screen === 'hearing' && this.state.hearStep === 'done') {
      this.screenRoot.innerHTML = renderMobileDone(vm);
    } else {
      this.screenRoot.innerHTML = renderScreenContent(this.state, vm);
    }
    this.printRoot.innerHTML = vm.isHearDone ? renderPrintReport(vm) : '';

    if (this.isMobile && this.state.screen === 'opening') {
      this.startOpeningSequence();
    } else if (this.isTablet && this.state.screen === 'opening') {
      this.startTabletOpeningSequence();
    }
  }

  // ---- event delegation -------------------------------------------------

  private handleClick = (e: MouseEvent): void => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action!;
    const value = target.dataset.value;
    // Both of these mobile button styles re-render (and often navigate off
    // this element entirely) synchronously on click — without a deliberate
    // pause, the browser never gets a chance to paint the CSS :active/press
    // frame before the DOM under it changes, so neither the raised back
    // button's press nor the orange buttons' glow burst was ever visible.
    // A manual class (CSS :active alone ends the instant the pointer lifts,
    // before click even fires) plus a short held-back dispatch fixes both.
    if (
      target.classList.contains('eg-back-btn') ||
      target.classList.contains('eg-lang-btn') ||
      target.classList.contains('eg-menu-item') ||
      target.classList.contains('eg-save-toggle')
    ) {
      target.classList.add('is-pressed');
      window.setTimeout(() => this.dispatchAction(action, value), 140);
      return;
    }
    if (target.classList.contains('eg-btn-glow')) {
      target.classList.add('is-glowing');
      // Briefly cut to 40ms while chasing a wrong hypothesis about the
      // real-device "screen zooms in on tap" bug (see style.css's
      // -webkit-text-size-adjust comment for the actual cause — WebKit's
      // mobile text-autosizing, nothing to do with this delay at all).
      // Restored to 220ms: eg-btn-glow-burst's keyframe animation runs
      // 0.5s (see style.css) — cutting the delay to 40ms meant the state
      // change (and the DOM replacement that comes with it) fired while
      // the glow animation had barely started, so it never got a chance
      // to render at all. 220ms is still well short of the 0.5s animation,
      // but long enough for the burst to be visibly underway before the
      // element is replaced.
      window.setTimeout(() => this.dispatchAction(action, value), 220);
      return;
    }
    this.dispatchAction(action, value);
  };

  private dispatchAction(action: string, value: string | undefined): void {
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
      case 'goBackToHearSetup':
        this.goBackToHearSetup();
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
      case 'toggleLocaleMenu':
        this.setState({ localeMenuOpen: !this.state.localeMenuOpen });
        break;
      case 'setLocale':
        this.setState({ locale: value as Locale, localeMenuOpen: false });
        break;
      case 'toggleSaveMenu':
        this.setState({ saveMenuOpen: !this.state.saveMenuOpen });
        break;
      case 'saveReport':
        this.saveReportAs(value as 'pdf' | 'image');
        break;
    }
  }

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
    if (this.isMobile || this.isTablet) {
      // No login on mobile or tablet — EXIT returns to the opening screen
      // instead, replaying its animation (render() starts it whenever screen
      // becomes 'opening').
      this.setState({ screen: 'opening', ...createInitialHearingState() });
      return;
    }
    this.setState({
      screen: 'gate',
      password: '',
      passwordError: false,
      ...createInitialHearingState(),
    });
  }

  // ---- mobile opening screen -----------------------------------------------

  private startOpeningSequence(): void {
    window.clearTimeout(this.openingTimer1);
    window.clearTimeout(this.openingTimer2);

    // Reset the overlay instantly (no transition) in case this is a replay
    // (EXIT back to opening) and it's mid-fade from a previous run.
    this.transitionOverlay.style.transition = 'none';
    this.transitionOverlay.style.opacity = '0';
    void this.transitionOverlay.offsetHeight; // force reflow before re-enabling transitions
    this.transitionOverlay.style.transition = '';

    // The screen opens on pure black (the body's own background), then the
    // frame itself fades in first — before the logo/title animation, whose
    // CSS animation-delay values are offset by this same duration so they
    // wait for it (see style.css's mobile-opening-* rules).
    const shellForFadeIn = this.rootEl.querySelector<HTMLElement>('#app-shell');
    if (shellForFadeIn) {
      shellForFadeIn.style.transition = 'none';
      shellForFadeIn.style.opacity = '0';
      void shellForFadeIn.offsetHeight; // force reflow before re-enabling transitions
      shellForFadeIn.style.transition = `opacity ${OPENING_FRAME_FADE_IN_MS}ms linear`;
      shellForFadeIn.style.opacity = '1';
    }

    this.openingTimer1 = window.setTimeout(() => {
      // Zoom the whole framed shell (casing + logo/title together), not just
      // the inner content, per explicit direction: the frame should fly
      // outward with everything else, not sit still while only the content
      // zooms past it.
      const shell = this.rootEl.querySelector<HTMLElement>('#app-shell');
      if (shell) {
        shell.style.transition = `transform ${OPENING_ZOOM_MS}ms ease-in, opacity ${OPENING_ZOOM_MS}ms ease-in`;
        shell.style.transform = `scale(${OPENING_ZOOM_SCALE})`;
        shell.style.opacity = '0';
      }
      this.transitionOverlay.style.transition = `opacity ${OPENING_ZOOM_MS}ms ease-in`;
      this.transitionOverlay.style.opacity = '1';

      this.openingTimer2 = window.setTimeout(() => {
        this.setState({ screen: 'hearing', hearStep: 'intro' });
        // Mobile's intro is frame-less, so mountRoot() replaces #app-shell
        // entirely and the zoomed-out/transparent inline styles set above go
        // away with it. Tablet's intro stays on the SAME framed shell (no
        // remount — see wantsFramedChassis), so without this reset it would
        // carry the scale(2.4)/opacity:0 from the zoom-out straight into the
        // next screen, rendering it huge and invisible.
        const shell = this.rootEl.querySelector<HTMLElement>('#app-shell');
        if (shell) {
          shell.style.transition = 'none';
          shell.style.transform = '';
          shell.style.opacity = '1';
          void shell.offsetHeight; // force reflow before re-enabling transitions
          shell.style.transition = '';
        }
        requestAnimationFrame(() => {
          this.transitionOverlay.style.transition = `opacity ${OPENING_REVEAL_MS}ms ease-out`;
          this.transitionOverlay.style.opacity = '0';
        });
      }, OPENING_ZOOM_MS);
    }, OPENING_HOLD_MS);
  }

  private startTabletOpeningSequence(): void {
    window.clearTimeout(this.openingTimer1);
    window.clearTimeout(this.openingTimer2);

    // The frame itself (#app-shell) is left completely untouched here — no
    // opacity/transform styling at all, on purpose (see the constant's
    // comment above). Only the logo/title CSS animations (already applied
    // via renderMobileOpening's classes) play, same as phone.
    this.openingTimer1 = window.setTimeout(() => {
      // Snapshot the current (logo/title) content into a sibling overlay,
      // still fully opaque, so it can fade out independently of whatever
      // replaces #screen-root's own content next.
      const overlay = document.createElement('div');
      overlay.id = 'tablet-opening-crossfade-overlay';
      overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;';
      overlay.innerHTML = this.screenRoot.innerHTML;
      // The logo/title's own entrance animations (.mobile-opening-logo/-text,
      // style.css) use fill-mode "both" with a multi-second delay — cloned
      // into a fresh DOM node via innerHTML, that animation restarts from
      // its pre-entrance 0% keyframe (invisible/rotated) rather than keeping
      // the already-settled end state, making the whole snapshot invisible
      // for the entire crossfade. Lock them to their finished state instead.
      overlay.querySelectorAll<HTMLElement>('.mobile-opening-logo, .mobile-opening-text').forEach((el) => {
        el.style.animation = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      this.screenRoot.parentElement?.appendChild(overlay);

      // Hide the live root instantly (no transition yet) so the moment its
      // content is replaced with the explanation screen below, it starts
      // invisible — ready to fade in from there.
      this.screenRoot.style.transition = 'none';
      this.screenRoot.style.opacity = '0';
      void this.screenRoot.offsetHeight; // force reflow before re-enabling transitions

      this.setState({ screen: 'hearing', hearStep: 'intro' });

      // Both fades run over the SAME window, started together, so the old
      // (logo/title) and new (explanation) content are simultaneously
      // partially visible mid-transition — a true crossfade, not a fade-out
      // then a separate fade-in.
      requestAnimationFrame(() => {
        // linear, not ease — ease's fast-starting curve made the new screen
        // dominate almost immediately, leaving the overlap barely visible;
        // a constant rate keeps both content layers clearly part-visible
        // for a good stretch through the middle of the transition.
        overlay.style.transition = `opacity ${TABLET_OPENING_CROSSFADE_MS}ms linear`;
        overlay.style.opacity = '0';
        this.screenRoot.style.transition = `opacity ${TABLET_OPENING_CROSSFADE_MS}ms linear`;
        this.screenRoot.style.opacity = '1';
      });

      window.setTimeout(() => {
        overlay.remove();
        // Clear the inline opacity/transition now that the crossfade is
        // done — leaving them set (even at their resting values) would
        // otherwise silently apply this same slow transition to any later,
        // unrelated opacity change on this element.
        this.screenRoot.style.transition = '';
        this.screenRoot.style.opacity = '';
      }, TABLET_OPENING_CROSSFADE_MS + 50);
    }, TABLET_OPENING_HOLD_MS);
  }

  private goToHearSetup(): void {
    this.setState({ hearStep: 'setup' });
  }

  private goBackToHearSetup(): void {
    this.stopHearingAudio();
    this.setState({ hearStep: 'setup', hearCalPlaying: false });
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
    // Explicit stereo output, rather than trusting the destination's default
    // channel count/interpretation, so a hard pan can't silently downmix.
    panner.channelCount = 2;
    panner.channelCountMode = 'explicit';
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
    if (this.state.hearStep === 'calibrate') {
      // No measurement data exists yet at this step, so there's nothing
      // meaningful to show on a results screen — go back to setup instead.
      this.setState({ hearStep: 'setup' });
      return;
    }
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

  // Web-only path (the results screen's save button on native instead opens
  // the saveMenuOpen dropdown — see toggleSaveMenu/saveReportAs below — since
  // a bare WKWebView doesn't get a print dialog for free the way a full
  // browser does). Untouched: works today, PC/mobile/tablet all verified.
  private printHearingReport(): void {
    // hearReportName updates skip a re-render (see handleInput) to keep the input's
    // caret position while typing, so the hidden .eg-print-report copy can be stale.
    // Focus is on this button, not the name field, so re-rendering here is safe.
    this.render();
    window.print();
  }

  // Native results-screen save button: per explicit direction, "save as
  // file" and "save as image" must land in exactly one destination each
  // (Files / Photos) — sharing both files in one Share.share() call (the
  // earlier approach) can't do that, since the OS share sheet's "save to
  // Files" action bundles every shared item together regardless of type.
  // Generating and sharing only the one requested file keeps each destination
  // clean.
  private saveReportAs(mode: 'pdf' | 'image'): void {
    this.setState({ saveMenuOpen: false });
    this.shareHearingReportNative(mode).catch((err) => {
      console.error('shareHearingReportNative failed', err);
    });
  }

  private async shareHearingReportNative(mode: 'pdf' | 'image'): Promise<void> {
    const { generateReportPdfDataUri, generateReportPngDataUrl, reportFilenames } = await import('./reportExport');
    const vm = computeViewModel(this.state);
    if (mode === 'pdf') {
      // PDF still goes through the OS share sheet — "save to Files" has no
      // simpler direct-write equivalent (a document picker IS a system
      // sheet), so this remains the right tool for that destination.
      const { pdf } = reportFilenames(vm);
      const pdfBase64 = generateReportPdfDataUri(vm).split(',')[1];
      const pdfResult = await Filesystem.writeFile({ path: pdf, data: pdfBase64, directory: Directory.Cache });
      await Share.share({ files: [pdfResult.uri] });
    } else {
      const pngBase64 = generateReportPngDataUrl(vm).split(',')[1];
      await SavePhoto.saveImage({ data: pngBase64 });
    }
  }
}
