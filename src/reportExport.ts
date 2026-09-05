// Native-app PDF/PNG export for the results-screen report, used only when
// running inside the Capacitor iOS app (see app.ts's printHearingReport,
// which still calls the browser's own window.print() unchanged for the
// plain WebApp — that flow works today and isn't touched here). A bare
// WKWebView doesn't get a print dialog for free the way a full browser
// does, and per explicit direction the native app doesn't need print
// support at all — just handing the user a PDF file (Files app) and a PNG
// image (Photos) via the standard iOS share sheet.
//
// Both formats are rendered from the same Canvas 2D drawing (drawCanvasReport)
// rather than jsPDF's own vector text primitives: jsPDF's built-in fonts
// (helvetica etc.) only cover Latin/WinAnsi glyphs, so ja/zh/ko report text
// came out as mojibake when drawn directly with doc.text(). Canvas 2D uses
// the WebView's real system fonts (CJK-capable), so the PDF embeds that
// canvas as a single full-page image instead of redrawing it in PDF vector
// primitives — this sidesteps the font problem entirely and there's only
// one drawing routine to keep in sync.
import { jsPDF } from 'jspdf';
import type { ViewModel } from './viewModel';

// Matches viewModel.ts's own (private) HEAR_GRAPH_W/H — the coordinate
// space vm.hearGraph's points/paths and vm.hearDbTicks are already
// expressed in, shared with the on-screen graph and the web print report.
const GRAPH_W = 860;
const GRAPH_H = 280;
const LEFT_AXIS_W = 40;
const AXIS_LABEL_H = 14;
const PAD = 32;
const TOTAL_W = LEFT_AXIS_W + GRAPH_W + PAD * 2; // 964
const TOTAL_H = 560;

const COLOR_RIGHT = '#c0392b';
const COLOR_LEFT = '#2255aa';
const COLOR_GRID = '#d0d0d0';
const COLOR_REF = '#999999';
const COLOR_TEXT = '#111111';
const COLOR_DIM = '#666666';

function reportFilenameBase(vm: ViewModel): string {
  return `hearing-check-${vm.hearReportDate}`;
}

// ---- Canvas (PNG) ----------------------------------------------------

function drawCanvasReport(ctx: CanvasRenderingContext2D, vm: ViewModel): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);
  ctx.textBaseline = 'alphabetic';

  let y = PAD;
  ctx.fillStyle = COLOR_TEXT;
  ctx.font = "bold 20px 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', sans-serif";
  ctx.fillText(vm.t('print.title'), PAD, y + 20);
  y += 20 + 8;

  ctx.fillStyle = COLOR_DIM;
  ctx.font = "11px 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', sans-serif";
  ctx.fillText(`HEARING CHECK ${vm.t('print.subtitle')}`, PAD, y + 11);
  y += 11 + 20;

  ctx.fillStyle = COLOR_TEXT;
  ctx.font = "12px 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', sans-serif";
  ctx.fillText(`Name: ${vm.hearReportNameDisplay}`, PAD, y + 12);
  ctx.fillText(`${vm.t('done.date')}: ${vm.hearReportDate}`, PAD + 220, y + 12);
  y += 12 + 20;

  const graphTop = y;
  const graphLeft = PAD + LEFT_AXIS_W;

  // dB axis labels (left of the graph box)
  ctx.fillStyle = COLOR_DIM;
  ctx.font = "9px 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', sans-serif";
  for (const tick of vm.hearDbTicks) {
    ctx.fillText(tick.label, PAD, graphTop + tick.y + 3);
  }

  // graph box border
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.strokeRect(graphLeft + 0.5, graphTop + 0.5, GRAPH_W, GRAPH_H);

  // gridlines
  ctx.strokeStyle = COLOR_GRID;
  for (const tick of vm.hearGraph.graphTicks) {
    ctx.beginPath();
    ctx.moveTo(graphLeft + tick.x, graphTop);
    ctx.lineTo(graphLeft + tick.x, graphTop + GRAPH_H);
    ctx.stroke();
  }
  for (const tick of vm.hearDbTicks) {
    ctx.beginPath();
    ctx.moveTo(graphLeft, graphTop + tick.y);
    ctx.lineTo(graphLeft + GRAPH_W, graphTop + tick.y);
    ctx.stroke();
  }

  // 0dB reference line
  ctx.strokeStyle = COLOR_REF;
  ctx.beginPath();
  ctx.moveTo(graphLeft, graphTop + vm.hearRefLineY);
  ctx.lineTo(graphLeft + GRAPH_W, graphTop + vm.hearRefLineY);
  ctx.stroke();

  // ear paths + points
  drawEarSeries(ctx, vm.hearGraph.rightPoints, graphLeft, graphTop, COLOR_RIGHT, 'circle');
  drawEarSeries(ctx, vm.hearGraph.leftPoints, graphLeft, graphTop, COLOR_LEFT, 'diamond');

  // frequency axis labels
  ctx.fillStyle = COLOR_DIM;
  ctx.font = "9px 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', sans-serif";
  ctx.textAlign = 'center';
  for (const tick of vm.hearGraph.graphTicks) {
    ctx.fillText(tick.label, graphLeft + tick.x, graphTop + GRAPH_H + AXIS_LABEL_H + 6);
  }
  ctx.textAlign = 'left';

  y = graphTop + GRAPH_H + AXIS_LABEL_H + 6 + 18;

  // legend
  ctx.font = "11px 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', sans-serif";
  ctx.fillStyle = COLOR_TEXT;
  drawLegendMark(ctx, PAD, y - 4, COLOR_RIGHT, 'circle');
  ctx.fillText(vm.t('ear.right'), PAD + 16, y);
  const leftEarX = PAD + 120;
  drawLegendMark(ctx, leftEarX, y - 4, COLOR_LEFT, 'diamond');
  ctx.fillText(vm.t('ear.left'), leftEarX + 16, y);
  y += 11 + 16;

  // disclaimer (wrapped)
  ctx.fillStyle = COLOR_DIM;
  ctx.font = "10px 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', sans-serif";
  y = drawWrappedText(ctx, vm.t('print.disclaimer'), PAD, y, TOTAL_W - PAD * 2, 16);
}

