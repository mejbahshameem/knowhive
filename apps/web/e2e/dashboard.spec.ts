import { test, expect } from './helpers';

test.describe('Organizations', () => {
  test('shows empty state and creates an organization', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('No organizations yet')).toBeVisible();

    // Open create modal
    await page.getByRole('button', { name: 'New Organization' }).click();
    await expect(page.getByRole('heading', { name: 'Create Organization' })).toBeVisible();

    const orgName = `TestOrg ${Date.now().toString(36)}`;
    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Modal closes and card appears
    await expect(page.getByText(orgName)).toBeVisible();
  });

  test('navigates into an organization', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    const orgName = `NavOrg ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText(orgName)).toBeVisible();

    // Click the org card
    await page.getByText(orgName).click();
    await page.waitForURL('**/dashboard/**');

    // Should see the org detail page with KB empty state
    await expect(page.getByRole('heading', { name: orgName })).toBeVisible();
    await expect(page.getByText('No knowledge bases yet')).toBeVisible();
  });
});

test.describe('Knowledge Bases', () => {
  test('creates a knowledge base inside an organization', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    // Create org first
    const orgName = `KBOrg ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(orgName).click();
    await page.waitForURL('**/dashboard/**');

    // Create KB
    await page.getByRole('button', { name: 'New Knowledge Base' }).click();
    await expect(page.getByRole('heading', { name: 'Create Knowledge Base' })).toBeVisible();

    const kbName = `Test KB ${Date.now().toString(36)}`;
    await page.getByLabel('Name').fill(kbName);
    await page.getByLabel('Description (optional)').fill('Automated testing knowledge base');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Card appears
    await expect(page.getByText(kbName)).toBeVisible();
  });

  test('navigates into a knowledge base', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    // Create org
    const orgName = `NavKBOrg ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(orgName).click();
    await page.waitForURL('**/dashboard/**');

    // Create KB
    const kbName = `NavKB ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Knowledge Base' }).click();
    await page.getByLabel('Name').fill(kbName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Click into the KB
    await page.getByText(kbName).click();
    await page.waitForURL('**/dashboard/*/*');

    await expect(page.getByRole('heading', { name: kbName })).toBeVisible();
    await expect(page.getByText('No documents yet')).toBeVisible();
  });
});
