const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class TestRunner {
  constructor() {
    this.testDir = path.join(__dirname, "tests");
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTests() {
    console.log("🧪 Starting test runner...\n");

    if (!fs.existsSync(this.testDir)) {
      console.log("❌ No tests directory found");
      return;
    }

    const testFiles = fs.readdirSync(this.testDir)
      .filter(file => file.endsWith(".test.js"));

    if (testFiles.length === 0) {
      console.log("❌ No test files found");
      return;
    }

    for (const testFile of testFiles) {
      await this.runTestFile(testFile);
    }

    this.printResults();
  }

  async runTestFile(testFile) {
    const testPath = path.join(this.testDir, testFile);
    console.log(`Running ${testFile}...`);

    try {
      const output = execSync(`node ${testPath}`, { encoding: "utf8" });
      console.log(`✅ ${testFile} passed`);
      this.results.passed++;
    } catch (error) {
      console.log(`❌ ${testFile} failed`);
      this.results.failed++;
      this.results.errors.push({
        file: testFile,
        error: error.message
      });
    }
  }

  printResults() {
    console.log("\n📊 Test Results:");
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);

    if (this.results.errors.length > 0) {
      console.log("\n🔍 Error Details:");
      this.results.errors.forEach(({ file, error }) => {
        console.log(`\n${file}:`);
        console.log(error);
      });
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runTests().catch(console.error);
}

module.exports = TestRunner;
