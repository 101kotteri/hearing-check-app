// Mobile (frame-less, native-app-preview) screens. Distinct from templates.ts's
// PC/chassis screens per explicit direction: the opening screen keeps a frame,
// everything after it (starting at the explanation/intro screen) has none, and
// text throughout is sized up for a phone held in landscape rather than a desk.
// Sizes below all key off the explanation screen's established baseline (title
// 26px, mono body 23px, buttons 22px, EXIT 29px) per explicit direction to keep
// the rest of the flow visually consistent with it, not just individually "big".

import { breatheDelayStyle, escapeHtml, renderHearGraphBlock } from './templates';
import type { ViewModel } from './viewModel';

const MOBILE_TOPBAR_H = 90;

// 2x the PC gate screen's icon, at the user's explicit request (freed up by
// dropping the login box mobile doesn't need).
const MOBILE_EAR_WAVE_ICON = `
  <svg width="264" height="240" viewBox="0 0 110 100" fill="none">
    <path d="M13.5 40.25 C 24.75 40.25 24.75 64.75 13.5 64.75" stroke="var(--accent)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.5"/>
    <path d="M20.75 30 C 41.35 30 41.35 75 20.75 75" stroke="var(--accent)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.5"/>
    <circle cx="5" cy="52.5" r="4.5" fill="var(--accent)" opacity="0.5"/>
    <path d="M70 15 C 50 20 45 45 55 65 C 62.5 80 80 87.5 95 82.5 C 105 78.75 110 67.5 105 60" stroke="var(--accent)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M75 30 C 62.5 32.5 60 47.5 67.5 57.5 C 72.5 65 82.5 67.5 90 62.5" stroke="var(--accent)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="85" cy="52.5" r="4.5" fill="var(--accent)"/>
  </svg>`;

export function renderMobileOpening(): string {
  return `
  <div class="mobile-opening-content" style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;perspective:900px;">
    <div class="mobile-opening-logo" style="display:flex;">${MOBILE_EAR_WAVE_ICON}</div>
    <div class="mobile-opening-text" style="font-family:var(--font-mono);font-size:24px;letter-spacing:10px;color:var(--text-dim);">AUDIOMETRIC SELF-TEST</div>
    <div class="mobile-opening-text" style="font-size:76px;font-weight:700;letter-spacing:12px;">HEARING CHECK</div>
  </div>`;
}

// Shared "raised" back/EXIT button — same markup everywhere it appears (the
// explanation screen, setup, calibrate's 戻る, measure's EXIT, and the results
// screen's EXIT) so position and styling stay identical across the whole flow,
// per explicit request.
function renderMobileBackButton(action: string, label: string): string {
  return `
  <div data-action="${action}" class="eg-back-btn">
    <svg width="18" height="18" viewBox="0 0 12 12"><path d="M8 1 L3 6 L8 11" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>
    ${label}
  </div>`;
}

// Standalone version of the top bar's button row, for app.ts to mount into a
// body-level overlay positioned with the frame-less canvas's own fit math —
// calibrate/measure render inside the decorative frame's bezel, which sits at
// a different offset/scale than the frame-less screens, so a button drawn
// inside that bezel can't land at the same screen position as the
// explanation screen's. Placing an identical button outside the frame,
// transformed the same way the frame-less canvas is, does. See app.ts.
export function renderMobileBackButtonOverlay(action: string, label: string): string {
  return `
  <div style="height:${MOBILE_TOPBAR_H}px;box-sizing:border-box;display:flex;align-items:center;padding:0 48px;">
    ${renderMobileBackButton(action, label)}
  </div>`;
}

function renderMobileTopBar(vm?: ViewModel): string {
  const isCalibrate = vm?.isHearCalibrate ?? false;
  const isMeasure = vm?.isHearMeasure ?? false;
  // calibrate/measure's back button is rendered externally (see
  // renderMobileBackButtonOverlay / app.ts) so it can sit outside the
  // decorative frame at the explanation screen's position — leave this
  // in-frame top bar empty for them, just reserving its height.
  if (isCalibrate || isMeasure) {
    return `<div style="height:${MOBILE_TOPBAR_H}px;flex-shrink:0;"></div>`;
  }
  const backAction = 'goToGate';
  const backLabel = 'EXIT';
  return `
  <div style="height:${MOBILE_TOPBAR_H}px;flex-shrink:0;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;padding:0 48px;">
    ${renderMobileBackButton(backAction, backLabel)}
  </div>`;
}

// Mirrored at the bottom of every post-explanation screen so the flex:1
// content area between them is centered in the FULL canvas, not just in
// whatever space happens to be left under the top bar (which reads as
// "sitting too low" — the top bar alone eats space asymmetrically).
function renderMobileBottomSpacer(): string {
  // pointer-events:none defensively: if content ever overflows its allotted
  // space (a real bug hit once already — see memory notes on the calibrate
  // screen's min-height:auto overflow), this purely-decorative spacer must
  // never be able to sit on top of and swallow clicks meant for real content.
  return `<div style="height:${MOBILE_TOPBAR_H}px;flex-shrink:0;pointer-events:none;"></div>`;
}

