const fs = require('fs');
const path = require('path');

// Helper to check and read files from potential paths
function readFirstExistingFile(paths, customFs = fs, customPath = path) {
  if (!paths || !Array.isArray(paths)) return null;
  for (const filePath of paths) {
    const absolutePath = customPath.resolve(filePath);
    if (customFs.existsSync(absolutePath)) {
      console.log(`Found file: ${absolutePath}`);
      return customFs.readFileSync(absolutePath, 'utf8');
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

// Parse Backend TRX test results
function parseTrxResults(content) {
  if (!content) return null;
  const counters = parseXmlAttributes(content, 'Counters');
  if (!counters) return null;
  return {
    total: parseInt(counters.total || 0, 10),
    passed: parseInt(counters.passed || 0, 10),
    failed: parseInt(counters.failed || 0, 10),
    skipped: parseInt(counters.skipped || 0, 10)
  };
}

// Parse Backend Cobertura coverage
function parseCoberturaCoverage(content) {
  if (!content) return null;
  const cov = parseXmlAttributes(content, 'coverage');
  if (!cov) return null;
  const lineRate = parseFloat(cov['line-rate'] || 0) * 100;
  const branchRate = parseFloat(cov['branch-rate'] || 0) * 100;
  return {
    lineRate: lineRate.toFixed(2),
    branchRate: branchRate.toFixed(2),
    linesCovered: parseInt(cov['lines-covered'] || 0, 10),
    linesTotal: parseInt(cov['lines-valid'] || 0, 10),
    branchesCovered: parseInt(cov['branches-covered'] || 0, 10),
    branchesTotal: parseInt(cov['branches-valid'] || 0, 10)
  };
}

// Parse Frontend Jest JSON test results
function parseJestResults(content) {
  if (!content) return null;
  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content;
    return {
      total: data.numTotalTests || 0,
      passed: data.numPassedTests || 0,
      failed: data.numFailedTests || 0,
      skipped: data.numPendingTests || 0
    };
  } catch (e) {
    console.error('Failed to parse Frontend Test JSON:', e.message);
    return null;
  }
}

// Parse Frontend Clover XML coverage
function parseCloverCoverage(content) {
  if (!content) return null;
  const metrics = parseXmlAttributes(content, 'metrics');
  if (!metrics) return null;
  const statements = parseFloat(metrics.statements || 0);
  const coveredStatements = parseFloat(metrics.coveredstatements || 0);
  const conditionals = parseFloat(metrics.conditionals || 0);
  const coveredConditionals = parseFloat(metrics.coveredconditionals || 0);

  const lineRate = statements > 0 ? (coveredStatements / statements) * 100 : 0;
  const branchRate = conditionals > 0 ? (coveredConditionals / conditionals) * 100 : 0;

  return {
    lineRate: lineRate.toFixed(2),
    branchRate: branchRate.toFixed(2),
    linesCovered: coveredStatements,
    linesTotal: statements,
    branchesCovered: coveredConditionals,
    branchesTotal: conditionals
  };
}

// Parse Playwright JSON test results
function parsePlaywrightResults(content) {
  if (!content) return null;
  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content;
    if (data && data.stats) {
      const expected = data.stats.expected || 0;
      const unexpected = data.stats.unexpected || 0;
      const flaky = data.stats.flaky || 0;
      const skipped = data.stats.skipped || 0;

      return {
        total: expected + unexpected + flaky + skipped,
        passed: expected + flaky,
        failed: unexpected,
        skipped: skipped
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to parse Playwright JSON:', e.message);
    return null;
  }
}

// Helper to find mutation report
function findMutationReport(dir, targetFile, customFs = fs, customPath = path) {
  if (!customFs.existsSync(dir)) return null;
  try {
    const files = customFs.readdirSync(dir);
    for (const file of files) {
      const fullPath = customPath.join(dir, file);
      if (customFs.statSync(fullPath).isDirectory()) {
        const res = findMutationReport(fullPath, targetFile, customFs, customPath);
        if (res) return res;
      } else if (file === targetFile) {
        return fullPath;
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dir}:`, e.message);
  }
  return null;
}

// Helper to parse single Stryker JSON report
function parseStrykerData(reportPath, customFs = fs) {
  if (!reportPath || !customFs.existsSync(reportPath)) return null;
  try {
    const content = customFs.readFileSync(reportPath, 'utf8');
    const data = JSON.parse(content);
    let total = 0;
    let killed = 0;
    let survived = 0;
    if (data.files) {
      for (const file in data.files) {
        const mutants = data.files[file].mutants || [];
        for (const mutant of mutants) {
          total++;
          if (mutant.status === 'Killed' || mutant.status === 'Timeout') killed++;
          if (mutant.status === 'Survived' || mutant.status === 'NoCoverage') survived++;
        }
      }
    }
    let score = '0.00';
    if (total > 0) score = ((killed / total) * 100).toFixed(2);
    return { total, killed, survived, score };
  } catch (e) {
    console.error('Failed to parse Stryker report:', e.message);
    return null;
  }
}

// Parse Stryker mutation reports
function parseStrykerMutation(beReportPath, feReportPath, customFs = fs) {
  return {
    backend: parseStrykerData(beReportPath, customFs),
    frontend: parseStrykerData(feReportPath, customFs)
  };
}

// Build Markdown Summary from test and coverage data
function buildMarkdownSummary({
  backendTests,
  backendCoverage,
  frontendTests,
  frontendCoverage,
  playwrightTests,
  mutationReport,
  frontendMutationReport
}) {
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

  // Mutation Testing Table
  if (mutationReport || frontendMutationReport) {
    markdown += `### 🧬 Mutation Testing Report\n\n`;
    markdown += `| Component | Total Mutants | Killed | Survived | Mutation Score |\n`;
    markdown += `| :--- | :---: | :---: | :---: | :---: |\n`;
    if (mutationReport) {
      markdown += `| **Backend (.NET Stryker)** | ${mutationReport.total} | ${mutationReport.killed} | ${mutationReport.survived} | **${mutationReport.score}%** |\n`;
    }
    if (frontendMutationReport) {
      markdown += `| **Frontend (StrykerJS)** | ${frontendMutationReport.total} | ${frontendMutationReport.killed} | ${frontendMutationReport.survived} | **${frontendMutationReport.score}%** |\n`;
    }
    markdown += `\n`;
  }

  return markdown;
}

// Main execution function
function generateSummary(options = {}) {
  const env = options.env || process.env;
  const fileSystem = options.fs || fs;
  const pathModule = options.path || path;

  console.log('--- Starting CI Summary Generation ---');

  // 1. Resolve and parse Backend Test Results (TRX)
  const backendTestContent = readFirstExistingFile([
    'artifacts/backend-test-results/test-results.trx',
    'apps/api/src/Portfolio.Tests/TestResults/test-results.trx'
  ], fileSystem, pathModule);
  const backendTests = parseTrxResults(backendTestContent);

  // 2. Resolve and parse Backend Coverage (Cobertura)
  const backendCovContent = readFirstExistingFile([
    'artifacts/backend-coverage/coverage.cobertura.xml',
    'apps/api/src/Portfolio.Tests/coverage.cobertura.xml'
  ], fileSystem, pathModule);
  const backendCoverage = parseCoberturaCoverage(backendCovContent);

  // 3. Resolve and parse Frontend Test Results (Jest JSON)
  const frontendTestContent = readFirstExistingFile([
    'artifacts/frontend-test-results/jest-results.json',
    'apps/web/jest-results.json'
  ], fileSystem, pathModule);
  const frontendTests = parseJestResults(frontendTestContent);

  // 4. Resolve and parse Frontend Coverage (Clover XML)
  const frontendCovContent = readFirstExistingFile([
    'artifacts/frontend-coverage/clover.xml',
    'apps/web/coverage/clover.xml'
  ], fileSystem, pathModule);
  const frontendCoverage = parseCloverCoverage(frontendCovContent);

  // 5. Resolve and parse Playwright Test Results
  const playwrightTestContent = readFirstExistingFile([
    'artifacts/playwright-test-results/playwright-results.json',
    'apps/web/playwright-results.json'
  ], fileSystem, pathModule);
  const playwrightTests = parsePlaywrightResults(playwrightTestContent);

  // 6. Resolve and parse Stryker Mutation Test Results
  const beReportPath = findMutationReport('artifacts/mutation-report', 'mutation-report.json', fileSystem, pathModule) ||
                       findMutationReport('apps/api/src/Portfolio.Tests/StrykerOutput', 'mutation-report.json', fileSystem, pathModule);
  const feReportPath = findMutationReport('artifacts/frontend-mutation-report', 'mutation.json', fileSystem, pathModule) ||
                       findMutationReport('apps/web/reports/mutation', 'mutation.json', fileSystem, pathModule);
  const { backend: mutationReport, frontend: frontendMutationReport } = parseStrykerMutation(beReportPath, feReportPath, fileSystem);

  // 7. Generate Markdown summary
  const markdown = buildMarkdownSummary({
    backendTests,
    backendCoverage,
    frontendTests,
    frontendCoverage,
    playwrightTests,
    mutationReport,
    frontendMutationReport
  });

  // 8. Write output to GITHUB_STEP_SUMMARY or local file
  const summaryFile = env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fileSystem.appendFileSync(summaryFile, markdown, 'utf8');
    console.log(`Successfully wrote summary report to GITHUB_STEP_SUMMARY: ${summaryFile}`);
  } else {
    const localReportPath = pathModule.resolve('ci-summary-report.md');
    fileSystem.writeFileSync(localReportPath, markdown, 'utf8');
    console.log(`Local run detected. Wrote report to: ${localReportPath}`);
    console.log(markdown);
  }

  return markdown;
}

if (require.main === module) {
  try {
    generateSummary();
  } catch (err) {
    console.error('Fatal execution error:', err);
    process.exit(1);
  }
}

module.exports = {
  readFirstExistingFile,
  parseXmlAttributes,
  parseTrxResults,
  parseCoberturaCoverage,
  parseJestResults,
  parseCloverCoverage,
  parsePlaywrightResults,
  parseStrykerMutation,
  buildMarkdownSummary,
  generateSummary
};
