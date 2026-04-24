/**
 * generate-report.js — генерирует PDF-отчёт из Playwright results.json
 * Запускать из папки tests/ (там есть node_modules с playwright-core):
 *   node ../scripts/generate-report.js
 */
const fs = require('fs');
const path = require('path');

const REPORT_PATH = process.env.REPORT_PATH || '/tmp/fms-tests/results.json';
const PDF_OUTPUT  = process.env.PDF_OUTPUT  || '/tmp/fms-tests/report.pdf';

if (!fs.existsSync(REPORT_PATH)) {
  console.log('Отчёт не найден:', REPORT_PATH, '— пропускаем генерацию PDF');
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));

// Собираем все specs: { moduleName, spec }
function collectSpecs(suite) {
  const items = [];
  if (suite.specs?.length) {
    for (const spec of suite.specs) {
      items.push({ moduleName: suite.title, spec });
    }
  }
  if (suite.suites?.length) {
    for (const sub of suite.suites) {
      items.push(...collectSpecs(sub));
    }
  }
  return items;
}
const allItems = report.suites.flatMap(s => collectSpecs(s));

// Статистика
const passed  = allItems.filter(({ spec }) => spec.tests?.[0]?.results?.[0]?.status === 'passed').length;
const failed  = allItems.filter(({ spec }) => spec.tests?.[0]?.results?.[0]?.status === 'failed').length;
const total   = allItems.length;
const durMin  = ((report.stats?.duration || 0) / 60000).toFixed(1);

// Временная метка МСК (UTC+3)
const msk = new Date(Date.now() + 3 * 3600 * 1000);
const pad = n => String(n).padStart(2, '0');
const timestamp = `${msk.getUTCFullYear()}-${pad(msk.getUTCMonth()+1)}-${pad(msk.getUTCDate())} `
                + `${pad(msk.getUTCHours())}:${pad(msk.getUTCMinutes())} МСК`;

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function screenshotB64(spec) {
  const att = spec.tests?.[0]?.results?.[0]?.attachments?.find(
    a => a.contentType?.startsWith('image/')
  );
  if (!att?.path || !fs.existsSync(att.path)) return '';
  const data = fs.readFileSync(att.path).toString('base64');
  return `<img class="ss" src="data:image/png;base64,${data}">`;
}

function errorText(spec) {
  const err = spec.tests?.[0]?.results?.[0]?.errors?.[0]?.message || '';
  if (!err) return '';
  // первые 250 символов, убираем ANSI-коды
  const clean = err.replace(/\x1b\[[0-9;]*m/g, '').replace(/<[^>]+>/g,'').slice(0, 250);
  return `<span class="err">${escHtml(clean)}</span>`;
}

const rows = allItems.map(({ moduleName, spec }) => {
  const status = spec.tests?.[0]?.results?.[0]?.status;
  const icon   = status === 'passed' ? '✅' : '❌';
  const detail = status !== 'passed'
    ? `${errorText(spec)}${screenshotB64(spec)}`
    : '';
  return `<tr>
    <td class="ic">${icon}</td>
    <td>${escHtml(moduleName)}</td>
    <td>${escHtml(spec.title)}</td>
    <td>${detail}</td>
  </tr>`;
}).join('');

const badge = failed > 0
  ? `<div class="badge-fail">УПАЛО ТЕСТОВ: ${failed}</div>`
  : `<div class="badge-ok">ВСЕ ТЕСТЫ ПРОШЛИ</div>`;

const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; margin: 36px; color: #222; font-size: 13px; }
  h1  { font-size: 20px; font-weight: bold; margin: 0 0 3px; }
  .sub { color: #666; font-size: 12px; margin-bottom: 18px; }
  .badge-fail { background:#e53e3e; color:#fff; font-weight:bold; padding:5px 14px; display:inline-block; margin-bottom:18px; font-size:13px; }
  .badge-ok   { background:#38a169; color:#fff; font-weight:bold; padding:5px 14px; display:inline-block; margin-bottom:18px; font-size:13px; }
  .stats { display:flex; gap:36px; margin-bottom:24px; }
  .stat { text-align:center; }
  .sv  { font-size:30px; font-weight:bold; line-height:1; }
  .sv.red { color:#e53e3e; }
  .sl  { font-size:11px; color:#666; margin-top:3px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#2d3748; color:#fff; padding:7px 9px; text-align:left; font-size:12px; }
  td { padding:6px 9px; border-bottom:1px solid #eee; vertical-align:top; font-size:12px; }
  .ic { text-align:center; width:28px; }
  .err { color:#c53030; font-style:italic; display:block; margin-bottom:5px; }
  .ss  { max-width:280px; max-height:175px; border:1px solid #ddd; display:block; margin-top:4px; }
</style>
</head><body>
<h1>Отчёт тестирования FMS</h1>
<div class="sub">${timestamp} · fms.lacybird.ru</div>
${badge}
<div class="stats">
  <div class="stat"><div class="sv">${total}</div><div class="sl">Всего</div></div>
  <div class="stat"><div class="sv">${passed}</div><div class="sl">Прошло</div></div>
  <div class="stat"><div class="sv${failed > 0 ? ' red' : ''}">${failed}</div><div class="sl">Упало</div></div>
  <div class="stat"><div class="sv">${durMin}</div><div class="sl">Минут</div></div>
</div>
<table>
  <thead><tr><th>Итог</th><th>Модуль</th><th>Тест</th><th>Детали / Скриншот</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;

async function main() {
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch();
  const page    = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  fs.mkdirSync(path.dirname(PDF_OUTPUT), { recursive: true });
  await page.pdf({
    path: PDF_OUTPUT,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
  });
  await browser.close();
  console.log('PDF сгенерирован:', PDF_OUTPUT);
}

main().catch(err => {
  console.error('Ошибка генерации PDF:', err.message);
  process.exit(0);
});
