import { test, expect } from './helpers';

test.describe('Documents', () => {
  test('creates a document and sees it in the list', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    // Create org
    const orgName = `DocOrg ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(orgName).click();
    await page.waitForURL('**/dashboard/**');

    // Create KB
    const kbName = `DocKB ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Knowledge Base' }).click();
    await page.getByLabel('Name').fill(kbName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(kbName).click();
    await page.waitForURL('**/dashboard/*/*');

    // Create document via the Add Document button in the page header
    await page.getByRole('button', { name: 'Add Document' }).first().click();
    await expect(page.getByRole('heading', { name: 'Add Document' })).toBeVisible();

    const docTitle = 'Getting Started Guide';
    const docContent = 'This guide covers the basics of setting up and configuring the platform. '
      + 'It describes installation steps, environment variables, and how to connect to the database. '
      + 'Follow these instructions to get your local development environment running.';

    await page.getByLabel('Title').fill(docTitle);
    await page.getByLabel('Content').fill(docContent);

    // Click the submit button inside the modal dialog
    await page.locator('dialog, [role="dialog"]').getByRole('button', { name: 'Add Document' }).click();

    // Document appears in the list with a status badge
    await expect(page.getByText(docTitle)).toBeVisible();
    await expect(page.getByText(/pending|processing|ready/i)).toBeVisible();
  });

  test('navigates to the search page from KB detail', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    // Create org
    const orgName = `SearchNavOrg ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(orgName).click();
    await page.waitForURL('**/dashboard/**');

    // Create KB
    const kbName = `SearchNavKB ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Knowledge Base' }).click();
    await page.getByLabel('Name').fill(kbName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(kbName).click();
    await page.waitForURL('**/dashboard/*/*');

    // Wait for the KB page to finish loading
    await expect(page.getByRole('heading', { name: kbName })).toBeVisible();

    // Click the Search button in the header
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForURL('**/search');

    await expect(page.getByRole('heading', { name: 'Semantic Search' })).toBeVisible();
    await expect(page.getByPlaceholder(/How do I/i)).toBeVisible();
  });
});

test.describe('Search', () => {
  test('shows empty results for a query in an empty knowledge base', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    // Create org and KB
    const orgName = `EmptySearchOrg ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(orgName).click();
    await page.waitForURL('**/dashboard/**');

    const kbName = `EmptySearchKB ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Knowledge Base' }).click();
    await page.getByLabel('Name').fill(kbName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(kbName).click();
    await page.waitForURL('**/dashboard/*/*');

    // Wait for the KB page to finish loading
    await expect(page.getByRole('heading', { name: kbName })).toBeVisible();

    // Go to search
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForURL('**/search');

    // Search with a query
    await page.getByPlaceholder(/How do I/i).fill('setup instructions');
    await page.locator('form').getByRole('button', { name: 'Search' }).click();

    // Should show empty state
    await expect(page.getByText('No results found')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Navigation', () => {
  test('breadcrumb navigation works correctly', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    // Create org
    const orgName = `BreadOrg ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(orgName).click();
    await page.waitForURL('**/dashboard/**');

    // Create KB
    const kbName = `BreadKB ${Date.now().toString(36)}`;
    await page.getByRole('button', { name: 'New Knowledge Base' }).click();
    await page.getByLabel('Name').fill(kbName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByText(kbName).click();
    await page.waitForURL('**/dashboard/*/*');

    // Go back via breadcrumb
    await page.getByText('Back to Knowledge Bases').click();
    await expect(page.getByRole('heading', { name: orgName })).toBeVisible();

    // Go back again
    await page.getByText('All Organizations').click();
    await expect(page).toHaveURL('/dashboard');
  });
});
