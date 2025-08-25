// Quick test to verify server and basic functionality
const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Starting quick test suite...');

// Test 1: Check if server is running
function testServer() {
  return new Promise((resolve) => {
  const req = http.get('http://localhost:8082/index.html', (res) => {
      console.log(`✅ Server responding: ${res.statusCode}`);
      resolve(true);
    });
    req.on('error', (err) => {
      console.log(`❌ Server not responding: ${err.message}`);
      resolve(false);
    });
    req.setTimeout(2000, () => {
      console.log('❌ Server timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 2: Start server if not running
async function ensureServer() {
  const isRunning = await testServer();
  if (!isRunning) {
    console.log('🚀 Starting server...');
    const server = spawn('npm', ['run', 'start:8082'], {
      stdio: 'inherit',
      detached: true
    });
    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    return await testServer();
  }
  return true;
}

// Run tests
async function runTests() {
  const serverOk = await ensureServer();
  if (serverOk) {
    console.log('✅ All basic tests passed!');
  console.log('🌐 Test the map at: http://localhost:8082/index.html');
  } else {
    console.log('❌ Basic tests failed!');
    process.exit(1);
  }
}

runTests().catch(console.error);
