/**
 * SEC — Безопасность: доступ без авторизации
 * Тест-план: SEC-001..005, ERP-000, ERP-001
 */
const { test, expect } = require('@playwright/test');
const BASE = 'https://fms.lacybird.ru';

// Все страницы, которые должны быть закрыты без авторизации
const PROTECTED = [
  // ERP
  { url: '/erp',                expect: 'redirect', id: 'ERP-000' },
  { url: '/erp/materials',      expect: 'redirect', id: 'ERP-001a' },
  { url: '/erp/receipts',       expect: 'redirect', id: 'ERP-001b' },
  { url: '/erp/settings',       expect: 'redirect', id: 'ERP-001c' },
  { url: '/erp/productions',    expect: 'redirect', id: 'ERP-001d' },
  { url: '/erp/movements',      expect: 'redirect', id: 'ERP-001e' },
  { url: '/erp/inventory_report', expect: 'redirect', id: 'ERP-001f' },
  { url: '/erp/warehouses',     expect: 'redirect', id: 'ERP-001g' },
  { url: '/erp/recipes',        expect: 'redirect', id: 'ERP-001h' },
  { url: '/erp/units',          expect: 'redirect', id: 'ERP-001i' },
  { url: '/erp/contractors',    expect: 'redirect', id: 'ERP-001j' },
  { url: '/erp/executors',      expect: 'redirect', id: 'ERP-001k' },
  { url: '/erp/services',       expect: 'redirect', id: 'ERP-001l' },
  { url: '/erp/products',       expect: 'redirect', id: 'ERP-001m' },
  // CRM
  { url: '/fms-db',             expect: 'redirect', id: 'SEC-002a' },
  // Schedule
  { url: '/employee_work_schedule', expect: 'redirect', id: 'SEC-004a' },
];

function isProtected(url, title) {
  return url.includes('signin') || url.includes('login') || title === 'Авторизация';
}

test.describe('SEC — Доступ без авторизации (анонимный браузер)', () => {
  for (const item of PROTECTED) {
    test(`[${item.id}] ${item.url} — закрыта без auth`, async ({ page }) => {
      await page.goto(`${BASE}${item.url}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const url = page.url();
      const title = await page.title();
      const ssPath = `/tmp/fms-tests/screenshots/sec-${item.id.toLowerCase()}.png`;
      await page.screenshot({ path: ssPath, fullPage: true });

      const protected_ = isProtected(url, title);
      if (!protected_) {
        console.warn(`⚠️  УЯЗВИМОСТЬ [${item.id}]: ${item.url} открыта без авторизации! URL: ${url}`);
      }
      expect(protected_, `[${item.id}] ${item.url} должна редиректить на логин, но открылась: ${url}`).toBe(true);
    });
  }
});
