const test = require('node:test');
const assert = require('node:assert');
const {
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
} = require('./generate-summary.js');

test('parseXmlAttributes parses XML attributes correctly', () => {
  const xml = '<Counters total="10" passed="8" failed="1" skipped="1" />';
  const attrs = parseXmlAttributes(xml, 'Counters');
  assert.ok(attrs);
  assert.strictEqual(attrs.total, "10");
  assert.strictEqual(attrs.passed, "8");
  assert.strictEqual(attrs.failed, "1");
  assert.strictEqual(attrs.skipped, "1");
});

test('parseTrxResults parses TRX test counts accurately', () => {
  const trxContent = `
    <?xml version="1.0" encoding="utf-8"?>
    <TestRun id="123">
      <ResultSummary outcome="Completed">
        <Counters total="10" passed="8" failed="1" skipped="1" />
      </ResultSummary>
    </TestRun>
  `;
  const parsed = parseTrxResults(trxContent);
  assert.deepStrictEqual(parsed, { total: 10, passed: 8, failed: 1, skipped: 1 });
});

test('parseCoberturaCoverage calculates percentage rates correctly', () => {
  const coberturaXml = `
    <?xml version="1.0" encoding="utf-8"?>
    <coverage line-rate="0.855" branch-rate="0.75" lines-covered="855" lines-valid="1000" branches-covered="75" branches-valid="100">
    </coverage>
  `;
  const parsed = parseCoberturaCoverage(coberturaXml);
  assert.ok(parsed);
  assert.strictEqual(parsed.lineRate, "85.50");
  assert.strictEqual(parsed.branchRate, "75.00");
  assert.strictEqual(parsed.linesCovered, 855);
  assert.strictEqual(parsed.linesTotal, 1000);
});

test('parseJestResults extracts Jest suite metrics', () => {
  const jestJson = JSON.stringify({
    numTotalTests: 20,
    numPassedTests: 18,
    numFailedTests: 2,
    numPendingTests: 0
  });
  const parsed = parseJestResults(jestJson);
  assert.deepStrictEqual(parsed, { total: 20, passed: 18, failed: 2, skipped: 0 });
});

test('parsePlaywrightResults extracts E2E execution stats', () => {
  const playwrightJson = JSON.stringify({
    stats: {
      expected: 5,
      unexpected: 0,
      flaky: 0,
      skipped: 0
    }
  });
  const parsed = parsePlaywrightResults(playwrightJson);
  assert.deepStrictEqual(parsed, { total: 5, passed: 5, failed: 0, skipped: 0 });
});

test('buildMarkdownSummary generates markdown table without AI call', () => {
  const markdown = buildMarkdownSummary({
    backendTests: { total: 10, passed: 8, failed: 2, skipped: 0 },
    backendCoverage: { lineRate: '85.50', branchRate: '75.00', linesCovered: 855, linesTotal: 1000, branchesCovered: 75, branchesTotal: 100 },
    frontendTests: { total: 20, passed: 18, failed: 2, skipped: 0 },
    frontendCoverage: { lineRate: '90.00', branchRate: '80.00', linesCovered: 90, linesTotal: 100, branchesCovered: 80, branchesTotal: 100 },
    playwrightTests: { total: 5, passed: 5, failed: 0, skipped: 0 },
    mutationReport: { total: 100, killed: 80, survived: 20, score: '80.00' },
    frontendMutationReport: null
  });

  assert.ok(markdown.includes("CI/CD Test & Coverage Summary"));
  assert.ok(markdown.includes("Backend (.NET)"));
  assert.ok(markdown.includes("Frontend (Jest)"));
  assert.ok(markdown.includes("End-to-End (Playwright)"));
  assert.ok(markdown.includes("Backend (.NET Stryker)"));
  assert.ok(!markdown.includes("AI Analysis & Recommendations"));
});

test('parseCloverCoverage parses Clover coverage XML correctly', () => {
  const cloverXml = `
    <coverage>
      <project>
        <metrics statements="100" coveredstatements="85" conditionals="50" coveredconditionals="40" />
      </project>
    </coverage>
  `;
  const parsed = parseCloverCoverage(cloverXml);
  assert.ok(parsed);
  assert.strictEqual(parsed.lineRate, "85.00");
  assert.strictEqual(parsed.branchRate, "80.00");
});

test('handles missing or null input gracefully', () => {
  assert.strictEqual(parseTrxResults(null), null);
  assert.strictEqual(parseCoberturaCoverage(null), null);
  assert.strictEqual(parseJestResults(null), null);
  assert.strictEqual(parseCloverCoverage(null), null);
  assert.strictEqual(parsePlaywrightResults(null), null);
  assert.strictEqual(readFirstExistingFile(null), null);
  assert.strictEqual(readFirstExistingFile([]), null);
});
