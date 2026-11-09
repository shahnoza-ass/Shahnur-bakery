const { spawnSync } = require('node:child_process');
const path = require('node:path');
const result = spawnSync(process.execPath, ['--test', 'test/database.integration.test.js', 'test/commerce.integration.test.js'], {
  cwd: path.join(__dirname, '../shahnur-bakery-backend'),
  env: { ...process.env, RUN_DB_INTEGRATION: '1' }, stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
