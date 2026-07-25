#!/usr/bin/env node

/**
 * Check if required peer dependencies are installed
 * This runs automatically after pi installs the package
 */

const fs = require('fs');
const path = require('path');

// Check for workflows package in user's pi installation
const piAgent = path.join(process.env.HOME, '.pi', 'agent');
const settingsPath = path.join(piAgent, 'settings.json');

if (!fs.existsSync(settingsPath)) {
  console.error('⚠️  Cannot find Pi settings at:', settingsPath);
  process.exit(0); // Don't fail installation
}

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
const packages = settings.packages || [];

const hasWorkflows = packages.some(pkg => 
  pkg === 'npm:@quintinshaw/pi-dynamic-workflows' ||
  (typeof pkg === 'object' && pkg.source === 'npm:@quintinshaw/pi-dynamic-workflows')
);

if (!hasWorkflows) {
  console.log('');
  console.log('⚠️  MISSING PREREQUISITE');
  console.log('');
  console.log('Patchani requires @quintinshaw/pi-dynamic-workflows');
  console.log('');
  console.log('Please install it:');
  console.log('  pi install npm:@quintinshaw/pi-dynamic-workflows');
  console.log('');
}