export function renderMobileIntro(): string {
  return `
  <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;">
    ${renderMobileTopBar()}
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;max-width:1180px;margin:0 auto;text-align:center;padding:0 40px;">
      <div style="font-size:26px;font-weight:700;letter-spacing:1px;">簡易聴力チェック</div>
      <div style="font-family:var(--font-mono);font-size:23px;color:var(--text-dim);line-height:1.75;text-align:left;">
        ・ヘッドホンまたはイヤホンを装着してください<br/>
        ・右耳→左耳の順に、低い音から高い音まで自動で測定します<br/>
        ・音が聞こえたら「聞こえたら押す」ボタンを押してください<br/>
        ・聞こえない場合は何もしなくて大丈夫です（自動的に次に進みます）<br/>
        ・所要時間の目安は3〜5分です<br/>
        ・体調に異変を感じたら、いつでも「緊急停止」で中断できます
      </div>
      <div style="font-family:var(--font-mono);font-size:19px;color:var(--text-dim);line-height:1.6;">※使用機器の音量設定に依存する相対的な簡易チェックです。医療機関の聴力検査の代わりにはなりません。</div>
      <button data-action="goToHearSetup" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:22px;padding:16px 64px;cursor:pointer;border-radius:4px;">はじめる</button>
    </div>
    ${renderMobileBottomSpacer()}
  </div>`;
}

const MOBILE_PLAY_ICON = `<svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3z" fill="var(--accent)"/></svg>`;

export function renderMobileSetup(vm: ViewModel): string {
  const deviceButtons = vm.hearDeviceOptions
    .map(
      (opt) =>
        `<button data-action="selectHearDeviceType" data-value="${opt.id}" style="background:${
          opt.active ? 'var(--panel-2)' : 'transparent'
        };border:1px solid ${opt.active ? 'var(--accent)' : 'var(--line)'};color:${
          opt.active ? 'var(--accent)' : 'var(--text-dim)'
        };padding:16px 32px;border-radius:4px;font-weight:700;letter-spacing:1px;font-size:21px;cursor:pointer;font-family:var(--font-mono);">${
          opt.label
        }</button>`
    )
    .join('');
  const listeningButtons = vm.hearListeningOptions
    .map(
      (opt) =>
        `<button data-action="selectHearListeningType" data-value="${opt.id}" style="background:${
          opt.active ? 'var(--panel-2)' : 'transparent'
        };border:1px solid ${opt.active ? 'var(--accent)' : 'var(--line)'};color:${
          opt.active ? 'var(--accent)' : 'var(--text-dim)'
        };padding:16px 24px;border-radius:4px;font-weight:700;letter-spacing:0.5px;font-size:19px;cursor:pointer;font-family:var(--font-mono);white-space:pre-line;line-height:1.6;">${escapeHtml(
          opt.label
        )}</button>`
    )
    .join('');
  return `
  <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;">
    ${renderMobileTopBar(vm)}
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;text-align:center;">
      <div style="font-size:26px;font-weight:700;letter-spacing:1px;">測定環境を選択してください</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
        <div style="font-family:var(--font-mono);font-size:20px;letter-spacing:1px;color:var(--text-dim);">再生機器</div>
        <div style="display:flex;gap:14px;">${deviceButtons}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
        <div style="font-family:var(--font-mono);font-size:20px;letter-spacing:1px;color:var(--text-dim);">音質の特性</div>
        <div style="display:flex;gap:14px;">${listeningButtons}</div>
      </div>
      <button data-action="beginHearingCalibration" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:22px;padding:16px 64px;cursor:pointer;border-radius:4px;">OK（音が出ます）</button>
    </div>
    ${renderMobileBottomSpacer()}
  </div>`;
}

export function renderMobileCalibrate(vm: ViewModel): string {
  return `
  <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;">
    ${renderMobileTopBar(vm)}
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;text-align:center;">
      <div style="position:relative;">
        <div class="eg-play ${vm.hearCalPlayingClass}" style="width:110px;height:110px;border-radius:50%;background:var(--panel-2);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;">
          ${MOBILE_PLAY_ICON}
        </div>
        <button data-action="stopHearingTest" class="eg-btn" style="position:absolute;left:100%;top:50%;transform:translateY(-50%);margin-left:28px;white-space:nowrap;background:var(--bad);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:20px;padding:16px 24px;cursor:pointer;border-radius:4px;">■ 緊急停止</button>
      </div>
      <div style="font-size:24px;font-weight:700;">音量を調整してください</div>
      <div style="font-family:var(--font-mono);font-size:22px;color:var(--text-dim);line-height:1.9;">
        1kHzの基準音が鳴り続けています。<br/>ヘッドホン/イヤホンの音量を、無理なくはっきり聞き取れる<br/>「ちょうど良い」大きさに調整してください。<br/>調整後は測定が終わるまで機器の音量を変更しないでください。
      </div>
      <button data-action="confirmHearingCalibration" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:22px;padding:16px 64px;cursor:pointer;border-radius:4px;">この音量で測定を始める</button>
    </div>
    ${renderMobileBottomSpacer()}
  </div>`;
}

