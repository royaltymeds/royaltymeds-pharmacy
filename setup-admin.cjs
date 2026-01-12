#!/usr/bin/env node

/**
 * Simple script to verify admin setup
 * Run with: node setup-admin.js
 */

const http = require('http');

async function setupAdmin() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/setup/create-default-admin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': 2,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write('{}');
    req.end();
  });
}

async function main() {
  try {
    console.log('Creating default admin account...\n');
    const result = await setupAdmin();
    console.log('Status:', result.status);
    console.log('Response:', result.data);
    
    if (result.status === 201 || result.status === 200) {
      const data = JSON.parse(result.data);
      console.log('\n✅ Admin account created successfully!');
      console.log('Email:', data.admin?.email || data.admin?.email);
      console.log('Password:', data.admin?.password);
    } else {
      const error = JSON.parse(result.data);
      console.log('\n⚠️ Error:', error.message || error.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
