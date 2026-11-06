// Master Test Runner for CareConnect: Runs Modules 1, 2, 3, and 4 sequentially
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modules = [
  { name: 'Module 1: Authentication & User/Donor Management', script: 'test-module1.js' },
  { name: 'Module 2: Old-Age Home & Admin Verification', script: 'test-module2.js' },
  { name: 'Module 3: Donation & Requirement Management', script: 'test-module3.js' },
  { name: 'Module 4: Volunteer Management', script: 'test-module4.js' },
  { name: 'Module 5: Admin & Verification Module', script: 'test-module5.js' },
  { name: 'Module 6: Search, Tracking & Notification Module', script: 'test-module6.js' }
];

function runScript(scriptPath, name) {
  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(60));
    console.log(`▶ RUNNING ${name.toUpperCase()}`);
    console.log('='.repeat(60) + '\n');

    const proc = spawn('node', [scriptPath], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      resolve({ name, code, success: code === 0 });
    });

    proc.on('error', (err) => {
      console.error(`Error executing ${scriptPath}:`, err);
      resolve({ name, code: 1, success: false });
    });
  });
}

async function ensureServerRunning() {
  try {
    const health = await fetch('http://localhost:5000/api/health');
    if (health.ok) return null;
  } catch (e) {}

  console.log('[Runner Setup] Starting backend server on port 5000...');
  const serverProc = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'ignore',
    shell: true
  });

  // Wait for health endpoint
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const health = await fetch('http://localhost:5000/api/health');
      if (health.ok) {
        console.log('[Runner Setup] Server is ready.');
        return serverProc;
      }
    } catch (e) {}
  }
  return serverProc;
}

async function runAll() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║        CARECONNECT - FULL SYSTEM TEST RUNNER             ║');
  console.log('║        Executing Modules 1, 2, 3, and 4 in sequence      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const serverProc = await ensureServerRunning();
  const startTime = Date.now();
  const results = [];

  for (const mod of modules) {
    const res = await runScript(path.join(__dirname, mod.script), mod.name);
    results.push(res);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n\n' + '═'.repeat(60));
  console.log('                 FINAL TEST SUMMARY');
  console.log('═'.repeat(60));

  let allPassed = true;
  results.forEach((r, idx) => {
    const status = r.success ? 'PASSED  ✔' : 'FAILED  ✖';
    console.log(`  [Module ${idx + 1}] ${r.name.padEnd(52)} : ${status}`);
    if (!r.success) allPassed = false;
  });

  console.log('─'.repeat(60));
  console.log(`  Total Duration: ${durationSec}s`);
  if (allPassed) {
    console.log('  Status: ALL MODULES COMPLETED SUCCESSFULLY! 🎉');
  } else {
    console.log('  Status: ONE OR MORE MODULES ENCOUNTERED FAILURES ⚠️');
  }
  console.log('═'.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

runAll();
