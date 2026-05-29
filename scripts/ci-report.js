const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const model = process.env.AI_MODEL || 'qwen3-coder-32b';
const apiUrl = process.env.AI_URL || 'https://api.ollama.cloud/v1/chat/completions';
const apiKey = process.env.AI_API_KEY;

module.exports = async function(github, context, core) {
  const { GITHUB_WORKSPACE } = process.env;

  function exec(cmd, opts = {}) {
    try {
      return execSync(cmd, { encoding: 'utf-8', timeout: 15000, ...opts }).trim();
    } catch (e) {
      if (opts.fatal) throw e;
      return '';
    }
  }

  function extractPackageNames(jobs) {
    const names = new Set();
    const knownDirs = fs.readdirSync(path.join(GITHUB_WORKSPACE, 'packages'))
      .filter(d => fs.statSync(path.join(GITHUB_WORKSPACE, 'packages', d)).isDirectory());
    for (const job of jobs) {
      const match = job.name.match(/\(([^)]+)\)/);
      if (match && knownDirs.includes(match[1])) names.add(match[1]);
      for (const step of (job.steps || [])) {
        for (const d of knownDirs) {
          if (step.name.toLowerCase().includes(d)) names.add(d);
        }
      }
    }
    return [...names];
  }

  function readPackageConfig(pkgName) {
    const p = path.join(GITHUB_WORKSPACE, 'packages', pkgName, 'package.toml');
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf-8');
    const name = raw.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
    const ver = raw.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
    const build = raw.match(/^build\s*=\s*"([^"]+)"/m)?.[1];
    const toolchain = raw.match(/^toolchain\s*=\s*"([^"]+)"/m)?.[1];
    const buildDeps = raw.match(/\[depends\]\s*\nbuild\s*=\s*\[([\s\S]*?)\]/)?.[1];
    const upstreamRepo = raw.match(/^repo\s*=\s*"([^"]+)"/m)?.[1];
    return { name, version: ver, build, toolchain, buildDeps, upstreamRepo, raw };
  }

  function getGitHistory(pkgName) {
    const log = exec(`git log --oneline -15 -- packages/${pkgName}/`);
    return log || 'No recent changes';
  }

  function searchCodebase(patterns) {
    const results = [];
    for (const p of patterns) {
      if (p.length < 3) continue;
      const out = exec(`git grep -in "${p.replace(/"/g, '\\"')}" -- packages/ 2>/dev/null || true`);
      if (out) results.push(`### "${p}"\n${out.slice(0, 1000)}`);
    }
    return results.join('\n\n') || 'No relevant matches found.';
  }

  function getFailedLogs(runId) {
    const raw = exec(`gh run view ${runId} --log-failed 2>/dev/null || true`, { timeout: 30000 });
    if (!raw) return '';
    const lines = raw.split('\n').filter(l => l.trim());
    if (lines.length > 100) return lines.slice(0, 100).join('\n') + '\n... [truncated]';
    return raw;
  }

  function getRecentChanges() {
    const diff = exec('git diff --name-only HEAD~5 HEAD 2>/dev/null || true');
    const msg = exec('git log --oneline -5 HEAD 2>/dev/null || true');
    return { changedFiles: diff, recentCommits: msg };
  }

  const jobs = await getFailedJobs(github, context);
  const { data: run } = await github.rest.actions.getWorkflowRun({
    ...context.repo, run_id: context.runId,
  });

  const pkgNames = extractPackageNames(jobs, run);
  const logSnippet = getFailedLogs(context.runId);

  const { data: issue } = await github.rest.issues.create({
    ...context.repo,
    title: `CI Failed: ${context.workflow} #${context.runId}`,
    body: buildIssueBody(jobs, run, pkgNames),
    labels: ['ci-failure'],
  });
  core.notice(`Created issue #${issue.number}`);

  if (!apiKey) {
    core.notice('No AI_API_KEY set, skipping AI analysis');
    return;
  }

  const instructions = loadInstructions();
  if (!instructions) {
    core.warning('scripts/ai-instructions.md not found, skipping AI analysis');
    return;
  }

  const pkgs = pkgNames.map(n => readPackageConfig(n)).filter(Boolean);
  const gitHistories = {};
  for (const n of pkgNames) gitHistories[n] = getGitHistory(n);

  const errorKeywords = jobs.flatMap(j => {
    const kw = [];
    for (const s of (j.steps || [])) {
      if (s.conclusion === 'failure') kw.push(s.name.split(':')[0].split(/\s+/).filter(w => w.length > 3).slice(0, 3).join(' '));
    }
    return kw;
  }).filter(Boolean);
  const codeMatches = searchCodebase([...new Set(errorKeywords)]);

  const changes = getRecentChanges();
  const commitMsg = (run.head_commit?.message || 'N/A').split('\n')[0];
  const changedFilesList = [...new Set(
    (run.head_commit?.modified || [])
      .concat(run.head_commit?.added || [])
      .concat(run.head_commit?.removed || [])
  )].join('\n') || 'N/A';

  const userPrompt = [
    `CI workflow "${context.workflow}" failed. Repository: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}`,
    `Branch: ${context.ref} | Commit: ${context.sha}`,
    `Commit message: ${commitMsg}`,
    ``,
    `### Files changed (last 5 commits)\n${changes.changedFiles || 'N/A'}`,
    ``,
    `### Recent commits\n${changes.recentCommits || 'N/A'}`,
    ``,
    `### Failed jobs\n${jobs.map(j => `- ${j.name}: ${j.conclusion}${j.steps ? j.steps.filter(s => s.conclusion === 'failure').map(s => `\n  → ${s.name}`).join('') : ''}`).join('\n')}`,
    ``,
    pkgs.length ? `### Package configs\n${pkgs.map(p => [
      `Package: ${p.name || '?'}`,
      `Version: ${p.version || '?'}`,
      `Upstream: ${p.upstreamRepo || '?'}`,
      `Build: ${p.build || '?'}`,
      `Toolchain: ${p.toolchain || 'default'}`,
      `Build deps: ${p.buildDeps ? p.buildDeps.replace(/\n/g, ' ').replace(/"/g, '') : '?'}`,
    ].join('\n')).join('\n\n')}` : '',
    ``,
    pkgNames.length ? `### Git history for affected packages\n${pkgNames.map(n => `${n}:\n${gitHistories[n]}`).join('\n\n')}` : '',
    ``,
    codeMatches ? `### Code search results\n${codeMatches}` : '',
    ``,
    logSnippet ? `### Failed step logs\n\`\`\`\n${logSnippet}\n\`\`\`` : '',
    ``,
    changedFilesList !== 'N/A' ? `### Files changed in this commit\n${changedFilesList}` : '',
    ``,
    `Phân tích nguyên nhân failure và đề xuất cách fix cụ thể.`,
    `Nếu log không đủ, nêu rõ cần xem log chi tiết step nào.`,
  ].filter(Boolean).join('\n');

  try {
    const analysis = await callAI(instructions, userPrompt);
    if (analysis) {
      await github.rest.issues.createComment({
        ...context.repo,
        issue_number: issue.number,
        body: `## 🤖 AI Analysis\n**Model:** ${model}\n\n${analysis}`,
      });
      core.notice('AI analysis posted to issue');
    }
  } catch (e) {
    core.error(`AI analysis failed: ${e.message}`);
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: issue.number,
      body: `⚠️ AI analysis failed: \`${e.message}\``,
    });
  }
};

