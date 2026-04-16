#!/usr/bin/env node
/**
 * Deletes allure-results/ and allure-report/ before every test run.
 * Wired to the "pretest" hook in package.json so it runs automatically.
 */
const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dirs = ['allure-results', 'allure-report'];

for (const dir of dirs) {
  const target = path.join(root, dir);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[clean-reports] Removed ${dir}/`);
  }
}
