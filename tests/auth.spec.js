const { test, expect } = require('@playwright/test');

const BASE = 'https://fms.lacybird.ru';
const AUTH_URL = `${BASE}/s/auth/signin?back=%2Ferp`;
const AUTH_STATE = process.env.AUTH_STATE_PATH || '/tmp/fms-auth-state.json';
const SS = process.env.SCREENSHOTS_DIR || '/tmp/fms-tests/screenshots';

test.describe('Авторизация — позитивный сценарий', () => {
  test('Email: запрос кода — форма переходит к вводу кода', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: `${SS}/01-auth-initial.png` });

    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SS}/02-auth-email-tab.png` });

    const emailInput = page.locator('input[type=email]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('vadim.veyber@icloud.com');
    await page.screenshot({ path: `${SS}/03-auth-email-filled.png` });

    await page.getByRole('button', { name: /Отправить код/i }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/04-auth-code-sent.png` });

    await expect(page.locator('input[placeholder="000000"]')).toBeVisible();
  });

  test('Вход с сохранённой сессией — ERP доступен', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_STATE });
    const page = await context.newPage();
    await page.goto(`${BASE}/erp`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/05-auth-logged-in-erp.png` });

    await expect(page).not.toHaveURL(/signin/);
    expect(await page.title()).not.toBe('Авторизация');
    await context.close();
  });
});

test.describe('Авторизация — негативный сценарий', () => {
  test('Пустое поле email — кнопка заблокирована', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Отправить код")')).toBeDisabled();
    await page.screenshot({ path: `${SS}/06-neg-empty-email-disabled.png` });
  });

  test('Невалидный формат email — кнопка остаётся заблокированной', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await page.locator('input[type=email]').fill('notanemail');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SS}/07-neg-invalid-email.png` });
    await expect(page.locator('button:has-text("Отправить код")')).toBeDisabled();
  });

  test('Валидный email — кнопка активируется', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await page.locator('input[type=email]').fill('vadim.veyber@icloud.com');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SS}/08-valid-email-btn-enabled.png` });
    await expect(page.locator('button:has-text("Отправить код")')).toBeEnabled();
  });

  test('Неверный код — не перенаправляет в ERP', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await page.locator('input[type=email]').fill('vadim.veyber@icloud.com');
    await page.getByRole('button', { name: /Отправить код/i }).click();
    await page.waitForTimeout(2000);
    await page.locator('input[placeholder="000000"]').fill('000000');
    await page.screenshot({ path: `${SS}/09-neg-wrong-code-filled.png` });
    await page.getByRole('button', { name: /Войти|Подтвердить|Confirm/i }).first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/10-neg-wrong-code-result.png` });
    await expect(page).not.toHaveURL(`${BASE}/erp`);
  });
});

test.describe('Защищённые страницы — доступ без авторизации', () => {
  test('/erp — редирект на логин ✓', async ({ page }) => {
    await page.goto(`${BASE}/erp`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SS}/11-protected-erp-root.png` });
    const isProtected = page.url().includes('signin') || await page.title() === 'Авторизация';
    expect(isProtected).toBe(true);
  });

  for (const route of ['/erp/materials', '/erp/receipts', '/erp/settings', '/erp/productions']) {
    test(`${route} — УЯЗВИМОСТЬ: доступна без авторизации`, async ({ page }) => {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const name = route.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({ path: `${SS}/SECURITY-${name}.png`, fullPage: true });
      const isProtected = page.url().includes('signin') || await page.title() === 'Авторизация';
      expect(isProtected, `УЯЗВИМОСТЬ: ${route} открыта без авторизации`).toBe(false);
    });
  }
});

test.describe('Сброс пароля', () => {
  test('Опция сброса пароля отсутствует', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SS}/13-no-password-reset.png` });
    const content = await page.textContent('body');
    expect(/забыли|сбросить|reset|forgot/i.test(content)).toBe(false);
  });
});
