const fs = require('fs');
const path = require('path');

// Helper to check and read files from potential paths
function readFirstExistingFile(paths) {
  for (const filePath of paths) {
    const absolutePath = path.resolve(filePath);
    if (fs.existsSync(absolutePath)) {
      console.log(`Found file: ${absolutePath}`);
      return fs.readFileSync(absolutePath, 'utf8');
    }
  }
  return null;
}

// Simple XML attribute parser
function parseXmlAttributes(xmlString, tagName) {
  if (!xmlString) return null;
  const regex = new RegExp(`<${tagName}\\s+([^>]+)>`, 'i');
  const match = xmlString.match(regex);
  if (!match) return null;
  const attrsString = match[1];
  const attrs = {};
  const attrRegex = /(\w+(?:-\w+)*)="([^"]*)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
    attrs[attrMatch[1]] = attrMatch[2];
  }
  return attrs;
}

// Main execution function
async function main() {
  console.log('--- Starting CI Summary Generation ---');

  // 1. Resolve and parse Backend Test Results (TRX)
  const backendTestContent = readFirstExistingFile([
    'artifacts/backend-test-results/test-results.trx',
    'apps/api/src/Portfolio.Tests/TestResults/test-results.trx'
  ]);
  let backendTests = null;
  if (backendTestContent) {
    const counters = parseXmlAttributes(backendTestContent, 'Counters');
    if (counters) {
      backendTests = {
        total: parseInt(counters.total || 0, 10),
        passed: parseInt(counters.passed || 0, 10),
        failed: parseInt(counters.failed || 0, 10),
        skipped: parseInt(counters.skipped || 0, 10)
      };
    }
  }

  // 2. Resolve and parse Backend Coverage (Cobertura)
  const backendCovContent = readFirstExistingFile([
    'artifacts/backend-coverage/coverage.cobertura.xml',
    'apps/api/src/Portfolio.Tests/coverage.cobertura.xml'
  ]);
  let backendCoverage = null;
  if (backendCovContent) {
    const cov = parseXmlAttributes(backendCovContent, 'coverage');
    if (cov) {
      const lineRate = parseFloat(cov['line-rate'] || 0) * 100;
      const branchRate = parseFloat(cov['branch-rate'] || 0) * 100;
      backendCoverage = {
        lineRate: lineRate.toFixed(2),
        branchRate: branchRate.toFixed(2),
        linesCovered: parseInt(cov['lines-covered'] || 0, 10),
        linesTotal: parseInt(cov['lines-valid'] || 0, 10),
        branchesCovered: parseInt(cov['branches-covered'] || 0, 10),
        branchesTotal: parseInt(cov['branches-valid'] || 0, 10)
      };
    }
  }

  // 3. Resolve and parse Frontend Test Results (Jest JSON)
  const frontendTestContent = readFirstExistingFile([
    'artifacts/frontend-test-results/jest-results.json',
    'apps/web/jest-results.json'
  ]);
  let frontendTests = null;
  if (frontendTestContent) {
    try {
      const data = JSON.parse(frontendTestContent);
      frontendTests = {
        total: data.numTotalTests || 0,
        passed: data.numPassedTests || 0,
        failed: data.numFailedTests || 0,
        skipped: data.numPendingTests || 0
      };
    } catch (e) {
      console.error('Failed to parse Frontend Test JSON:', e.message);
    }
  }

  // 4. Resolve and parse Frontend Coverage (Clover XML)
  const frontendCovContent = readFirstExistingFile([
    'artifacts/frontend-coverage/clover.xml',
    'apps/web/coverage/clover.xml'
  ]);
  let frontendCoverage = null;
  if (frontendCovContent) {
    const metrics = parseXmlAttributes(frontendCovContent, 'metrics');
    if (metrics) {
      const statements = parseFloat(metrics.statements || 0);
      const coveredStatements = parseFloat(metrics.coveredstatements || 0);
      const conditionals = parseFloat(metrics.conditionals || 0);
      const coveredConditionals = parseFloat(metrics.coveredconditionals || 0);
      
      const lineRate = statements > 0 ? (coveredStatements / statements) * 100 : 0;
      const branchRate = conditionals > 0 ? (coveredConditionals / conditionals) * 100 : 0;

      frontendCoverage = {
        lineRate: lineRate.toFixed(2),
        branchRate: branchRate.toFixed(2),
        linesCovered: coveredStatements,
        linesTotal: statements,
        branchesCovered: coveredConditionals,
        branchesTotal: conditionals
      };
    }
  }

  // 5. Resolve and parse Playwright Test Results
  const playwrightTestContent = readFirstExistingFile([
    'artifacts/playwright-test-results/playwright-results.json',
    'apps/web/playwright-results.json'
  ]);
  let playwrightTests = null;
  if (playwrightTestContent) {
    try {
      const data = JSON.parse(playwrightTestContent);
      if (data.stats) {
        playwrightTests = {
          total: data.stats.tests || 0,
          passed: data.stats.passes || 0,
          failed: data.stats.failures || 0,
          skipped: data.stats.skipped || 0
        };
      }
    } catch (e) {
      console.error('Failed to parse Playwright JSON:', e.message);
    }
  }

  // Generate Markdown summary
  let markdown = `# 🚀 CI/CD Test & Coverage Summary\n\n`;

  // Test Results Table
  markdown += `### 📊 Test Execution Results\n\n`;
  markdown += `| Test Suite | Total Tests | Passed | Failed | Skipped | Status |\n`;
  markdown += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

  const suites = [
    { name: 'Backend (.NET)', data: backendTests },
    { name: 'Frontend (Jest)', data: frontendTests },
    { name: 'End-to-End (Playwright)', data: playwrightTests }
  ];

  for (const suite of suites) {
    if (suite.data) {
      const status = suite.data.failed > 0 ? '❌ FAILED' : '✅ PASSED';
      markdown += `| **${suite.name}** | ${suite.data.total} | ${suite.data.passed} | ${suite.data.failed} | ${suite.data.skipped} | ${status} |\n`;
    } else {
      markdown += `| **${suite.name}** | - | - | - | - | 🚫 Not Run / Skipped |\n`;
    }
  }
  markdown += `\n`;

  // Coverage Table
  markdown += `### 📉 Code Coverage Report\n\n`;
  markdown += `| Component | Line Coverage | Branch Coverage | Details |\n`;
  markdown += `| :--- | :---: | :---: | :--- |\n`;

  const coverages = [
    { name: 'Backend (.NET)', data: backendCoverage, labels: ['lines', 'branches'] },
    { name: 'Frontend (Jest)', data: frontendCoverage, labels: ['statements', 'conditionals'] }
  ];

  for (const cov of coverages) {
    if (cov.data) {
      markdown += `| **${cov.name}** | ${cov.data.lineRate}% | ${cov.data.branchRate}% | ${cov.data.linesCovered}/${cov.data.linesTotal} ${cov.labels[0]}, ${cov.data.branchesCovered}/${cov.data.branchesTotal} ${cov.labels[1]} |\n`;
    } else {
      markdown += `| **${cov.name}** | - | - | 🚫 No Coverage Data |\n`;
    }
  }
  markdown += `\n`;

  // AI Summary section
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log('Gemini API key found, generating AI summary...');
    markdown += `### 🤖 AI Analysis & Recommendations\n\n`;
    try {
      const prompt = `You are an expert CI/CD and QA analyst. Review the following test execution and coverage results for a portfolio web application (C# .NET Backend, React/Next.js Frontend, Playwright E2E tests).
Provide a concise AI summary (2-3 paragraphs) analyzing the results:
1. Highlight any test failures or major coverage gaps (e.g. backend line coverage is very low at ~4.8% whereas frontend is higher).
2. Summarize the overall health of the codebase based on these metrics.
3. Provide actionable recommendations (e.g., target specific directories or write more unit/integration tests) to improve quality.

Data:
- Backend Tests: ${backendTests ? JSON.stringify(backendTests) : 'No data'}
- Backend Coverage: ${backendCoverage ? JSON.stringify(backendCoverage) : 'No data'}
- Frontend Tests: ${frontendTests ? JSON.stringify(frontendTests) : 'No data'}
- Frontend Coverage: ${frontendCoverage ? JSON.stringify(frontendCoverage) : 'No data'}
- Playwright E2E Tests: ${playwrightTests ? JSON.stringify(playwrightTests) : 'No data'}

Keep your response professional, constructive, and formatted in Markdown. Refer specifically to the backend and frontend components.`;

      const responseText = await callGemini(apiKey, prompt);
      markdown += responseText + `\n`;
    } catch (err) {
      console.error('Failed to generate AI summary:', err.message);
      markdown += `⚠️ *Could not generate AI summary due to API error: ${err.message}*\n`;
    }
  } else {
    console.log('No GEMINI_API_KEY environment variable set. Skipping AI summary.');
  }

  // Write output
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.writeFileSync(summaryFile, markdown, 'utf8');
    console.log(`Successfully wrote summary report to GITHUB_STEP_SUMMARY: ${summaryFile}`);
  } else {
    const localReportPath = path.resolve('ci-summary-report.md');
    fs.writeFileSync(localReportPath, markdown, 'utf8');
    console.log(`Local run detected. Wrote report to: ${localReportPath}`);
    console.log(markdown);
  }
}

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error('Unexpected empty response format from Gemini API');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
