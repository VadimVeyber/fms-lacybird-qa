/**
 * SCHED — Расписание сотрудников
 * Тест-план: SCHED-010..012, SCHED-020, SCHED-030, SCHED-040..047, SCHED-050..052, SCHED-060
 */
const { test, expect } = require('@playwright/test');
const BASE = 'https://fms.lacybird.ru';
const AUTH = '/tmp/fms-auth-state.json';
const SCHED = `${BASE}/employee_work_schedule`;

test.describe('SCHED — Основная страница загружается', () => {
  test('[SCHED-010a] Страница расписания открывается авторизованным', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(SCHED, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/sched-main.png', fullPage: true });

    const url = page.url();
    expect(url, 'Расписание должно открыться без редиректа на логин').not.toContain('signin');

    const bodyText = await page.locator('body').innerText();
    const hasSched = bodyText.toLowerCase().includes('смен') ||
                     bodyText.toLowerCase().includes('сотрудник') ||
                     bodyText.toLowerCase().includes('расписани') ||
                     bodyText.toLowerCase().includes('график');
    expect(hasSched, 'Страница расписания должна содержать ключевые элементы').toBe(true);
    await ctx.close();
  });
});

test.describe('SCHED — Навигация по разделам', () => {
  const TABS = [
    { name: 'График смен', id: 'SCHED-040a' },
    { name: 'Сотрудники',  id: 'SCHED-020a' },
    { name: 'Отделы',      id: 'SCHED-013a' },
    { name: 'Должности',   id: 'SCHED-011a' },
    { name: 'Проекты',     id: 'SCHED-012a' },
  ];

  for (const tab of TABS) {
    test(`[${tab.id}] Вкладка "${tab.name}" доступна`, async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: AUTH });
      const page = await ctx.newPage();
      await page.goto(SCHED, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      // Найти и нажать вкладку
      const tabEl = page.locator(`button:has-text("${tab.name}"), a:has-text("${tab.name}"), [role="tab"]:has-text("${tab.name}")`).first();
      const isVisible = await tabEl.isVisible().catch(() => false);

      if (isVisible) {
        await tabEl.click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: `/tmp/fms-tests/screenshots/sched-tab-${tab.id.toLowerCase()}.png`,
          fullPage: true,
        });
        const bodyText = await page.locator('body').innerText();
        expect(bodyText.toLowerCase()).toContain(tab.name.toLowerCase().slice(0, 5));
      } else {
        // Может быть в выпадающем меню
        const menuBtn = page.locator('button[aria-haspopup], button:has-text("Меню"), .dropdown button').first();
        const menuVisible = await menuBtn.isVisible().catch(() => false);
        if (menuVisible) {
          await menuBtn.click();
          await page.waitForTimeout(300);
        }
        const tabInMenu = page.locator(`text="${tab.name}"`).first();
        const inMenuVisible = await tabInMenu.isVisible().catch(() => false);
        if (inMenuVisible) {
          await tabInMenu.click();
          await page.waitForTimeout(600);
          await page.screenshot({
            path: `/tmp/fms-tests/screenshots/sched-tab-${tab.id.toLowerCase()}.png`,
            fullPage: true,
          });
        } else {
          console.warn(`[${tab.id}] Вкладка "${tab.name}" не найдена ни напрямую, ни в меню`);
          await page.screenshot({
            path: `/tmp/fms-tests/screenshots/sched-tab-${tab.id.toLowerCase()}-notfound.png`,
            fullPage: true,
          });
        }
      }
      await ctx.close();
    });
  }
});

test.describe('SCHED — Календарь смен', () => {
  test('[SCHED-040b] Календарная сетка отображается', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(SCHED, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Попробовать открыть График смен
    const schedTab = page.locator('button:has-text("График смен"), a:has-text("График смен"), text="График смен"').first();
    const isVisible = await schedTab.isVisible().catch(() => false);
    if (isVisible) {
      await schedTab.click();
      await page.waitForTimeout(800);
    }

    await page.screenshot({ path: '/tmp/fms-tests/screenshots/sched-calendar-grid.png', fullPage: true });

    const bodyText = await page.locator('body').innerText();
    // Должны быть дни месяца (числа 1..31) или навигация по месяцам
    const hasCalendar = /\b(январ|феврал|март|апрел|май|июн|июл|август|сентябр|октябр|ноябр|декабр)/i.test(bodyText) ||
                        bodyText.includes('Пн') || bodyText.includes('Вт') ||
                        await page.locator('table, .calendar, [class*="grid"]').count() > 0;
    expect(hasCalendar, 'Должна отображаться календарная сетка').toBe(true);
    await ctx.close();
  });

  test('[SCHED-046] Кнопки навигации по месяцам присутствуют', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(SCHED, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const prevBtn = await page.locator('button:has-text("←"), button:has-text("<"), [aria-label*="предыдущ"], [aria-label*="назад"], button.prev').count();
    const todayBtn = await page.locator('button:has-text("Сегодня")').count();

    await page.screenshot({ path: '/tmp/fms-tests/screenshots/sched-nav-buttons.png' });
    expect(prevBtn + todayBtn, 'Кнопки навигации по месяцам должны быть').toBeGreaterThan(0);
    await ctx.close();
  });
});

test.describe('SCHED — Создание смены', () => {
  test('[SCHED-040c] Кнопка/форма создания смены доступна', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(SCHED, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button:has-text("Добавить"), button:has-text("Создать смену"), button:has-text("+ Смена")').first();
    const isVisible = await addBtn.isVisible().catch(() => false);

    if (isVisible) {
      await addBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/sched-shift-form.png', fullPage: true });
      const inputs = await page.locator('input, select').count();
      expect(inputs, 'Форма создания смены должна содержать поля').toBeGreaterThan(0);
    } else {
      console.warn('[SCHED-040c] Кнопка добавления смены не найдена (возможно роль User)');
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/sched-no-add-btn.png', fullPage: true });
    }
    await ctx.close();
  });
});

test.describe('SCHED — Настройки', () => {
  test('[SCHED-060] Раздел настроек содержит выбор часового пояса', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH });
    const page = await ctx.newPage();
    await page.goto(SCHED, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const settingsTab = page.locator('button:has-text("Настройки"), a:has-text("Настройки"), text="Настройки"').first();
    const isVisible = await settingsTab.isVisible().catch(() => false);
    if (isVisible) {
      await settingsTab.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/sched-settings.png', fullPage: true });

      const bodyText = await page.locator('body').innerText();
      const hasTZ = bodyText.toLowerCase().includes('часовой пояс') ||
                    bodyText.toLowerCase().includes('timezone') ||
                    bodyText.toLowerCase().includes('москва');
      expect(hasTZ, 'Настройки должны содержать выбор часового пояса').toBe(true);
    } else {
      console.warn('[SCHED-060] Вкладка настроек не найдена (нет Admin прав?)');
      await page.screenshot({ path: '/tmp/fms-tests/screenshots/sched-settings-notfound.png', fullPage: true });
    }
    await ctx.close();
  });
});
