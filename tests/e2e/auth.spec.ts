import { expect, test } from '@playwright/test';

import { setupAuth, setupGraphQLMocks } from './utils/network';

test.describe('Authentication', () => {
  test('renders login screen and completes demo sign-in', async ({ page }) => {
    await setupAuth(page, { authenticated: false });
    await setupGraphQLMocks(page);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Welcome back/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Sign in with demo email/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole('button', { name: /Sign in with demo email/i }).click();

    await expect(page).toHaveURL(/\/?$/, { timeout: 20000 });
  });
});
