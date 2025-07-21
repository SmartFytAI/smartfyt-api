#!/usr/bin/env node

/**
 * Script to verify that database mocking is working correctly
 * This script helps ensure no real database connections are made during tests
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Verifying Database Mocking Setup...\n');

try {
  // Change to the API directory
  process.chdir(projectRoot);
  
  console.log('1. Checking test setup file...');
  const setupContent = execSync('cat src/tests/setup.ts', { encoding: 'utf8' });
  
  if (setupContent.includes('vi.mock') && setupContent.includes('prisma')) {
    console.log('✅ Global Prisma mocking is configured');
  } else {
    console.log('❌ Global Prisma mocking is NOT configured');
    process.exit(1);
  }
  
  console.log('\n2. Checking test utilities...');
  const utilsContent = execSync('cat src/tests/utils/test-utils.ts', { encoding: 'utf8' });
  
  if (utilsContent.includes('getMockPrisma') && utilsContent.includes('resetMockPrisma')) {
    console.log('✅ Mock utilities are properly configured');
  } else {
    console.log('❌ Mock utilities are NOT properly configured');
    process.exit(1);
  }
  
  console.log('\n3. Running a quick test to verify mocking...');
  
  // Run a simple test to verify mocking works
  const testOutput = execSync('npm run test:user-management -- --reporter=verbose', { 
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  if (testOutput.includes('Database connection failed') || testOutput.includes('Failed to connect')) {
    console.log('❌ Real database connections detected in tests');
    process.exit(1);
  } else {
    console.log('✅ No real database connections detected');
  }
  
  console.log('\n4. Checking for any remaining real database references...');
  
  // Check for any remaining real database connections in test files
  const grepOutput = execSync('grep -r "new PrismaClient" src/tests/ || true', { encoding: 'utf8' });
  
  if (grepOutput.trim()) {
    console.log('❌ Found real PrismaClient instantiations in test files:');
    console.log(grepOutput);
    process.exit(1);
  } else {
    console.log('✅ No real PrismaClient instantiations found in test files');
  }
  
  console.log('\n5. Running full test suite to verify everything works...');
  
  const fullTestOutput = execSync('npm run test:run -- --reporter=basic', { 
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  if (fullTestOutput.includes('FAIL') || fullTestOutput.includes('Error:')) {
    console.log('❌ Some tests are failing:');
    console.log(fullTestOutput);
    process.exit(1);
  } else {
    console.log('✅ All tests are passing');
  }
  
  console.log('\n🎉 Database mocking verification completed successfully!');
  console.log('✅ All tests are using mocked database operations');
  console.log('✅ No real database connections are being made');
  console.log('✅ Test suite is running correctly');
  
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
} 