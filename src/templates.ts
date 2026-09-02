import type { AppState } from './types';
import type { ViewModel } from './viewModel';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EAR_WAVE_ICON = `
  <svg width="132" height="120" viewBox="0 0 110 100" fill="none">
    <path d="M13.5 40.25 C 24.75 40.25 24.75 64.75 13.5 64.75" stroke="var(--accent)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.5"/>
    <path d="M20.75 30 C 41.35 30 41.35 75 20.75 75" stroke="var(--accent)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.5"/>
    <circle cx="5" cy="52.5" r="4.5" fill="var(--accent)" opacity="0.5"/>
    <path d="M70 15 C 50 20 45 45 55 65 C 62.5 80 80 87.5 95 82.5 C 105 78.75 110 67.5 105 60" stroke="var(--accent)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M75 30 C 62.5 32.5 60 47.5 67.5 57.5 C 72.5 65 82.5 67.5 90 62.5" stroke="var(--accent)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="85" cy="52.5" r="4.5" fill="var(--accent)"/>
  </svg>`;

const PLAY_ICON = `<svg width="26" height="26" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3z" fill="var(--accent)"/></svg>`;
const PLAY_ICON_SMALL = `<svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3z" fill="var(--accent)"/></svg>`;
const BACK_ICON = `<svg width="10" height="10" viewBox="0 0 12 12"><path d="M8 1 L3 6 L8 11" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;
const NO_RESPONSE_ARROW = `<path d="M7 1 L7 11 M2 7 L7 12 L12 7" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

function renderGate(s: AppState): string {
  return `
  <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
      ${EAR_WAVE_ICON}
      <div style="font-family:var(--font-mono);font-size:12px;letter-spacing:5px;color:var(--text-dim);">AUDIOMETRIC SELF-TEST</div>
      <div style="font-size:38px;font-weight:700;letter-spacing:6px;">HEARING CHECK</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:320px;">
      <input type="password" placeholder="PASSWORD" data-bind="password" data-enter-action="submitPassword" value="${escapeHtml(
        s.password
      )}" style="width:100%;background:var(--panel);border:1px solid var(--line);color:var(--text);font-family:var(--font-mono);font-size:14px;letter-spacing:3px;padding:15px 16px;text-align:center;outline:none;border-radius:2px;" />
      <button data-action="submitPassword" class="eg-btn" style="width:100%;background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:3px;font-size:13px;padding:15px 0;cursor:pointer;border-radius:2px;">SUBMIT</button>
      ${
        s.passwordError
          ? `<div style="color:var(--bad);font-family:var(--font-mono);font-size:12px;letter-spacing:1px;">パスワードが違います</div>`
          : ''
      }
    </div>
  </div>`;
}

