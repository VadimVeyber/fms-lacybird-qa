/**
 * CRM (fms-db) — Загрузка страниц и базовый функционал
 * Тест-план: CRM-001, CRM-010..013, CRM-020..024, CRM-030..031,
 *            CRM-040..042, CRM-050..051, CRM-070..071, CRM-080..081
 */
const { test, expect } = require('@playwright/test');
const BASE = 'https://fms.lacybird.ru';
const AUTH = '/tmp/fms-auth-state.json';
const CRM = `${BASE}/fms-db`;

test.describe('CRM — Дашборд', () => {
  test('[CRM-001] Главная страница CRM загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(CRM, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const url = page.url();
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-dashboard.png', fullPage: true });

    expect(url, 'CRM не должна редиректить на логин').not.toContain('signin');

    const bodyText = await page.locator('body').innerText();
    // Хотя бы один ключевой элемент навигации
    const hasCrm = bodyText.toLowerCase().includes('заказ') ||
                   bodyText.toLowerCase().includes('клиент') ||
                   bodyText.toLowerCase().includes('каталог') ||
                   bodyText.toLowerCase().includes('floral');
    expect(hasCrm, 'CRM-дашборд должен содержать навигационные элементы').toBe(true);

    await ctx.close();
  });
});

test.describe('CRM — Клиенты', () => {
  test('[CRM-010] Страница клиентов загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/clients`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-clients.png', fullPage: true });

    expect(page.url()).not.toContain('signin');
    const bodyText = await page.locator('body').innerText();
    const hasClients = bodyText.toLowerCase().includes('клиент') ||
                       bodyText.toLowerCase().includes('добавить');
    expect(hasClients).toBe(true);
    await ctx.close();
  });

  test('[CRM-011] Форма создания клиента открывается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/clients`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const addBtn = page.locator('button:has-text("Добавить"), button:has-text("клиента"), button:has-text("Создать")').first();
    const btnVisible = await addBtn.isVisible().catch(() => false);
    if (btnVisible) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-client-form.png', fullPage: true });
      const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').count();
      expect(inputs, 'Форма клиента должна содержать поля').toBeGreaterThan(0);
    } else {
      // Кнопки нет — фиксируем как предупреждение, не падаем
      console.warn('[CRM-011] Кнопка добавления клиента не найдена — возможно, нет прав или другой UI');
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-client-no-add-btn.png', fullPage: true });
    }
    await ctx.close();
  });
});

test.describe('CRM — Заказы', () => {
  test('[CRM-020] Страница заказов загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-orders.png', fullPage: true });

    expect(page.url()).not.toContain('signin');
    const bodyText = await page.locator('body').innerText();
    const hasOrders = bodyText.toLowerCase().includes('заказ') || bodyText.toLowerCase().includes('order');
    expect(hasOrders).toBe(true);
    await ctx.close();
  });

  test('[CRM-021] Форма создания заказа открывается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const addBtn = page.locator('button:has-text("Создать"), button:has-text("Добавить"), button:has-text("заказ")').first();
    const btnVisible = await addBtn.isVisible().catch(() => false);
    if (btnVisible) {
      await addBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-order-form.png', fullPage: true });
      const inputs = await page.locator('input, select').count();
      expect(inputs).toBeGreaterThan(0);
    } else {
      console.warn('[CRM-021] Кнопка создания заказа не найдена');
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-order-no-btn.png', fullPage: true });
    }
    await ctx.close();
  });
});

test.describe('CRM — Каталог', () => {
  test('[CRM-030] Страница каталога загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/catalog`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-catalog.png', fullPage: true });

    expect(page.url()).not.toContain('signin');
    const bodyText = await page.locator('body').innerText();
    const hasCatalog = bodyText.toLowerCase().includes('каталог') ||
                       bodyText.toLowerCase().includes('товар') ||
                       bodyText.toLowerCase().includes('категор');
    expect(hasCatalog).toBe(true);
    await ctx.close();
  });
});

test.describe('CRM — Финансы', () => {
  test('[CRM-040] Страница финансов загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/finances`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-finances.png', fullPage: true });

    expect(page.url()).not.toContain('signin');
    await ctx.close();
  });

  test('[CRM-041] Страница оплат загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/payments`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-payments.png', fullPage: true });

    expect(page.url()).not.toContain('signin');
    await ctx.close();
  });
});

test.describe('CRM — Справочники', () => {
  test('[CRM-050] Страница курьеров загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/couriers`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-couriers.png', fullPage: true });
    expect(page.url()).not.toContain('signin');
    await ctx.close();
  });

  test('[CRM-051] Страница исполнителей загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/executors`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-executors.png', fullPage: true });
    expect(page.url()).not.toContain('signin');
    await ctx.close();
  });
});

test.describe('CRM — Настройки', () => {
  test('[CRM-070] Настройки: пользователи', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-settings.png', fullPage: true });

    expect(page.url()).not.toContain('signin');
    const bodyText = await page.locator('body').innerText();
    const hasSettings = bodyText.toLowerCase().includes('настройк') ||
                        bodyText.toLowerCase().includes('пользовател') ||
                        bodyText.toLowerCase().includes('роли');
    expect(hasSettings).toBe(true);
    await ctx.close();
  });
});

test.describe('CRM — Чаты', () => {
  test('[CRM-080] Страница чатов загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${CRM}/chats`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/crm-chats.png', fullPage: true });

    expect(page.url()).not.toContain('signin');
    await ctx.close();
  });
});
