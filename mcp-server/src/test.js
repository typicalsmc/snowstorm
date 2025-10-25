#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server tools work correctly
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, '../dist/index.js');

// Test requests
const testRequests = [
  {
    name: 'Initialize',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    },
  },
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    },
  },
  {
    name: 'List Particle Examples',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_particle_examples',
        arguments: {},
      },
    },
  },
  {
    name: 'Read Fire Particle',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'read_particle_file',
        arguments: {
          filename: 'fire',
        },
      },
    },
  },
  {
    name: 'Create Template',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'create_particle_template',
        arguments: {
          identifier: 'test:particle',
          emitter_type: 'steady',
        },
      },
    },
  },
];

async function runTest() {
  console.log('Starting MCP Server test...\n');

  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  let responseBuffer = '';
  let currentTestIndex = 0;

  server.stdout.on('data', (data) => {
    responseBuffer += data.toString();

    // Try to parse complete JSON-RPC messages
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          console.log(`✓ Response for: ${testRequests[currentTestIndex - 1]?.name || 'Unknown'}`);
          console.log(JSON.stringify(response, null, 2));
          console.log('\n---\n');

          // Send next request
          if (currentTestIndex < testRequests.length) {
            sendRequest(testRequests[currentTestIndex]);
            currentTestIndex++;
          } else {
            // All tests complete
            server.kill();
            console.log('All tests completed successfully!');
            process.exit(0);
          }
        } catch (e) {
          // Not a complete JSON message yet
        }
      }
    }
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
  });

  function sendRequest(test) {
    console.log(`Sending: ${test.name}...`);
    server.stdin.write(JSON.stringify(test.request) + '\n');
  }

  // Start with the first request
  sendRequest(testRequests[currentTestIndex]);
  currentTestIndex++;
}

runTest().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
