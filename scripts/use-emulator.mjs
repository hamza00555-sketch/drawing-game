#!/usr/bin/env node
/**
 * Prepare a local emulator run.
 *
 * Writes `.env.local` from `.env.emulator` and makes sure the functions
 * dependencies are installed.
 *
 * This exists as a script rather than as a line of documentation because the
 * documented `cp .env.emulator .env.local` is not a command on Windows CMD, and
 * the failure is silent in the worst way: the app boots, shows its setup screen,
 * and looks like it ignored you. Node runs the same everywhere, and the repo
 * already requires it.
 */

import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, '.env.emulator');
const target = join(root, '.env.local');
const force = process.argv.includes('--force');

if (!existsSync(source)) {
  console.error('ما لقينا .env.emulator — تأكد أنك في مجلد المشروع.');
  process.exit(1);
}

if (existsSync(target) && !force) {
  const current = readFileSync(target, 'utf8');
  const pointsAtEmulator = /VITE_USE_FIREBASE_EMULATORS\s*=\s*true/.test(current);

  // Never clobber a real project's keys by accident. Someone who has connected
  // a cloud project has values here that are not reproducible from the repo.
  console.log(
    pointsAtEmulator
      ? '.env.local موجود ومضبوط على المحاكي. ما غيّرنا شيئًا.'
      : '.env.local موجود ويشير إلى مشروع سحابي. تركناه كما هو —\n' +
          'لو تبي تستبدله بإعداد المحاكي: npm run setup:emulator -- --force',
  );
} else {
  copyFileSync(source, target);
  console.log('كتبنا .env.local من .env.emulator.');
}

// The emulator runs the compiled functions, and it cannot compile them itself.
if (!existsSync(join(root, 'functions', 'node_modules'))) {
  console.log('نثبّت اعتماديات functions...');
  const install = spawnSync('npm', ['install', '--prefix', 'functions'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (install.status !== 0) {
    console.error('فشل تثبيت اعتماديات functions.');
    process.exit(install.status ?? 1);
  }
}

console.log('\nجاهز. في طرفيتين منفصلتين:\n');
console.log('  npm run emulators');
console.log('  npm run dev\n');
console.log('ثم افتح http://localhost:5173 في ثلاث نوافذ متخفية.');
console.log('لو كان npm run dev شغّالًا الآن، أوقفه وشغّله من جديد —');
console.log('Vite يقرأ ملفات البيئة عند الإقلاع فقط.');