export function renderMobileMeasure(vm: ViewModel): string {
  return `
  <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;">
    ${renderMobileTopBar(vm)}
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;">
      <div style="font-family:var(--font-mono);font-size:23px;letter-spacing:1px;color:var(--text-dim);">${
        vm.hearEarLabel
      }耳 測定中 / ${vm.hearCurrentFreqLabel}</div>
      <div style="width:420px;height:8px;background:var(--panel-2);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${vm.hearProgressPct}%;background:var(--accent);transition:width 0.3s ease;"></div>
      </div>
      <div class="eg-hear-indicator" style="${breatheDelayStyle()}width:130px;height:130px;border-radius:50%;background:var(--panel-2);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;">
        ${MOBILE_PLAY_ICON}
      </div>
      <div style="display:flex;align-items:center;gap:20px;">
        <button data-action="handleHearingHeard" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:22px;padding:20px 0;width:320px;cursor:pointer;border-radius:4px;">聞こえたら押す</button>
        <button data-action="stopHearingTest" class="eg-btn" style="background:var(--bad);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:22px;padding:20px 28px;cursor:pointer;border-radius:4px;">■ 緊急停止</button>
      </div>
      <div style="font-family:var(--font-mono);font-size:19px;color:var(--text-dim);">聞こえなければ何もしなくて大丈夫です</div>
    </div>
    ${renderMobileBottomSpacer()}
  </div>`;
}

const MOBILE_GRAPH_SCALE = 1.3;
const MOBILE_GRAPH_W = 900;
// Matches the graph block's actual markup height (280 + 6 margin-top + 14 axis-
// label row = 300). Re-measured via getBoundingClientRect: the rendered content
// box is 300px almost exactly (a prior 380 here was carrying a large unexplained
// buffer that just showed up as dead space below the axis labels).
const MOBILE_GRAPH_H = 300;

export function renderMobileDone(vm: ViewModel): string {
  return `
  <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;">
    <div style="position:relative;height:${MOBILE_TOPBAR_H}px;flex-shrink:0;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;padding:0 48px;">
      ${renderMobileBackButton('goToGate', 'EXIT')}
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:26px;font-weight:700;letter-spacing:1px;">測定結果</div>
      ${
        vm.hearIsPartial
          ? `<div style="font-family:var(--font-mono);font-size:18px;color:var(--bad);letter-spacing:1px;text-align:right;">※途中で停止したため、一部の周波数は未測定です</div>`
          : ''
      }
    </div>
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
      <div style="display:flex;flex-shrink:0;align-items:center;gap:28px;font-family:var(--font-mono);font-size:20px;color:var(--text);">
        <div style="display:flex;align-items:center;gap:10px;">
          <span>Name</span>
          <input type="text" placeholder="任意" data-bind="hearReportName" style="background:var(--panel);border:1px solid var(--line);color:var(--text);font-family:var(--font-mono);font-size:20px;padding:8px 12px;border-radius:2px;outline:none;width:200px;" />
        </div>
        <div>測定日 ${vm.hearReportDate}</div>
        <button data-action="printHearingReport" class="eg-btn-pdf" style="background:transparent;border:1px solid var(--accent);color:var(--accent);padding:10px 24px;border-radius:2px;font-weight:700;letter-spacing:2px;font-size:18px;cursor:pointer;transition:border-color 0.15s ease, color 0.15s ease;">PDFで保存</button>
      </div>
      <div style="width:${MOBILE_GRAPH_W * MOBILE_GRAPH_SCALE}px;height:${MOBILE_GRAPH_H * MOBILE_GRAPH_SCALE}px;flex-shrink:0;overflow:visible;">
        <div style="width:${MOBILE_GRAPH_W}px;transform:scale(${MOBILE_GRAPH_SCALE});transform-origin:top left;">
          ${renderHearGraphBlock(vm)}
        </div>
      </div>
      <div style="display:flex;flex-shrink:0;justify-content:center;gap:28px;font-family:var(--font-mono);font-size:20px;color:var(--text-dim);margin-top:16px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;border-radius:50%;border:2px solid var(--bad);display:inline-block;"></span>右耳</div>
        <div style="display:flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;border:2px solid var(--ear-l);display:inline-block;transform:rotate(45deg);"></span>左耳</div>
      </div>
    </div>
    <div style="flex-shrink:0;text-align:center;padding-bottom:14px;font-family:var(--font-mono);font-size:15px;letter-spacing:-0.2px;color:var(--text-dim);white-space:nowrap;">※相対値による簡易チェックです。絶対的な聴力レベル(dB HL)ではなく、使用機器での聞こえ方の左右差・帯域バランスの目安としてご覧ください。医療機関の検査結果とは一致しません。</div>
  </div>`;
}
