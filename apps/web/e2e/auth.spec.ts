import { test, expect, uniqueUser } from './helpers';

test.describe('Landing Page', () => {
  test('shows hero, features section, and navigation links', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Sign In').first()).toBeVisible();
    await expect(page.getByText('Get Started')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Semantic Search' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise Security' })).toBeVisible();
  });

  test('shows dashboard button when user is authenticated', async ({ authedPage }) => {
    await authedPage.goto('/');
    await expect(authedPage.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible();
  });
});

test.describe('Registration', () => {
  test('registers a new user and redirects to dashboard', async ({ page }) => {
    const user = uniqueUser();

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    await page.getByLabel('Name').fill(user.name);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('shows error for duplicate email', async ({ page }) => {
    const user = uniqueUser();

    await page.goto('/register');
    await page.getByLabel('Name').fill(user.name);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard');

    // Clear auth and try again with the same email
    await page.evaluate(() => localStorage.clear());
    await page.goto('/register');
    await page.getByLabel('Name').fill('Another User');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Email already registered')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Login', () => {
  test('logs in an existing user', async ({ page }) => {
    const user = uniqueUser();

    // Register first
    await page.goto('/register');
    await page.getByLabel('Name').fill(user.name);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard');

    // Logout
    await page.evaluate(() => localStorage.clear());

    // Login
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@e2e.local');
    await page.getByLabel('Password').fill('WrongPass1!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText(/invalid|unauthorized|incorrect/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth Guard', () => {
  test('redirects to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });
});
