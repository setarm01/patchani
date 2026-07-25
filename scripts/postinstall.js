#!/usr/bin/env node

/**
 * Post-install setup for Patchani
 * Verifies installation and provides helpful information
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('✅ Patchani installed successfully!');
console.log('');
console.log('Included:');
console.log('  • Patchani persona with TUI welcome screen');
console.log('  • Design doc workflow (F1)');
console.log('  • Standup sync: GitHub → Apple Reminders (F2)');
console.log('  • Workflow enforcement layer');
console.log('  • Pi Dynamic Workflows integration');
console.log('');

// Check if workflows dependency was installed
const workflowsPath = path.join(__dirname, '..', 'node_modules', '@quintinshaw', 'pi-dynamic-workflows');

if (fs.existsSync(workflowsPath)) {
  console.log('✅ Dependencies installed correctly');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Restart Pi to activate Patchani');
  console.log('  2. Type /help to see available commands');
  console.log('  3. Try /design-doc to start a design document');
  console.log('');
} else {
  console.log('⚠️  Warning: Workflows dependency not found');
  console.log('');
  console.log('This might resolve on next Pi startup.');
  console.log('If issues persist, try:');
  console.log('  cd ~/.pi/agent/git/github.com/setarm01/patchani');
  console.log('  npm install');
  console.log('');
}
