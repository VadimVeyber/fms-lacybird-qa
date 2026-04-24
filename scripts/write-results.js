/**
 * write-results.js — читает Playwright JSON-отчёт и отправляет результаты
 * в Google Sheets через Apps Script webhook.
 * Переменные окружения:
 *   SHEETS_WEBHOOK_URL — URL задеплоенного Apps Script (GitHub Secret)
 *   REPORT_PATH        — путь к results.json (по умолчанию /tmp/fms-tests/results.json)
 */
const fs = require('fs');

const WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL;
const REPORT_PATH = process.env.REPORT_PATH || '/tmp/fms-tests/results.json';

if (!WEBHOOK_URL) {
  console.log('SHEETS_WEBHOOK_URL не задан — пропускаем запись в таблицу');
  process.exit(0);
}

if (!fs.existsSync(REPORT_PATH)) {
  console.log(`Отчёт не найден: ${REPORT_PATH} — пропускаем`);
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));

// Рекурсивно собираем все specs из вложенных suites
function collectSpecs(suite) {
  const specs = [];
  if (suite.specs) specs.push(...suite.specs);
  if (suite.suites) suite.suites.forEach(s => specs.push(...collectSpecs(s)));
  return specs;
}

const allSpecs = report.suites.flatMap(collectSpecs);

const results = [];
for (const spec of allSpecs) {
  const match = spec.title.match(/\[([A-Z]+-\d+[a-z]*)\]/);
  if (!match) continue;
  const id = match[1];
  const status = spec.tests?.[0]?.results?.[0]?.status ?? 'unknown';
  results.push({ id, status });
}

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const timestamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`;

const payload = JSON.stringify({ timestamp, results });

console.log(`Отправляю ${results.length} результатов в Google Sheets (${timestamp})...`);

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: payload,
  redirect: 'follow',
})
  .then(r => r.text())
  .then(body => {
    try {
      const json = JSON.parse(body);
      if (json.ok) {
        console.log(`Обновлено строк в таблице: ${json.updated}`);
      } else {
        console.error('Ошибка от Apps Script:', json.error);
      }
    } catch {
      console.log('Ответ:', body.slice(0, 200));
    }
  })
  .catch(err => {
    console.error('Ошибка отправки:', err.message);
    process.exit(0);
  });
