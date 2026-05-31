#!/usr/bin/env node
// Synchronise app.json (expo.version + android.versionCode) avec la version fournie.
const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: sync-app-version.js <version>');
  process.exit(1);
}

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

appJson.expo = appJson.expo || {};
appJson.expo.version = version;

// versionCode entier monotone : MAJOR*10000 + MINOR*100 + PATCH
const [maj, min, pat] = version.split('.').map(n => parseInt(n, 10) || 0);
appJson.expo.android = appJson.expo.android || {};
appJson.expo.android.versionCode = maj * 10000 + min * 100 + pat;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log(`app.json mis à jour : version=${version}, versionCode=${appJson.expo.android.versionCode}`);
