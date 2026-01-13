#!/usr/bin/env node

/**
 * StackBlitz Deployment Script
 * 
 * Usage: node deploy-stackblitz.js
 * 
 * This script helps deploy the RoyaltyMeds project to StackBlitz.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 RoyaltyMeds StackBlitz Deployment Helper\n');

const githubRepo = 'royaltymeds/royaltymeds-pharmacy';
const stackblitzUrl = `https://stackblitz.com/github/${githubRepo}`;
const stackblitzAppUrl = `https://stackblitz.com/github/${githubRepo}?file=package.json`;

console.log('✅ Project is ready for StackBlitz deployment!\n');

console.log('📋 Option 1: Open in StackBlitz Cloud IDE');
console.log(`   ${stackblitzUrl}\n`);

console.log('📋 Option 2: Open with specific file');
console.log(`   ${stackblitzAppUrl}\n`);

console.log('📋 Step-by-step deployment:');
console.log('   1. Click one of the URLs above');
console.log('   2. StackBlitz will fork your GitHub repo');
console.log('   3. Install dependencies automatically');
console.log('   4. Run "npm run dev" to start the dev server');
console.log('   5. Use StackBlitz deployment features to host\n');

console.log('📝 Environment Variables:');
console.log('   ✓ Supabase URLs are already in stackblitz.json');
console.log('   ✓ Add secret environment variables in StackBlitz settings\n');

console.log('🔗 Quick Links:');
console.log(`   GitHub: https://github.com/${githubRepo}`);
console.log(`   StackBlitz: ${stackblitzUrl}\n`);

// Copy to clipboard helper
if (process.argv[2] === '--copy-url') {
  const { execSync } = require('child_process');
  try {
    execSync(`echo ${stackblitzUrl} | clip`);
    console.log('✅ URL copied to clipboard!');
  } catch (e) {
    console.log('Could not copy to clipboard, but URL is above.');
  }
}