function renderHearTopBar(vm: ViewModel): string {
  const backAction = vm.isHearCalibrate ? 'goBackToHearSetup' : 'goToGate';
  const backLabel = vm.isHearCalibrate ? '戻る' : 'EXIT';
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;height:14px;">
    <div data-action="${backAction}" class="eg-link" style="cursor:pointer;display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:12px;letter-spacing:2px;color:var(--text-dim);">
      ${BACK_ICON}
      ${backLabel}
    </div>
    <div style="font-family:var(--font-mono);font-size:12px;letter-spacing:4px;color:var(--text-dim);">聴力チェック</div>
    ${
      vm.hearShowStop
        ? `<div data-action="stopHearingTest" class="eg-link" style="cursor:pointer;font-family:var(--font-mono);font-size:12px;letter-spacing:2px;color:var(--bad);">■ 緊急停止</div>`
        : `<div style="width:70px;"></div>`
    }
  </div>`;
}

function renderHearIntro(): string {
  return `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;max-width:620px;margin:0 auto;text-align:center;">
    <div style="font-size:24px;font-weight:700;letter-spacing:1px;">簡易聴力チェック</div>
    <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);line-height:2.1;text-align:left;">
      ・ヘッドホンまたはイヤホンを装着してください<br/>
      ・右耳→左耳の順に、低い音から高い音まで自動で測定します<br/>
      ・音が聞こえたら「聞こえたら押す（Spaceキー）」ボタンを押してください<br/>
      ・聞こえない場合は何もしなくて大丈夫です（自動的に次に進みます）<br/>
      ・所要時間の目安は3〜5分です<br/>
      ・体調に異変を感じたら、いつでも「緊急停止」で中断できます
    </div>
    <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);line-height:1.8;white-space:nowrap;">※使用機器の音量設定に依存する相対的な簡易チェックです。医療機関の聴力検査の代わりにはなりません。</div>
    <button data-action="goToHearSetup" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:13px;padding:14px 48px;cursor:pointer;border-radius:2px;">はじめる</button>
  </div>`;
}

function renderHearSetup(vm: ViewModel): string {
  const deviceButtons = vm.hearDeviceOptions
    .map(
      (opt) =>
        `<button data-action="selectHearDeviceType" data-value="${opt.id}" style="background:${
          opt.active ? 'var(--panel-2)' : 'transparent'
        };border:1px solid ${opt.active ? 'var(--accent)' : 'var(--line)'};color:${
          opt.active ? 'var(--accent)' : 'var(--text-dim)'
        };padding:12px 28px;border-radius:2px;font-weight:700;letter-spacing:1px;font-size:13px;cursor:pointer;font-family:var(--font-mono);">${
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
        };padding:12px 20px;border-radius:2px;font-weight:700;letter-spacing:0.5px;font-size:12px;cursor:pointer;font-family:var(--font-mono);white-space:pre-line;line-height:1.6;">${escapeHtml(
          opt.label
        )}</button>`
    )
    .join('');
  return `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;max-width:600px;margin:0 auto;text-align:center;">
    <div style="font-size:20px;font-weight:700;letter-spacing:1px;">測定環境を選択してください</div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
      <div style="font-family:var(--font-mono);font-size:12px;letter-spacing:1px;color:var(--text-dim);">再生機器</div>
      <div style="display:flex;gap:10px;">${deviceButtons}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
      <div style="font-family:var(--font-mono);font-size:12px;letter-spacing:1px;color:var(--text-dim);">音質の特性</div>
      <div style="display:flex;gap:10px;">${listeningButtons}</div>
    </div>
    <button data-action="beginHearingCalibration" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:13px;padding:14px 48px;cursor:pointer;border-radius:2px;margin-top:8px;">OK（音が出ます）</button>
  </div>`;
}

function renderHearCalibrate(vm: ViewModel): string {
  return `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;max-width:560px;margin:0 auto;text-align:center;">
    <div class="eg-play ${vm.hearCalPlayingClass}" style="width:100px;height:100px;border-radius:50%;background:var(--panel-2);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;">
      ${PLAY_ICON}
    </div>
    <div style="font-size:16px;font-weight:700;">音量を調整してください</div>
    <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);line-height:2;">
      1kHzの基準音が鳴り続けています。<br/>ヘッドホン/イヤホンの音量を、無理なくはっきり聞き取れる<br/>「ちょうど良い」大きさに調整してください。<br/>調整後は測定が終わるまで機器の音量を変更しないでください。
    </div>
    <button data-action="confirmHearingCalibration" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:13px;padding:14px 48px;cursor:pointer;border-radius:2px;">この音量で測定を始める</button>
  </div>`;
}

// The breathing indicator's DOM node gets recreated on every re-render (a trial
// starting/ending re-renders the measure screen), which would normally restart
// the CSS animation from its dark starting frame every time — visible as a jarring
// flash in sync with audio. Locking animation-delay to the wall clock keeps the
// animation's phase continuous across re-renders instead, independent of audio state.
const BREATHE_CYCLE_MS = 3600;
export function breatheDelayStyle(): string {
  const phaseSec = (Date.now() % BREATHE_CYCLE_MS) / 1000;
  return `animation-delay:-${phaseSec.toFixed(3)}s;`;
}

function renderHearMeasure(vm: ViewModel): string {
  return `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;">
    <div style="font-family:var(--font-mono);font-size:13px;letter-spacing:2px;color:var(--text-dim);">${
      vm.hearEarLabel
    }耳 測定中 / ${vm.hearCurrentFreqLabel}</div>
    <div style="width:360px;height:6px;background:var(--panel-2);border-radius:3px;overflow:hidden;">
      <div style="height:100%;width:${vm.hearProgressPct}%;background:var(--accent);transition:width 0.3s ease;"></div>
    </div>
    <div class="eg-hear-indicator" style="${breatheDelayStyle()}width:120px;height:120px;border-radius:50%;background:var(--panel-2);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;">
      ${PLAY_ICON_SMALL}
    </div>
    <div style="display:flex;align-items:center;gap:16px;">
      <button data-action="handleHearingHeard" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:14px;padding:16px 0;width:260px;cursor:pointer;border-radius:2px;">聞こえたら押す（Spaceキー）</button>
      <button data-action="stopHearingTest" class="eg-btn" style="background:var(--bad);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:14px;padding:16px 24px;cursor:pointer;border-radius:2px;">■ 緊急停止</button>
    </div>
    <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">聞こえなければ何もしなくて大丈夫です</div>
  </div>`;
}

// The graph block (frequency/dB axes + both ears' points+path), shared as-is
// between the PC results screen and the mobile results screen (which wraps
// this same 900px-wide markup in a CSS scale transform to enlarge it, rather
// than recomputing the underlying HEAR_GRAPH_W/H coordinate system, which
// print also depends on).
export function renderHearGraphBlock(vm: ViewModel): string {
  const dbTicksLeft = vm.hearDbTicks
    .map((t) => `<div style="position:absolute;top:${t.y}px;left:0;transform:translateY(-50%);">${t.label}</div>`)
    .join('');
  const gridVLines = vm.hearGraph.graphTicks
    .map((t) => `<div style="position:absolute;left:${t.x}px;top:0;bottom:0;width:1px;background:var(--line);opacity:0.4;"></div>`)
    .join('');
  const gridHLines = vm.hearDbTicks
    .map((t) => `<div style="position:absolute;left:0;top:${t.y}px;width:100%;height:1px;background:var(--line);opacity:0.4;"></div>`)
    .join('');
  const rightPoints = vm.hearGraph.rightPoints
    .map(
      (pt) => `
      <div style="position:absolute;left:${pt.x}px;top:${pt.y}px;width:11px;height:11px;border-radius:50%;border:2px solid var(--bad);background:var(--panel);transform:translate(-50%,-50%);"></div>
      ${
        pt.noResponse
          ? `<svg width="14" height="16" viewBox="0 0 14 16" style="position:absolute;left:${pt.x}px;top:${pt.y}px;transform:translate(-50%,2px);pointer-events:none;">${NO_RESPONSE_ARROW.replace(
              'stroke-width="2"',
              'stroke="var(--bad)" stroke-width="2"'
            )}</svg>`
          : ''
      }`
    )
    .join('');
  const leftPoints = vm.hearGraph.leftPoints
    .map(
      (pt) => `
      <div style="position:absolute;left:${pt.x}px;top:${pt.y}px;width:11px;height:11px;transform:translate(-50%,-50%) rotate(45deg);">
        <div style="position:absolute;left:50%;top:0;width:2px;height:100%;background:var(--ear-l);transform:translateX(-50%);"></div>
        <div style="position:absolute;top:50%;left:0;height:2px;width:100%;background:var(--ear-l);transform:translateY(-50%);"></div>
      </div>
      ${
        pt.noResponse
          ? `<svg width="14" height="16" viewBox="0 0 14 16" style="position:absolute;left:${pt.x}px;top:${pt.y}px;transform:translate(-50%,2px);pointer-events:none;">${NO_RESPONSE_ARROW.replace(
              'stroke-width="2"',
              'stroke="var(--ear-l)" stroke-width="2"'
            )}</svg>`
          : ''
      }`
    )
    .join('');
  const axisLabelsBottom = vm.hearGraph.graphTicks
    .map(
      (t) =>
        `<div style="position:absolute;left:${t.x}px;transform:translateX(-50%);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);white-space:nowrap;">${t.label}</div>`
    )
    .join('');

  return `
  <div style="width:900px;">
    <div style="display:flex;">
      <div style="width:40px;height:280px;position:relative;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${dbTicksLeft}</div>
      <div style="flex:1;height:280px;position:relative;background:var(--panel);border:1px solid var(--line);border-radius:4px;overflow:hidden;">
        ${gridVLines}
        ${gridHLines}
        <div style="position:absolute;left:0;top:${vm.hearRefLineY}px;width:100%;height:1px;background:var(--accent);opacity:0.5;"></div>
        <svg width="860" height="280" viewBox="0 0 860 280" style="position:absolute;top:0;left:0;pointer-events:none;">
          <path d="${vm.hearGraph.rightPath}" stroke="var(--bad)" stroke-width="2" fill="none"/>
          <path d="${vm.hearGraph.leftPath}" stroke="var(--ear-l)" stroke-width="2" fill="none"/>
        </svg>
        ${rightPoints}
        ${leftPoints}
      </div>
    </div>
    <div style="margin-left:40px;position:relative;height:14px;margin-top:6px;">${axisLabelsBottom}</div>
  </div>`;
}

function renderHearDone(vm: ViewModel): string {
  return `
  <div style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;gap:18px;padding:8px 0 16px;">
    <div style="font-family:var(--font-mono);font-size:13px;letter-spacing:4px;color:var(--text-dim);">測定結果</div>
    ${
      vm.hearIsPartial
        ? `<div style="font-family:var(--font-mono);font-size:11px;color:var(--bad);letter-spacing:1px;">※途中で停止したため、一部の周波数は未測定です</div>`
        : ''
    }
    <div style="display:flex;align-items:center;gap:24px;font-family:var(--font-mono);font-size:15px;color:var(--text);">
      <div style="display:flex;align-items:center;gap:8px;">
        <span>Name</span>
        <input type="text" placeholder="任意" data-bind="hearReportName" style="background:var(--panel);border:1px solid var(--line);color:var(--text);font-family:var(--font-mono);font-size:14px;padding:8px 10px;border-radius:2px;outline:none;width:160px;" />
      </div>
      <div>測定日 ${vm.hearReportDate}</div>
      <button data-action="printHearingReport" class="eg-btn-pdf" style="background:transparent;padding:10px 24px;border-radius:2px;font-weight:700;letter-spacing:2px;font-size:12px;cursor:pointer;transition:border-color 0.15s ease, color 0.15s ease;">PDFで保存</button>
    </div>
    ${renderHearGraphBlock(vm)}
    <div style="display:flex;justify-content:center;gap:24px;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
      <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;border:2px solid var(--bad);display:inline-block;"></span>右耳</div>
      <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border:2px solid var(--ear-l);display:inline-block;transform:rotate(45deg);"></span>左耳</div>
    </div>
    <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);max-width:700px;text-align:center;line-height:1.8;">※相対値による簡易チェックです。絶対的な聴力レベル(dB HL)ではなく、使用機器での聞こえ方の左右差・帯域バランスの目安としてご覧ください。医療機関の検査結果とは一致しません。</div>
  </div>`;
}

// Rendered into a top-level #print-root element, OUTSIDE the chassis's scaled/
// clipped wrapper hierarchy (see chassis.ts) — printing it from inside that
// hierarchy left leftover chassis background/backgrop and mis-scoped
// position:absolute coordinates. This is a plain, unscaled, unclipped element.
export function renderPrintReport(vm: ViewModel): string {
  const dbTicksLeftPrint = vm.hearDbTicks
    .map((t) => `<div style="position:absolute;top:${t.y}px;left:0;transform:translateY(-50%);">${t.label}</div>`)
    .join('');
  const printGridV = vm.hearGraph.graphTicks
    .map((t) => `<div style="position:absolute;left:${t.x}px;top:0;bottom:0;width:1px;background:#e0e0e0;"></div>`)
    .join('');
  const printGridH = vm.hearDbTicks
    .map((t) => `<div style="position:absolute;left:0;top:${t.y}px;width:100%;height:1px;background:#e0e0e0;"></div>`)
    .join('');
  const printRightPoints = vm.hearGraph.rightPoints
    .map(
      (pt) => `
      <div style="position:absolute;left:${pt.x}px;top:${pt.y}px;width:11px;height:11px;border-radius:50%;border:2px solid #c0392b;background:#fff;transform:translate(-50%,-50%);"></div>
      ${
        pt.noResponse
          ? `<svg width="14" height="16" viewBox="0 0 14 16" style="position:absolute;left:${pt.x}px;top:${pt.y}px;transform:translate(-50%,2px);pointer-events:none;"><path d="M7 1 L7 11 M2 7 L7 12 L12 7" stroke="#c0392b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : ''
      }`
    )
    .join('');
  const printLeftPoints = vm.hearGraph.leftPoints
    .map(
      (pt) => `
      <div style="position:absolute;left:${pt.x}px;top:${pt.y}px;width:11px;height:11px;transform:translate(-50%,-50%) rotate(45deg);">
        <div style="position:absolute;left:50%;top:0;width:2px;height:100%;background:#2255aa;transform:translateX(-50%);"></div>
        <div style="position:absolute;top:50%;left:0;height:2px;width:100%;background:#2255aa;transform:translateY(-50%);"></div>
      </div>
      ${
        pt.noResponse
          ? `<svg width="14" height="16" viewBox="0 0 14 16" style="position:absolute;left:${pt.x}px;top:${pt.y}px;transform:translate(-50%,2px);pointer-events:none;"><path d="M7 1 L7 11 M2 7 L7 12 L12 7" stroke="#2255aa" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : ''
      }`
    )
    .join('');
  const printAxisLabels = vm.hearGraph.graphTicks
    .map(
      (t) =>
        `<div style="position:absolute;left:${t.x}px;transform:translateX(-50%);font-size:9px;color:#666;white-space:nowrap;">${t.label}</div>`
    )
    .join('');

  return `
  <div class="eg-print-report" style="background:#ffffff;color:#111111;font-family:var(--font-mono);padding:32px;">
    <div style="font-size:20px;font-weight:700;letter-spacing:2px;margin-bottom:4px;">聴力チェック 測定結果</div>
    <div style="font-size:11px;color:#666;letter-spacing:1px;margin-bottom:20px;">HEARING CHECK 簡易セルフチェック（相対値）</div>
    <div style="display:flex;gap:32px;font-size:12px;margin-bottom:20px;">
      <div>Name: ${escapeHtml(vm.hearReportNameDisplay)}</div>
      <div>測定日: ${vm.hearReportDate}</div>
    </div>
    <div style="width:900px;">
      <div style="display:flex;">
        <div style="width:40px;height:280px;position:relative;font-size:9px;color:#666;">${dbTicksLeftPrint}</div>
        <div style="width:860px;height:280px;position:relative;border:1px solid #ccc;overflow:hidden;">
          ${printGridV}
          ${printGridH}
          <div style="position:absolute;left:0;top:${vm.hearRefLineY}px;width:100%;height:1px;background:#999;"></div>
          <svg width="860" height="280" viewBox="0 0 860 280" style="position:absolute;top:0;left:0;">
            <path d="${vm.hearGraph.rightPath}" stroke="#c0392b" stroke-width="2" fill="none"/>
            <path d="${vm.hearGraph.leftPath}" stroke="#2255aa" stroke-width="2" fill="none"/>
          </svg>
          ${printRightPoints}
          ${printLeftPoints}
        </div>
      </div>
      <div style="margin-left:40px;position:relative;height:14px;margin-top:6px;">${printAxisLabels}</div>
    </div>
    <div style="display:flex;gap:24px;font-size:11px;color:#333;margin-top:18px;">
      <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;border:2px solid #c0392b;display:inline-block;"></span>右耳</div>
      <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border:2px solid #2255aa;display:inline-block;transform:rotate(45deg);"></span>左耳</div>
    </div>
    <div style="font-size:10px;color:#666;line-height:1.8;margin-top:16px;">※相対値による簡易チェックです。絶対的な聴力レベル(dB HL)ではなく、使用機器での聞こえ方の左右差・帯域バランスの目安です。医療機関の検査結果とは一致しません。</div>
  </div>`;
}

export function renderScreenContent(s: AppState, vm: ViewModel): string {
  if (vm.isGate) return renderGate(s);

  let stepHtml = '';
  if (vm.isHearIntro) stepHtml = renderHearIntro();
  else if (vm.isHearSetup) stepHtml = renderHearSetup(vm);
  else if (vm.isHearCalibrate) stepHtml = renderHearCalibrate(vm);
  else if (vm.isHearMeasure) stepHtml = renderHearMeasure(vm);
  else if (vm.isHearDone) stepHtml = renderHearDone(vm);

  return `
  <div style="position:relative;width:100%;height:100%;box-sizing:border-box;padding:24px 56px;display:flex;flex-direction:column;">
    ${renderHearTopBar(vm)}
    ${stepHtml}
  </div>`;
}
