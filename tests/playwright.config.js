module.exports = {
  testDir: '.',
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },
  reporter: [['list'], ['json', { outputFile: '/tmp/fms-tests/results.json' }]],
};
