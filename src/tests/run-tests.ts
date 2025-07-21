#!/usr/bin/env node

import { execSync } from 'child_process';
import { resolve } from 'path';

const TEST_DIR = resolve(__dirname);

interface TestConfig {
  name: string;
  pattern: string;
  description: string;
}

const TEST_SUITES: TestConfig[] = [
  {
    name: 'user-management',
    pattern: 'userManagement.test.ts',
    description: 'User management functionality tests',
  },
  {
    name: 'journals',
    pattern: 'journals.test.ts',
    description: 'Journal functionality tests',
  },
  {
    name: 'teams',
    pattern: 'teams.test.ts',
    description: 'Team management functionality tests',
  },
  {
    name: 'quests',
    pattern: 'questManagement.test.ts',
    description: 'Quest management functionality tests',
  },
  {
    name: 'leaderboard',
    pattern: 'leaderboard.test.ts',
    description: 'Leaderboard functionality tests',
  },
  {
    name: 'dashboard',
    pattern: 'dashboard.test.ts',
    description: 'Dashboard functionality tests',
  },
  {
    name: 'health',
    pattern: 'health.test.ts',
    description: 'Health endpoint tests',
  },
  {
    name: 'sports',
    pattern: 'sports.test.ts',
    description: 'Sports endpoint tests',
  },
];

function runTests(pattern: string, options: string[] = []) {
  const command = `npx vitest run ${pattern} ${options.join(' ')}`;
  console.log(`Running: ${command}`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: resolve(__dirname, '../../'),
    });
    return true;
  } catch (error) {
    console.error(`Test run failed for pattern: ${pattern}`);
    return false;
  }
}

function runAllTests(options: string[] = []) {
  console.log('🧪 Running all API tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const suite of TEST_SUITES) {
    console.log(`\n📋 Running ${suite.name} tests...`);
    console.log(`   ${suite.description}`);
    
    const success = runTests(suite.pattern, options);
    
    if (success) {
      console.log(`✅ ${suite.name} tests passed\n`);
      passed++;
    } else {
      console.log(`❌ ${suite.name} tests failed\n`);
      failed++;
    }
  }
  
  console.log('\n📊 Test Summary:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${TEST_SUITES.length}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

function runSpecificSuite(suiteName: string, options: string[] = []) {
  const suite = TEST_SUITES.find(s => s.name === suiteName);
  
  if (!suite) {
    console.error(`❌ Test suite '${suiteName}' not found`);
    console.log('\nAvailable test suites:');
    TEST_SUITES.forEach(s => {
      console.log(`   ${s.name}: ${s.description}`);
    });
    process.exit(1);
  }
  
  console.log(`🧪 Running ${suite.name} tests...`);
  console.log(`   ${suite.description}\n`);
  
  const success = runTests(suite.pattern, options);
  
  if (!success) {
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧪 SmartFyt API Test Runner

Usage:
  npm run test:run [suite] [options]

Available test suites:
${TEST_SUITES.map(s => `  ${s.name.padEnd(15)} ${s.description}`).join('\n')}

Options:
  --coverage     Run tests with coverage report
  --ui           Run tests with UI interface
  --watch        Run tests in watch mode
  --verbose      Show verbose output

Examples:
  npm run test:run                    # Run all tests
  npm run test:run user-management    # Run user management tests
  npm run test:run journals --coverage # Run journal tests with coverage
  npm run test:run teams --ui         # Run team tests with UI
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

if (command === 'all') {
  const options = args.slice(1);
  runAllTests(options);
} else {
  const options = args.slice(1);
  runSpecificSuite(command, options);
} 