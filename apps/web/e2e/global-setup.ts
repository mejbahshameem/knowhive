import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'http://localhost:3001';
const TOKEN_FILE = path.join(__dirname, '..', 'test-results', '.shared-tokens.json');

/**
 * Playwright global setup: registers a single shared user via the API
 * and writes the tokens to disk. Every spec file reads this file
 * through the helpers module, so only one registration is spent
 * regardless of how many test files exist.
 */
async function globalSetup() {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const user = {
    name: `Shared E2E User ${id}`,
    email: `shared-${id}@e2e.local`,
    password: 'Test1234!',
  };

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    throw new Error(`Global setup registration failed: ${res.status} ${await res.text()}`);
  }

  const tokens = await res.json();

  // Ensure directory exists
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export default globalSetup;
