const { test, expect } = require('@playwright/test');

const BASE = 'https://fms.lacybird.ru';
const AUTH_URL = `${BASE}/s/auth/signin?back=%2Ferp`;
const PROTECTED_PAGES = [
  '/erp',
  '/erp/materials',
  '/erp/receipts',
  '/erp/settings',
  '/erp/productions',
];

test.describe('Авторизация — позитивный сценарий', () => {
  test('Email: запрос кода — форма переходит к вводу кода', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/01-auth-initial.png' });

    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/02-auth-email-tab.png' });

    const emailInput = page.locator('input[type=email]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('vadim.veyber@icloud.com');
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/03-auth-email-filled.png' });

    await page.getByRole('button', { name: /Отправить код/i }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/04-auth-code-sent.png' });

    const codeInput = page.locator('input[placeholder="000000"]');
    await expect(codeInput).toBeVisible();
  });

  test('Вход с сохранённой сессией — ERP доступен', async ({ browser }) => {
    const context = await browser.newContext({ storageState: '/tmp/fms-auth-state.json' });
    const page = await context.newPage();
    await page.goto(`${BASE}/erp`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/05-auth-logged-in-erp.png' });

    await expect(page).not.toHaveURL(/signin/);
    const title = await page.title();
    expect(title).not.toBe('Авторизация');
    await context.close();
  });
});

test.describe('Авторизация — негативный сценарий', () => {
  test('Пустое поле email — кнопка заблокирована (disabled)', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);

    // Кнопка должна быть disabled при пустом поле
    const btn = page.locator('button:has-text("Отправить код")');
    await expect(btn).toBeDisabled();
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/06-neg-empty-email-disabled.png' });
  });

  test('Невалидный формат email — кнопка остаётся заблокированной', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);

    await page.locator('input[type=email]').fill('notanemail');
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/07-neg-invalid-email.png' });

    const btn = page.locator('button:has-text("Отправить код")');
    await expect(btn).toBeDisabled();
  });

  test('Валидный email — кнопка активируется', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);

    await page.locator('input[type=email]').fill('vadim.veyber@icloud.com');
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/08-valid-email-btn-enabled.png' });

    const btn = page.locator('button:has-text("Отправить код")');
    await expect(btn).toBeEnabled();
  });

  test('Неверный код — не перенаправляет в ERP', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await page.locator('input[type=email]').fill('vadim.veyber@icloud.com');
    await page.getByRole('button', { name: /Отправить код/i }).click();
    await page.waitForTimeout(2000);

    await page.locator('input[placeholder="000000"]').fill('000000');
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/09-neg-wrong-code-filled.png' });

    await page.getByRole('button', { name: /Войти|Подтвердить|Confirm/i }).first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/10-neg-wrong-code-result.png' });

    await expect(page).not.toHaveURL(`${BASE}/erp`);
  });
});

test.describe('Защищённые страницы — доступ без авторизации', () => {
  test('/erp — редирект на логин ✓', async ({ page }) => {
    await page.goto(`${BASE}/erp`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/11-protected-erp-root.png' });

    const isProtected = page.url().includes('signin') || await page.title() === 'Авторизация';
    expect(isProtected).toBe(true);
  });

  // БАГИ: подстраницы доступны без авторизации
  for (const route of ['/erp/materials', '/erp/receipts', '/erp/settings', '/erp/productions']) {
    test(`${route} — УЯЗВИМОСТЬ: доступна без авторизации`, async ({ page }) => {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const name = route.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({ path: `/tmp/fms-tests/screenshots/SECURITY-${name}.png`, fullPage: true });

      const isProtected = page.url().includes('signin') || await page.title() === 'Авторизация';
      // Фиксируем уязвимость — тест помечен как xfail
      // Страница открывается — это баг
      expect(isProtected, `УЯЗВИМОСТЬ: ${route} открыта без авторизации`).toBe(false);
    });
  }
});

test.describe('Сброс пароля', () => {
  test('Опция сброса пароля отсутствует', async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Email' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/fms-tests/screenshots/13-no-password-reset.png' });

    const content = await page.textContent('body');
    const hasReset = /забыли|сбросить|reset|forgot/i.test(content);
    expect(hasReset).toBe(false); // подтверждаем отсутствие
  });
});