function drawEarSeries(
  ctx: CanvasRenderingContext2D,
  points: ViewModel['hearGraph']['rightPoints'],
  offsetX: number,
  offsetY: number,
  color: string,
  shape: 'circle' | 'diamond'
): void {
  if (points.length > 0) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((pt, i) => {
      const x = offsetX + pt.x;
      const yPos = offsetY + pt.y;
      if (i === 0) ctx.moveTo(x, yPos);
      else ctx.lineTo(x, yPos);
    });
    ctx.stroke();
  }
  for (const pt of points) {
    const x = offsetX + pt.x;
    const yPos = offsetY + pt.y;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(x, yPos, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.save();
      ctx.translate(x, yPos);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-4, -4, 8, 8);
      ctx.restore();
    }
    if (pt.noResponse) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, yPos + 8);
      ctx.lineTo(x, yPos + 18);
      ctx.moveTo(x - 5, yPos + 13);
      ctx.lineTo(x, yPos + 18);
      ctx.lineTo(x + 5, yPos + 13);
      ctx.stroke();
    }
  }
}

function drawLegendMark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, shape: 'circle' | 'diamond'): void {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x + 5, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.save();
    ctx.translate(x + 5, y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-3.5, -3.5, 7, 7);
    ctx.restore();
  }
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  // Word-based wrapping only makes sense for space-delimited scripts; for
  // ja/zh (no spaces) this still works acceptably since a "word" ends up
  // being one or a few characters at a time between punctuation, wrapping
  // character-by-character in effect.
  const words = text.split(/(\s+)/);
  let line = '';
  let y = startY;
  for (const word of words) {
    const test = line + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, y);
    y += lineHeight;
  }
  return y;
}

function renderReportCanvas(vm: ViewModel, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TOTAL_W * scale;
  canvas.height = TOTAL_H * scale;
  // { alpha: false } drops the canvas's alpha channel — the report is a fully
  // opaque white page, but without this the PNG encoder still writes an RGBA
  // image (and jsPDF has to embed a separate soft-mask for it), which was
  // most of what made the PDF balloon to several MB.
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.scale(scale, scale);
  drawCanvasReport(ctx, vm);
  return canvas;
}

export function generateReportPngDataUrl(vm: ViewModel): string {
  return renderReportCanvas(vm, 2).toDataURL('image/png');
}

// ---- jsPDF (PDF) -------------------------------------------------------
// See the file-level comment: this embeds the same Canvas 2D render as a
// full-page image rather than redrawing text with jsPDF's own (CJK-less)
// vector fonts.

export function generateReportPdfDataUri(vm: ViewModel): string {
  // Lower supersample than the PNG (which needs to look crisp zoomed in on a
  // Retina photo viewer): the PDF page is already sized in points to match
  // TOTAL_W/TOTAL_H 1:1, so 1.5x is plenty sharp and keeps the embedded
  // bitmap well under half the pixel count of a 2x render.
  const canvas = renderReportCanvas(vm, 1.5);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [TOTAL_W, TOTAL_H] });
  // jsPDF's PNG embedding stores the bitmap close to raw (its own re-encoder
  // doesn't compress well), which is what actually made the PDF several MB —
  // JPEG gives real entropy-coded compression and this page has no
  // transparency to lose, so the quality tradeoff is invisible at this size.
  doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, TOTAL_W, TOTAL_H);
  return doc.output('datauristring');
}

export function reportFilenames(vm: ViewModel): { png: string; pdf: string } {
  const base = reportFilenameBase(vm);
  return { png: `${base}.png`, pdf: `${base}.pdf` };
}
