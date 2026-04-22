# fms-lacybird-qa

QA-репозиторий для [fms.lacybird.ru](https://fms.lacybird.ru) — тесты, отчёты и карта навигации.

## Структура

```
tests/          — Playwright-тесты (auth.spec.js)
reports/        — Отчёты по тестированию
screenshots/    — Скриншоты результатов тестов
```

## Запуск тестов

```bash
cd tests
npm install @playwright/test
npx playwright test --config=playwright.config.js
```

## Найденные проблемы

🔴 **Уязвимость:** подстраницы `/erp/*` доступны без авторизации — см. `reports/auth-test-report.md`
