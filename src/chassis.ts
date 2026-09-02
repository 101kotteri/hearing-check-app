// Static outer casing markup (the "hardware" chassis around the screen).
// Ported 1:1 from design/HearingCheck.dc.html's non-reactive decorative markup.
// Rendered once at startup; screen content mounts into #screen-root.

const BUTTON_STYLE =
  'width:30px;height:22px;border-radius:4px;background:linear-gradient(180deg, oklch(0.97 0.003 250) 0%, oklch(0.88 0.006 250) 45%, oklch(0.76 0.01 250) 100%);border:1px solid oklch(0.66 0.012 250);box-shadow:0 3px 0 oklch(0.52 0.015 250), 0 5px 7px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.85), inset 0 -2px 2px oklch(0.6 0.01 250 / 0.4);';

function knobStyle(rotateDeg: number): string {
  return `position:absolute;left:50%;top:10%;width:2px;height:34%;background:oklch(0.32 0.01 250);border-radius:1px;transform-origin:50% 100%;transform:translateX(-50%) rotate(${rotateDeg}deg);`;
}

export function renderChassis(): string {
  const buttons = Array.from({ length: 12 }, () => `<div style="${BUTTON_STYLE}"></div>`).join('');
  const knobAngles = [-30, 10, 45];
  const knobs = knobAngles
    .map(
      (deg) =>
        `<div style="width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 35% 30%, oklch(0.97 0.004 250), oklch(0.74 0.01 250) 80%);border:1px solid oklch(0.6 0.012 250);box-shadow:0 4px 0 oklch(0.5 0.015 250), 0 7px 9px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.85);position:relative;">
          <div style="${knobStyle(deg)}"></div>
        </div>`
    )
    .join('');

  return `
  <div style="width:1504px;height:838px;background:linear-gradient(150deg, var(--frame-1) 0%, var(--frame-2) 65%, oklch(0.27 0.06 270) 100%);position:relative;border-radius:26px;box-shadow:0 24px 70px rgba(0,0,0,0.5), inset 0 2px 0 oklch(0.75 0.03 260 / 0.3), inset 0 -8px 16px rgba(0,0,0,0.42), inset 8px 0 16px rgba(0,0,0,0.16), inset -8px 0 16px rgba(0,0,0,0.16);font-family:var(--font-display);">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 700px 400px at 18% 0%, oklch(0.5 0.03 240 / 0.22), transparent 60%);border-radius:26px;pointer-events:none;"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 480px 260px at 93% 4%, oklch(0.75 0.02 260 / 0.11), transparent 55%);border-radius:26px;pointer-events:none;"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 420px 220px at 5% 97%, oklch(0.68 0.02 260 / 0.08), transparent 55%);border-radius:26px;pointer-events:none;"></div>
    <div style="position:absolute;inset:0;border-radius:26px;border:1px solid oklch(0.5 0.02 240 / 0.18);pointer-events:none;"></div>

    <div style="position:absolute;top:26px;left:34px;display:flex;align-items:center;gap:10px;pointer-events:none;">
      <div style="width:9px;height:9px;border-radius:50%;background:var(--frame-led);box-shadow:0 0 8px 2px oklch(0.78 0.13 220 / 0.65);"></div>
      <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:3px;color:var(--frame-dim);">READY</div>
    </div>

    <div style="position:absolute;bottom:24px;right:40px;text-align:right;pointer-events:none;">
      <div style="font-size:17px;font-weight:700;letter-spacing:3px;color:var(--frame-text);">HEARING CHECK</div>
      <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:2.5px;color:var(--frame-dim);margin-top:2px;">MODEL HC-1 · AUDIOMETRIC SELF-TEST</div>
    </div>

    <div style="position:absolute;top:50px;left:90px;width:1324px;height:595px;background:var(--frame-bezel);border-radius:16px;box-shadow:inset 0 6px 20px rgba(0,0,0,0.9), inset 0 -5px 15px rgba(0,0,0,0.7), inset 6px 0 15px rgba(0,0,0,0.6), inset -6px 0 15px rgba(0,0,0,0.6), 0 1px 0 oklch(0.5 0.03 240 / 0.15), 0 0 28px 8px rgba(0,0,0,0.55);padding:14px;overflow:hidden;">
      <div style="width:1296px;height:567px;overflow:hidden;border-radius:6px;position:relative;">
        <div style="width:1440px;height:630px;transform:scale(0.9);transform-origin:top left;background:var(--bg);color:var(--text);font-family:var(--font-display);position:relative;overflow:hidden;">
          <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(0deg, transparent, transparent 39px, var(--line) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, var(--line) 40px);opacity:0.2;pointer-events:none;"></div>

          <div id="screen-root" style="position:relative;width:100%;height:100%;"></div>

          <div style="position:absolute;inset:0;pointer-events:none;background-image:repeating-linear-gradient(0deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, transparent 1px, transparent 3px);"></div>
          <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(135deg, rgba(255,255,255,0.045) 0%, transparent 32%);"></div>
        </div>
      </div>
    </div>

    <div style="position:absolute;top:657px;left:277px;width:950px;height:1px;background:oklch(0.5 0.02 240 / 0.25);pointer-events:none;"></div>

    <div style="position:absolute;top:677px;left:0;width:1504px;display:flex;justify-content:center;gap:9px;pointer-events:none;">${buttons}</div>

    <div style="position:absolute;top:714px;left:0;width:1504px;display:flex;justify-content:center;align-items:center;gap:60px;pointer-events:none;">${knobs}</div>
  </div>`;
}

export const PC_CHASSIS_W = 1504;
export const PC_CHASSIS_H = 838;

// The mobile app has no decorative casing (per direction: opening screen keeps
// the frame, everything after it is frame-less) — just the same 1440x630
// screen canvas every template already assumes, at native 1:1 scale, with
// #app itself fit-scaled to the device viewport (see main.ts).
export const MOBILE_CHASSIS_W = 1440;
export const MOBILE_CHASSIS_H = 630;

export function renderMobileRoot(): string {
  return `
  <div style="width:${MOBILE_CHASSIS_W}px;height:${MOBILE_CHASSIS_H}px;background:var(--bg);color:var(--text);font-family:var(--font-display);position:relative;overflow:hidden;">
    <div id="screen-root" style="position:relative;width:100%;height:100%;"></div>
  </div>`;
}
