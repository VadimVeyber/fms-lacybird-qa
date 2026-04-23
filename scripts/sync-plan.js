/**
 * sync-plan.js — загружает тест-план из Google Sheets и пишет tests/test-plan.json
 * Таблица должна быть публичной (просмотр по ссылке).
 * API-ключ не нужен — используется CSV-экспорт.
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '12XI6bpA0oC54b54JfDQnc-95Jxwe_LqzfUGMKHOXkHA';
const OUTPUT = path.join(__dirname, '../tests/test-plan.json');

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) return reject(new Error('Слишком много редиректов'));
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location, redirects - 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.replace(/\r$/, ''));
  if (lines.length < 2) throw new Error('CSV пустой или содержит только заголовок');

  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const idCol = rawHeaders.findIndex(h => h === 'id');
  const enabledCol = rawHeaders.findIndex(h => h === 'enabled');

  if (idCol === -1) throw new Error(`Колонка "ID" не найдена. Заголовки: ${lines[0]}`);
  if (enabledCol === -1) throw new Error(`Колонка "Enabled" не найдена. Заголовки: ${lines[0]}`);

  const plan = {};
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const id = cols[idCol];
    if (!id) continue;
    const raw = cols[enabledCol];
    plan[id] = (raw === '0' || raw === 'false' || raw === 'нет') ? 0 : 1;
  }
  return plan;
}

async function main() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  console.log('Загружаю тест-план из Google Sheets...');
  const csv = await get(url);
  const plan = parseCSV(csv);
  const total = Object.keys(plan).length;
  const enabled = Object.values(plan).filter(v => v === 1).length;
  fs.writeFileSync(OUTPUT, JSON.stringify(plan, null, 2), 'utf8');
  console.log(`Тест-план обновлён: ${enabled}/${total} тестов включено → tests/test-plan.json`);
  if (enabled < total) {
    const disabled = Object.entries(plan).filter(([,v]) => v === 0).map(([id]) => id);
    console.log(`Отключены: ${disabled.join(', ')}`);
  }
}

main().catch(err => {
  console.error('Ошибка загрузки тест-плана:', err.message);
  console.error('Тесты будут запущены по текущему test-plan.json');
  process.exit(0); // не блокируем прогон если таблица недоступна
});
