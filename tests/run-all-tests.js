#!/usr/bin/env node
/**
 * Comprehensive Test Runner
 * Executes all testing frameworks with proper sequencing and reporting
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.results = {
            unit: null,
            playwright: null,
            cypress: null,
            selenium: null,
            performance: null,
            integration: null
        };
        this.startTime = Date.now();
        this.serverProcess = null;
    }

    async run() {
        console.log('🚀 Starting Comprehensive Test Suite');
        console.log('=====================================\n');

        try {
            // 1. Install dependencies if needed
            await this.checkDependencies();
            
            // 2. Start development server
            await this.startServer();
            
            // 3. Run test suites in sequence
            await this.runUnitTests();
            await this.runPlaywrightTests();
            await this.runCypressTests();
            await this.runSeleniumTests();
            await this.runPerformanceTests();
            await this.runIntegrationTests();
            
            // 4. Generate comprehensive report
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        } finally {
            await this.cleanup();
        }
    }

    async checkDependencies() {
        console.log('📦 Checking dependencies...');
        
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const devDeps = packageJson.devDependencies || {};
        
        const requiredPackages = [
            'playwright',
            'cypress', 
            'selenium-webdriver',
            'vitest',
            '@vitest/ui'
        ];

        const missing = requiredPackages.filter(pkg => !devDeps[pkg]);
        
        if (missing.length > 0) {
            console.log(`📥 Installing missing packages: ${missing.join(', ')}`);
            execSync(`npm install --save-dev ${missing.join(' ')}`, { stdio: 'inherit' });
        }
        
        console.log('✅ Dependencies verified\n');
    }

    async startServer() {
        console.log('🌐 Starting development server...');
        
        return new Promise((resolve, reject) => {
            this.serverProcess = spawn('npm', ['run', 'start:8082'], {
                detached: true,
                stdio: 'pipe'
            });

            // Wait for server to be ready
            setTimeout(async () => {
                try {
                    const response = await fetch('http://127.0.0.1:8082');
                    if (response.ok) {
                        console.log('✅ Server running on http://127.0.0.1:8082\n');
                        resolve();
                    } else {
                        reject(new Error('Server not responding'));
                    }
                } catch (error) {
                    reject(error);
                }
            }, 3000);
        });
    }

    async runCommand(command, args, description) {
        console.log(`🔧 ${description}...`);
        
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const child = spawn(command, args, {
                stdio: 'pipe',
                shell: true
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                const duration = Date.now() - startTime;
                const result = {
                    success: code === 0,
                    duration,
                    stdout,
                    stderr,
                    exitCode: code
                };

                if (code === 0) {
                    console.log(`✅ ${description} completed (${duration}ms)\n`);
                } else {
                    console.log(`❌ ${description} failed (${duration}ms)`);
                    console.log(`   Exit code: ${code}`);
                    if (stderr) console.log(`   Error: ${stderr.slice(0, 200)}...\n`);
                }

                resolve(result);
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    async runUnitTests() {
        this.results.unit = await this.runCommand(
            'npm',
            ['run', 'test:unit'],
            'Running unit tests with Vitest'
        );
    }

    async runPlaywrightTests() {
        // Install browsers if needed
        try {
            execSync('npx playwright install --with-deps', { stdio: 'pipe' });
        } catch (e) {
            console.log('⚠️  Playwright browsers installation skipped');
        }

        this.results.playwright = await this.runCommand(
            'npx',
            ['playwright', 'test', '--config=playwright.config.js'],
            'Running E2E tests with Playwright'
        );
    }

    async runCypressTests() {
        this.results.cypress = await this.runCommand(
            'npx',
            ['cypress', 'run', '--config-file', 'cypress.config.js'],
            'Running interactive tests with Cypress'
        );
    }

    async runSeleniumTests() {
        this.results.selenium = await this.runCommand(
            'node',
            ['tests/selenium/selenium-test.js'],
            'Running cross-browser tests with Selenium'
        );
    }

    async runPerformanceTests() {
        try {
            // Install Lighthouse CI if not present
            execSync('npm install -g @lhci/cli', { stdio: 'pipe' });
            
            this.results.performance = await this.runCommand(
                'lhci',
                ['autorun', '--config=.lighthouserc.js'],
                'Running performance tests with Lighthouse'
            );
        } catch (error) {
            console.log('⚠️  Performance tests skipped (Lighthouse CI not available)');
            this.results.performance = { success: false, skipped: true };
        }
    }

    async runIntegrationTests() {
        // Create a simple integration test that validates all components work together
        this.results.integration = await this.runCommand(
            'node',
            ['quick-test.js'],
            'Running integration validation tests'
        );
    }

    async generateReport() {
        const endTime = Date.now();
        const totalDuration = endTime - this.startTime;
        
        console.log('\n📊 TEST SUITE RESULTS');
        console.log('====================');
        
        const report = {
            timestamp: new Date().toISOString(),
            totalDuration: totalDuration,
            results: this.results,
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            }
        };

        Object.entries(this.results).forEach(([suite, result]) => {
            if (result) {
                report.summary.total++;
                if (result.skipped) {
                    report.summary.skipped++;
                    console.log(`⚠️  ${suite.toUpperCase()}: SKIPPED`);
                } else if (result.success) {
                    report.summary.passed++;
                    console.log(`✅ ${suite.toUpperCase()}: PASSED (${result.duration}ms)`);
                } else {
                    report.summary.failed++;
                    console.log(`❌ ${suite.toUpperCase()}: FAILED (${result.duration}ms)`);
                }
            }
        });

        console.log('\n📈 SUMMARY');
        console.log(`   Total: ${report.summary.total}`);
        console.log(`   Passed: ${report.summary.passed}`);
        console.log(`   Failed: ${report.summary.failed}`);
        console.log(`   Skipped: ${report.summary.skipped}`);
        console.log(`   Duration: ${Math.round(totalDuration / 1000)}s`);

        // Save detailed report
        const reportsDir = 'tests/reports';
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(reportsDir, 'comprehensive-report.json'),
            JSON.stringify(report, null, 2)
        );

        // Generate HTML report
        const htmlReport = this.generateHtmlReport(report);
        fs.writeFileSync(
            path.join(reportsDir, 'comprehensive-report.html'),
            htmlReport
        );

        console.log(`\n📄 Reports saved to: ${reportsDir}/`);
        
        // Exit with appropriate code
        const hasFailures = report.summary.failed > 0;
        if (hasFailures) {
            console.log('\n❌ Test suite completed with failures');
            process.exit(1);
        } else {
            console.log('\n✅ All tests passed successfully!');
        }
    }

    generateHtmlReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Suite Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007acc; }
        .passed { border-left-color: #28a745; }
        .failed { border-left-color: #dc3545; }
        .skipped { border-left-color: #ffc107; }
        .suite { margin: 10px 0; padding: 15px; border-radius: 8px; }
        .suite.success { background: #d4edda; border: 1px solid #c3e6cb; }
        .suite.failure { background: #f8d7da; border: 1px solid #f5c6cb; }
        .suite.skipped { background: #fff3cd; border: 1px solid #ffeaa7; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Test Suite Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Duration: ${Math.round(report.totalDuration / 1000)}s</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <p style="font-size: 24px; margin: 0;">${report.summary.total}</p>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <p style="font-size: 24px; margin: 0; color: #28a745;">${report.summary.passed}</p>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <p style="font-size: 24px; margin: 0; color: #dc3545;">${report.summary.failed}</p>
        </div>
        <div class="metric skipped">
            <h3>Skipped</h3>
            <p style="font-size: 24px; margin: 0; color: #ffc107;">${report.summary.skipped}</p>
        </div>
    </div>

    <h2>Test Suite Details</h2>
    ${Object.entries(report.results).map(([suite, result]) => {
        if (!result) return '';
        const status = result.skipped ? 'skipped' : (result.success ? 'success' : 'failure');
        return `
        <div class="suite ${status}">
            <h3>${suite.toUpperCase()}</h3>
            <p>Status: ${result.skipped ? 'SKIPPED' : (result.success ? 'PASSED' : 'FAILED')}</p>
            ${result.duration ? `<p>Duration: ${result.duration}ms</p>` : ''}
            ${result.stderr ? `<details><summary>Error Output</summary><pre>${result.stderr}</pre></details>` : ''}
        </div>`;
    }).join('')}
</body>
</html>`;
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up...');
        
        if (this.serverProcess) {
            try {
                process.kill(-this.serverProcess.pid);
                console.log('✅ Server stopped');
            } catch (error) {
                console.log('⚠️  Server cleanup warning:', error.message);
            }
        }
    }
}

// Run the test suite if this file is executed directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.run();
}

module.exports = TestRunner;
