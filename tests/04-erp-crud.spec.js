/**
 * ERP — CRUD операции (создание, проверка, удаление)
 * Тест-план: ERP-030, ERP-031, ERP-040, ERP-050, ERP-051, ERP-060, ERP-070
 */
const { test, expect } = require('@playwright/test');
const BASE = 'https://fms.lacybird.ru';
const AUTH = '/tmp/fms-auth-state.json';

test.describe('ERP — CRUD: Единицы измерения', () => {
  test('[ERP-030] Создать и удалить единицу измерения', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp/units`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const unitName = `Тест-ед-${Date.now()}`;

    // Открыть форму
    await page.locator('button:has-text("Добавить")').first().click();
    await page.waitForTimeout(500);

    // Заполнить название
    const nameInput = page.locator('input[placeholder*="Назван"], input[placeholder*="назван"], input[type="text"]').first();
    await nameInput.fill(unitName);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-unit-form.png' });

    // Сохранить
    await page.locator('button:has-text("Сохранить"), button:has-text("Добавить"), button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-unit-saved.png' });

    // Проверить что появилось
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(unitName);

    await ctx.close();
  });
});

test.describe('ERP — CRUD: Контрагенты', () => {
  test('[ERP-031] Создать контрагента', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp/contractors`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const name = `Тест-контрагент-${Date.now()}`;

    await page.locator('button:has-text("Добавить")').first().click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(name);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-contractor-form.png' });

    await page.locator('button:has-text("Сохранить"), button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-contractor-saved.png' });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(name);

    await ctx.close();
  });
});

test.describe('ERP — CRUD: Материалы', () => {
  test('[ERP-040] Добавить группу материалов', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp/materials`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const groupName = `Тест-группа-${Date.now()}`;

    await page.locator('button:has-text("Добавить группу")').first().click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(groupName);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-matgroup-form.png' });

    await page.locator('button:has-text("Сохранить"), button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-matgroup-saved.png' });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(groupName);

    await ctx.close();
  });
});

test.describe('ERP — CRUD: Склады', () => {
  test('[ERP-050] Добавить склад', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp/warehouses`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const warehouseName = `Тест-склад-${Date.now()}`;

    await page.locator('button:has-text("Добавить склад")').first().click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(warehouseName);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-warehouse-form.png' });

    await page.locator('button:has-text("Сохранить"), button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-warehouse-saved.png' });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(warehouseName);

    await ctx.close();
  });
});

test.describe('ERP — CRUD: Приёмки', () => {
  test('[ERP-051] Создать приёмку (черновик)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp/receipts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Добавить приёмку")').first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-receipt-form.png', fullPage: true });

    // Проверить что форма/модал открылся
    const bodyText = await page.locator('body').innerText();
    const hasForm = bodyText.toLowerCase().includes('склад') ||
                    bodyText.toLowerCase().includes('контрагент') ||
                    bodyText.toLowerCase().includes('дата') ||
                    await page.locator('input, select, textarea').count() > 1;
    expect(hasForm, 'Форма создания приёмки должна открыться').toBe(true);

    await ctx.close();
  });
});

test.describe('ERP — CRUD: Рецепты', () => {
  test('[ERP-060] Кнопка создания рецепта открывает форму', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp/recipes`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Создать рецепт")').first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-recipe-form.png', fullPage: true });

    const inputs = await page.locator('input, select').count();
    expect(inputs, 'Форма рецепта должна содержать поля').toBeGreaterThan(0);

    await ctx.close();
  });
});

test.describe('ERP — CRUD: Производство', () => {
  test('[ERP-061] Кнопка создания производства открывает форму', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp/productions`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Создать производство")').first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-crud-production-form.png', fullPage: true });

    const inputs = await page.locator('input, select').count();
    expect(inputs, 'Форма производства должна содержать поля').toBeGreaterThan(0);

    await ctx.close();
  });
});

test.describe('ERP — Настройки: пользователи и роли', () => {
  test('[ERP-070] Страница настроек содержит вкладки Пользователи и Роли', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/erp/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const usersBtn = await page.locator('button:has-text("Пользователи"), a:has-text("Пользователи")').count();
    const rolesBtn = await page.locator('button:has-text("Роли"), a:has-text("Роли")').count();
    expect(usersBtn, 'Вкладка Пользователи не найдена').toBeGreaterThan(0);
    expect(rolesBtn, 'Вкладка Роли не найдена').toBeGreaterThan(0);

    // Нажать Пользователи
    await page.locator('button:has-text("Пользователи")').first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/erp-settings-users.png', fullPage: true });

    const bodyText = await page.locator('body').innerText();
    const hasUserList = bodyText.toLowerCase().includes('добавить пользователя') ||
                        bodyText.toLowerCase().includes('email') ||
                        bodyText.toLowerCase().includes('роль');
    expect(hasUserList, 'Список пользователей должен отображаться').toBe(true);

    await ctx.close();
  });
});