async function getFailedJobs(github, context) {
  const { data } = await github.rest.actions.listJobsForWorkflowRun({
    ...context.repo, run_id: context.runId,
  });
  return data.jobs.filter(j => j.conclusion === 'failure');
}

function buildIssueBody(jobs, run, pkgNames) {
  const lines = [
    `## ❌ CI Build Failure`,
    ``,
    `**Run:** [${run.id}](${run.html_url})`,
    `**Branch:** \`${run.head_branch}\``,
    `**Commit:** \`${run.head_sha}\``,
    ``,
    `### Failed Jobs`,
    ...jobs.map(j => {
      const steps = (j.steps || []).filter(s => s.conclusion === 'failure').map(s => `  - \`${s.name}\``).join('\n');
      return `- **${j.name}**\n${steps}`;
    }),
    ``,
    pkgNames.length ? `### Affected Packages\n${pkgNames.map(n => `- \`${n}\``).join('\n')}` : '',
    ``,
    `---`,
    `*Đang chờ AI analysis...*`,
  ];
  return lines.filter(Boolean).join('\n');
}

function loadInstructions() {
  const p = path.join(process.env.GITHUB_WORKSPACE, 'scripts', 'ai-instructions.md');
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

async function callAI(systemPrompt, userPrompt) {
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? data.message?.content;
}
