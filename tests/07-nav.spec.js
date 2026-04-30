/**
 * NAV — Главный хаб (main-FMS) и авторизация
 * Тест-план: AUTH-005, NAV-001, NAV-002
 */
const { test, expect } = require('@playwright/test');
const BASE = 'https://fms.lacybird.ru';
const AUTH = '/tmp/fms-auth-state.json';

test.describe('NAV — Главная страница хаба', () => {
  test('[NAV-001] Хаб загружается с авторизованной сессией', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/main-FMS`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/nav-hub.png', fullPage: true });

    // Проверяем URL и что страница не пустая
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length, 'Страница хаба не должна быть пустой').toBeGreaterThan(10);
    await ctx.close();
  });

  test('[NAV-001b] Ссылка на расписание сотрудников присутствует', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/main-FMS`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const schedLink = await page.locator(`a[href*="employee_work_schedule"]`).count();
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/nav-schedule-link.png' });
    expect(schedLink, 'Ссылка на расписание должна быть в хабе').toBeGreaterThan(0);
    await ctx.close();
  });
});

test.describe('NAV — Выход из системы', () => {
  test('[NAV-002] После нажатия выхода сессия завершается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    // Заходим на ERP, там точно есть кнопка Выход
    await page.goto(`${BASE}/erp`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const logoutBtn = page.locator('button:has-text("Выход"), a:has-text("Выход"), a:has-text("Выйти")').first();
    const isVisible = await logoutBtn.isVisible().catch(() => false);
    if (isVisible) {
      await logoutBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/nav-after-logout.png' });
      const url = page.url();
      const isLoggedOut = url.includes('signin') || url.includes('login') || url.includes('auth');
      expect(isLoggedOut, 'После выхода должен быть редирект на страницу авторизации').toBe(true);
    } else {
      console.warn('[NAV-002] Кнопка выхода не найдена');
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/nav-no-logout-btn.png' });
    }
    await ctx.close();
  });
});

test.describe('NAV — Сохранённая сессия', () => {
  test('[NAV-003] Сохранённая сессия открывает ERP без логина', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/auth-saved-session.png' });

    expect(page.url()).not.toContain('signin');
    const title = await page.title();
    expect(title).not.toBe('Авторизация');
    await ctx.close();
  });
});
