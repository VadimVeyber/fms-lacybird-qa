let grepPattern;
try {
  const plan = require('./test-plan.json');
  const enabledIds = Object.entries(plan)
    .filter(([, v]) => v !== 0)
    .map(([id]) => `\\[${id}`);
  const disabledCount = Object.values(plan).filter(v => v === 0).length;
  if (disabledCount > 0 && enabledIds.length > 0) {
    grepPattern = new RegExp(enabledIds.join('|'));
  }
} catch (_) {
  // test-plan.json не найден — запускаем все тесты
}

module.exports = {
  testDir: '.',
  timeout: 60000,
  workers: 1,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
  },
  ...(grepPattern ? { grep: grepPattern } : {}),
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.REPORT_PATH || '/tmp/fms-tests/results.json' }],
    ['html', { outputFolder: process.env.HTML_REPORT_DIR || '/tmp/fms-tests/html-report', open: 'never' }],
  ],
};
