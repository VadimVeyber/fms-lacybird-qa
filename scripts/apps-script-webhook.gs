/**
 * Google Apps Script — вставить в Extensions → Apps Script в таблице FMS QA Test Plan
 * После вставки: Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Скопировать URL деплоя → добавить в GitHub Secrets как SHEETS_WEBHOOK_URL
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const values = sheet.getDataRange().getValues();

    const headers = values[0].map(h => String(h).toLowerCase().trim());
    const idCol = headers.indexOf('id');

    // Создаём колонку "Last Result" если её нет
    let resultCol = headers.indexOf('last result');
    if (resultCol === -1) {
      resultCol = values[0].length;
      sheet.getRange(1, resultCol + 1).setValue('Last Result');
    }

    // id → номер строки (1-based)
    const idToRow = {};
    for (let i = 1; i < values.length; i++) {
      const id = String(values[i][idCol]).trim();
      if (id) idToRow[id] = i + 1;
    }

    const ts = data.timestamp;
    let updated = 0;
    for (const r of data.results) {
      const row = idToRow[r.id];
      if (!row) continue;
      const icon = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⏭';
      sheet.getRange(row, resultCol + 1).setValue(`${ts} ${icon} ${r.status}`);
      updated++;
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, updated }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
