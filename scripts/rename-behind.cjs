/**
 * One-off: rename EntityStatus value "Behind" → "High Risk" across code + mock data.
 *
 * Safe-to-run criteria:
 *   - Replaces only the EXACT quoted literal `"Behind"` (double quotes, word-exact)
 *   - i18n keys `"status.behind"`, `"statusBehind"`, `"behindThreshold"` etc.
 *     contain lowercase "behind" — those won't match.
 *   - Comment words like "// Behind" won't match (no quotes).
 *
 * Self-deletes after dry-run confirmation? No — run once then git diff to verify.
 */
const fs = require('fs');
const path = require('path');

const ROOTS = ['src', 'scripts'];
const EXTS = new Set(['.ts', '.tsx', '.cjs', '.js', '.json']);
const SKIP_FILES = new Set([
  // This script itself:
  path.join('scripts', 'rename-behind.cjs'),
  // Keep migration history intact — it describes legacy constraint.
]);

let changed = 0;
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'supabase'].includes(entry.name)) continue;
      walk(p);
    } else if (EXTS.has(path.extname(entry.name))) {
      const rel = path.relative(process.cwd(), p);
      if (SKIP_FILES.has(rel)) continue;
      if (rel.includes('supabase' + path.sep)) continue;
      scanned++;
      const before = fs.readFileSync(p, 'utf8');
      // Word-exact double-quoted "Behind" only
      const after = before.replace(/"Behind"/g, '"High Risk"');
      if (after !== before) {
        fs.writeFileSync(p, after);
        const hits = (before.match(/"Behind"/g) || []).length;
        console.log(`  ${rel} (${hits}×)`);
        changed++;
      }
    }
  }
}

console.log('🔄 Renaming "Behind" → "High Risk"...\n');
for (const root of ROOTS) {
  if (fs.existsSync(root)) walk(root);
}
console.log(`\n✅ ${changed} files updated (${scanned} scanned).`);
