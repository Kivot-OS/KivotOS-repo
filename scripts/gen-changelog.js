const { execSync } = require('child_process');

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 15000 }).trim();
  } catch {
    return '';
  }
}

function groupCommits(log) {
  const groups = { feat: [], fix: [], chore: [], revert: [], other: [] };
  for (const line of log.split('\n').filter(Boolean)) {
    const stripped = line.replace(/^[0-9a-f]+\s*/, '');
    if (/^feat/i.test(stripped)) groups.feat.push(line);
    else if (/^fix/i.test(stripped)) groups.fix.push(line);
    else if (/^revert/i.test(stripped)) groups.revert.push(line);
    else if (/^chore/i.test(stripped)) groups.chore.push(line);
    else groups.other.push(line);
  }
  return groups;
}

function extractPackage(line) {
  const m = line.match(/\((\w+)\)/);
  return m ? m[1] : null;
}

function groupByPackage(log) {
  const pkgs = {};
  for (const line of log.split('\n').filter(Boolean)) {
    const pkg = extractPackage(line);
    if (pkg) {
      pkgs[pkg] = pkgs[pkg] || [];
      pkgs[pkg].push(line);
    }
  }
  return pkgs;
}

function generateMarkdown(fromTag, toTag, log) {
  const byType = groupCommits(log);
  const byPkg = groupByPackage(log);

  const date = new Date().toISOString().split('T')[0];
  const lines = [`## ${toTag} (${date})`, ''];

  if (byType.feat.length) {
    lines.push('### Features', '');
    for (const c of byType.feat) lines.push(`- ${c.replace(/^feat(\([^)]+\))?:\s*/i, '')}`);
    lines.push('');
  }

  if (byType.fix.length) {
    lines.push('### Bug Fixes', '');
    for (const c of byType.fix) lines.push(`- ${c.replace(/^fix(\([^)]+\))?:\s*/i, '')}`);
    lines.push('');
  }

  if (byType.revert.length) {
    lines.push('### Reverts', '');
    for (const c of byType.revert) lines.push(`- ${c.replace(/^revert(\([^)]+\))?:\s*/i, '')}`);
    lines.push('');
  }

  if (byType.chore.length) {
    lines.push('### Chores', '');
    for (const c of byType.chore) lines.push(`- ${c.replace(/^chore(\([^)]+\))?:\s*/i, '')}`);
    lines.push('');
  }

  if (Object.keys(byPkg).length) {
    lines.push('### By Package', '');
    for (const [pkg, commits] of Object.entries(byPkg)) {
      lines.push(`**${pkg}:**`);
      for (const c of commits) {
        lines.push(`  - ${c.replace(/\(\w+\)\s*/, '')}`);
      }
      lines.push('');
    }
  }

  if (byType.other.length) {
    lines.push('### Other', '');
    for (const c of byType.other) lines.push(`- ${c}`);
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  const fromTag = process.argv[2] || exec('git describe --tags --abbrev=0 HEAD~1 2>/dev/null');
  const toTag = process.argv[3] || exec('git describe --tags --abbrev=0 HEAD 2>/dev/null') || 'HEAD';

  if (!fromTag) {
    const log = exec('git log --oneline -30');
    console.log(generateMarkdown('beginning', toTag, log));
    return;
  }

  const log = exec(`git log ${fromTag}..HEAD --oneline --no-decorate`);
  if (!log) {
    console.log(`No changes since ${fromTag}.`);
    return;
  }

  console.log(generateMarkdown(fromTag, toTag, log));
}

if (require.main === module) main();
module.exports = { generateMarkdown, groupCommits, groupByPackage };
