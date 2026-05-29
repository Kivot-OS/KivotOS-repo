// CI Failure Reporter
// Called from actions/github-script — receives github, context, core as params

const fs = require('fs');
const path = require('path');

const model = process.env.AI_MODEL || 'qwen3-coder-32b';
const apiUrl = process.env.AI_URL || 'https://api.ollama.cloud/v1/chat/completions';
const apiKey = process.env.AI_API_KEY;

module.exports = async function(github, context, core) {
  async function getFailedJobs() {
    const { data: jobs } = await github.rest.actions.listJobsForWorkflowRun({
      ...context.repo,
      run_id: context.runId,
    });
    return jobs.jobs.filter(j => j.conclusion === 'failure');
  }

  function getFailedSteps(jobs) {
    return jobs.flatMap(j =>
      (j.steps || []).filter(s => s.conclusion === 'failure')
        .map(s => `- **${j.name}** → \`${s.name}\``)
    );
  }

  function buildIssueBody(jobs, failedSteps, run) {
    let body = `## ❌ CI Build Failure\n\n`;
    body += `**Run:** [${context.runId}](${run.html_url})\n`;
    body += `**Branch:** \`${context.ref}\`\n`;
    body += `**Commit:** \`${context.sha}\`\n\n`;
    body += `### Failed Jobs\n${jobs.map(j => `- **${j.name}** (${j.conclusion})`).join('\n')}\n\n`;
    if (failedSteps.length) {
      body += `### Failed Steps\n${failedSteps.join('\n')}\n`;
    }
    body += `\n---\n*AI sẽ phân tích bên dưới.*`;
    return body;
  }

  function buildFailureDetail(jobs) {
    return jobs.map(j => {
      const steps = (j.steps || []).filter(s => s.conclusion === 'failure').map(s => s.name).join(', ');
      return `Job: ${j.name}\nStatus: ${j.conclusion}\nFailed steps: ${steps}\n`;
    }).join('\n');
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
        temperature: 0.1,
        max_tokens: 1200,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content;
  }

  const jobs = await getFailedJobs();
  const failedSteps = getFailedSteps(jobs);
  const { data: run } = await github.rest.actions.getWorkflowRun({
    ...context.repo,
    run_id: context.runId,
  });

  const { data: issue } = await github.rest.issues.create({
    ...context.repo,
    title: `CI Failed: ${context.workflow} #${context.runId}`,
    body: buildIssueBody(jobs, failedSteps, run),
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

  const repoUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}`;
  const commitMsg = (run.head_commit?.message || 'N/A').split('\n')[0];
  const changedFiles = (run.head_commit?.modified || []).join(', ') ||
    (run.head_commit?.added || []).join(', ') || 'N/A';

  const userPrompt = [
    `CI workflow "${context.workflow}" failed.`,
    ``,
    `Repository: ${repoUrl}`,
    `Branch: ${context.ref}`,
    `Commit: ${context.sha}`,
    ``,
    `Commit message: ${commitMsg}`,
    `Files changed: ${changedFiles}`,
    ``,
    `Failure details:`,
    `${buildFailureDetail(jobs)}`,
    ``,
    `Phân tích nguyên nhân và đề xuất cách fix.`,
  ].join('\n');

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
      body: `⚠️ AI analysis failed: \`${e.message}\`\n\nKiểm tra \`AI_API_KEY\`, \`AI_URL\`, \`AI_MODEL\` trong workflow env.`,
    });
  }
};
