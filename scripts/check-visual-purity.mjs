#!/usr/bin/env node
/**
 * وش ذا؟ — Visual purity check
 * -----------------------------------------------------------------------------
 * The art direction rules for this project are absolute, and absolute rules
 * should be enforced by a machine rather than by whoever is typing that day.
 *
 * This fails the build if any of these appear under src/:
 *
 *   1. Emoji.            Not as UI, not as a placeholder, not in a comment.
 *   2. Hand-coded art.   <svg>, <path d="...">, <polygon>, <circle> used as
 *                        illustration. All artwork comes from Higgsfield and is
 *                        referenced through <AssetSlot />.
 *   3. Icon libraries.   lucide, heroicons, react-icons, font-awesome, material
 *                        icons — none of them may stand in for our identity.
 *
 * Run: npm run check:purity
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ROOTS = [join(ROOT, 'src'), join(ROOT, 'shared'), join(ROOT, 'functions', 'src')];

const EMOJI = new RegExp(
  '[' +
    '\\u{1F300}-\\u{1F5FF}' + // pictographs
    '\\u{1F600}-\\u{1F64F}' + // emoticons
    '\\u{1F680}-\\u{1F6FF}' + // transport
    '\\u{1F900}-\\u{1F9FF}' + // supplemental
    '\\u{1FA70}-\\u{1FAFF}' + // extended-A
    '\\u{1F1E6}-\\u{1F1FF}' + // regional indicators (flags)
    '\\u{2600}-\\u{26FF}' + // misc symbols
    '\\u{2700}-\\u{27BF}' + // dingbats
    '\\u{FE0F}' + // variation selector-16
    ']',
  'u',
);

const HAND_CODED_ART = [
  { pattern: /<svg[\s>]/i, label: 'inline <svg> — artwork must come from Higgsfield' },
  { pattern: /<path\s+d=/i, label: '<path d> — hand-coded vector artwork' },
  { pattern: /<(polygon|polyline|ellipse)[\s>]/i, label: 'hand-coded vector shape' },
  {
    // A bare <circle>/<rect> is only ever an SVG child, so it is artwork too.
    pattern: /<(circle|rect)\s/i,
    label: 'hand-coded vector shape',
  },
];

const FORBIDDEN_IMPORTS = [
  'lucide-react',
  'lucide',
  '@heroicons/react',
  'react-icons',
  '@fortawesome/',
  '@mui/icons-material',
  'material-icons',
  'feather-icons',
  'bootstrap-icons',
];

/** Files may opt out of a specific check with an explicit, reviewed comment. */
const ALLOW_MARKER = 'wesh-tha-purity-allow';

const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'generated' || entry === 'lib') continue;
      walk(full);
    } else if (/\.(ts|tsx|css|html)$/.test(entry)) {
      inspect(full);
    }
  }
}

function inspect(file) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');

  lines.forEach((line, index) => {
    if (line.includes(ALLOW_MARKER)) return;
    const at = `${rel}:${index + 1}`;

    if (EMOJI.test(line)) {
      violations.push({ at, rule: 'emoji', detail: line.trim().slice(0, 80) });
    }

    for (const { pattern, label } of HAND_CODED_ART) {
      if (pattern.test(line)) {
        violations.push({ at, rule: label, detail: line.trim().slice(0, 80) });
      }
    }

    for (const pkg of FORBIDDEN_IMPORTS) {
      if (line.includes(`'${pkg}`) || line.includes(`"${pkg}`)) {
        violations.push({
          at,
          rule: `icon library "${pkg}" may not carry the identity`,
          detail: line.trim().slice(0, 80),
        });
      }
    }
  });
}

let scanned = 0;
for (const root of ROOTS) {
  try {
    statSync(root);
  } catch {
    continue;
  }
  walk(root);
  scanned += 1;
}

if (scanned === 0) {
  console.log('no source directories yet — nothing to check');
  process.exit(0);
}

if (violations.length === 0) {
  console.log('visual purity: clean (no emoji, no hand-coded artwork, no icon libraries)');
  process.exit(0);
}

console.error(`\nvisual purity: ${violations.length} violation(s)\n`);
for (const v of violations) {
  console.error(`  ${v.at}`);
  console.error(`    rule: ${v.rule}`);
  console.error(`    line: ${v.detail}\n`);
}
console.error('All artwork must be generated with Higgsfield and used via <AssetSlot />.');
console.error('See ART_BIBLE.md. To allow a reviewed exception, add the comment marker:');
console.error(`  ${ALLOW_MARKER}\n`);
process.exit(1);
