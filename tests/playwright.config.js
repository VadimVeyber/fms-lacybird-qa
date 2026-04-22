module.exports = {
  testDir: '.',
  timeout: 60000,
  workers: 1,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.REPORT_PATH || '/tmp/fms-tests/results.json' }],
    ['html', { outputFolder: process.env.HTML_REPORT_DIR || '/tmp/fms-tests/html-report', open: 'never' }],
  ],
};
