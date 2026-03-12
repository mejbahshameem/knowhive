import { test as base, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'http://localhost:3001';
const TOKEN_FILE = path.join(__dirname, '..', 'test-results', '.shared-tokens.json');

interface TestUser {
  name: string;
  email: string;
  password: string;
}

function uniqueUser(): TestUser {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    name: `Test User ${id}`,
    email: `test-${id}@e2e.local`,
    password: 'Test1234!',
  };
}

async function registerViaApi(user: TestUser): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    throw new Error(`Registration failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

async function injectAuth(page: Page, tokens: { accessToken: string; refreshToken: string }) {
  await page.goto('/');
  await page.evaluate((t) => {
    localStorage.setItem('atlas_access_token', t.accessToken);
    localStorage.setItem('atlas_refresh_token', t.refreshToken);
  }, tokens);
}

/**
 * Reads shared tokens from a file on disk so every spec file reuses
 * the same registered user without hitting the rate limiter.
 * The file is written by the global setup script before tests run.
 */
function getSharedTokens(): { accessToken: string; refreshToken: string } {
  const raw = fs.readFileSync(TOKEN_FILE, 'utf-8');
  return JSON.parse(raw);
}

interface TestFixtures {
  testUser: TestUser;
  authedPage: Page;
}

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    await use(uniqueUser());
  },

  authedPage: async ({ page }, use) => {
    const tokens = getSharedTokens();
    await injectAuth(page, tokens);
    await use(page);
  },
});

export { uniqueUser, registerViaApi, injectAuth };
export { expect } from '@playwright/test';
