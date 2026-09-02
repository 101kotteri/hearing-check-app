// Mobile (frame-less, native-app-preview) screens. Distinct from templates.ts's
// PC/chassis screens per explicit direction: the opening screen keeps a frame,
// everything after it (starting at the explanation/intro screen) has none, and
// text throughout is sized up for a phone held in landscape rather than a desk.

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

function renderMobileTopBar(): string {
  return `
  <div style="display:flex;align-items:center;padding:40px 48px 0;">
    <div data-action="goToGate" class="eg-link" style="cursor:pointer;display:flex;align-items:center;gap:14px;font-family:var(--font-mono);font-size:28px;letter-spacing:3px;color:var(--text-dim);">
      <svg width="22" height="22" viewBox="0 0 12 12"><path d="M8 1 L3 6 L8 11" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>
      EXIT
    </div>
  </div>`;
}

export function renderMobileIntro(): string {
  return `
  <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;">
    ${renderMobileTopBar()}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px;max-width:1180px;margin:0 auto;text-align:center;padding:0 40px;">
      <div style="font-size:44px;font-weight:700;letter-spacing:1px;">簡易聴力チェック</div>
      <div style="font-family:var(--font-mono);font-size:24px;color:var(--text-dim);line-height:2;text-align:left;">
        ・ヘッドホンまたはイヤホンを装着してください<br/>
        ・右耳→左耳の順に、低い音から高い音まで自動で測定します<br/>
        ・音が聞こえたら「聞こえたら押す」ボタンを押してください<br/>
        ・聞こえない場合は何もしなくて大丈夫です（自動的に次に進みます）<br/>
        ・所要時間の目安は3〜5分です<br/>
        ・体調に異変を感じたら、いつでも「緊急停止」で中断できます
      </div>
      <div style="font-family:var(--font-mono);font-size:20px;color:var(--text-dim);line-height:1.8;">※使用機器の音量設定に依存する相対的な簡易チェックです。医療機関の聴力検査の代わりにはなりません。</div>
      <button data-action="goToHearSetup" class="eg-btn" style="background:var(--accent);color:var(--bg);border:none;font-weight:700;letter-spacing:2px;font-size:24px;padding:24px 72px;cursor:pointer;border-radius:4px;">はじめる</button>
    </div>
  </div>`;
}
