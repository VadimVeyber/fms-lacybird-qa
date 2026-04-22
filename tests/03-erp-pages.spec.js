/**
 * ERP — Загрузка страниц и навигация (авторизованный пользователь)
 * Тест-план: ERP-020, ERP-040..043, ERP-050..053, ERP-060..062, ERP-070..071
 */
const { test, expect } = require('@playwright/test');
const BASE = 'https://fms.lacybird.ru';
const AUTH = '/tmp/fms-auth-state.json';

const ERP_PAGES = [
  { url: '/erp',                 title: 'ERP',            id: 'ERP-020', buttons: ['Каталоги', 'Склад', 'Производство', 'Справочники'] },
  { url: '/erp/materials',       title: 'материал',       id: 'ERP-040', buttons: ['Добавить группу', 'Добавить материал'] },
  { url: '/erp/services',        title: 'услуг',          id: 'ERP-041', buttons: ['Добавить группу', 'Добавить услугу'] },
  { url: '/erp/products',        title: 'товар',          id: 'ERP-042', buttons: ['Добавить группу', 'Добавить товар'] },
  { url: '/erp/warehouses',      title: 'Склад',          id: 'ERP-050', buttons: ['Добавить склад'] },
  { url: '/erp/receipts',        title: 'Приёмк',         id: 'ERP-051a', buttons: ['Добавить приёмку'] },
  { url: '/erp/movements',       title: 'Перемещен',      id: 'ERP-052a', buttons: ['Создать перемещение'] },
  { url: '/erp/inventory_report',title: 'Остатк',         id: 'ERP-053', buttons: ['Применить'] },
  { url: '/erp/recipes',         title: 'Рецепт',         id: 'ERP-060', buttons: ['Создать рецепт'] },
  { url: '/erp/productions',     title: 'Производство',   id: 'ERP-061a', buttons: ['Создать производство'] },
  { url: '/erp/units',           title: 'Единиц',         id: 'ERP-030', buttons: ['Добавить'] },
  { url: '/erp/contractors',     title: 'Контрагент',     id: 'ERP-031', buttons: ['Добавить'] },
  { url: '/erp/executors',       title: 'Исполнител',     id: 'ERP-032', buttons: ['Добавить'] },
  { url: '/erp/settings',        title: 'Настройки',      id: 'ERP-070', buttons: ['Пользователи', 'Роли и права'] },
];

test.describe('ERP — Страницы загружаются и содержат нужные элементы', () => {
  for (const page_def of ERP_PAGES) {
    test(`[${page_def.id}] ${page_def.url}`, async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: AUTH });
      const page = await ctx.newPage();

      await page.goto(`${BASE}${page_def.url}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const url = page.url();
      const title = await page.title();
      await page.screenshot({
        path: `/tmp/fms-tests/screenshots/erp-${page_def.id.toLowerCase()}.png`,
        fullPage: true,
      });

      // Не должен редиректить на логин
      expect(url, `[${page_def.id}] Должен быть авторизован`).not.toContain('signin');

      // Заголовок содержит ключевое слово
      const bodyText = await page.locator('body').innerText();
      const titleMatch = bodyText.toLowerCase().includes(page_def.title.toLowerCase()) ||
                         title.toLowerCase().includes(page_def.title.toLowerCase());
      expect(titleMatch, `[${page_def.id}] Ожидалось слово "${page_def.title}" на странице`).toBe(true);

      // Нужные кнопки присутствуют
      for (const btn of page_def.buttons) {
        const found = await page.locator(`button:has-text("${btn}"), a:has-text("${btn}")`).count();
        expect(found, `[${page_def.id}] Кнопка/ссылка "${btn}" не найдена`).toBeGreaterThan(0);
      }

      await ctx.close();
    });
  }
});

test.describe('ERP — Навигационные ссылки в шапке', () => {
  test('[ERP-020] Все пункты меню присутствуют на дашборде', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const navLinks = ['Материалы', 'Склады', 'Приёмки', 'Перемещения', 'Рецепты', 'Производство'];
    for (const link of navLinks) {
      const found = await page.locator(`a:has-text("${link}"), button:has-text("${link}")`).count();
      expect(found, `Ссылка "${link}" не найдена в навигации`).toBeGreaterThan(0);
    }
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-nav-dashboard.png' });
    await ctx.close();
  });
});
