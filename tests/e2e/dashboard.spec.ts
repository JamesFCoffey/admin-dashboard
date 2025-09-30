import { expect, test } from '@playwright/test';

import { setupAuth, setupGraphQLMocks } from './utils/network';

test.describe('Dashboard', () => {
  test('displays summary metrics and recent activity', async ({ page }) => {
    const state = await setupGraphQLMocks(page);
    await setupAuth(page, { authenticated: true, user: state.user });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Number of companies')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(String(state.dashboardTotals.companies))).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText('Upcoming events')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(state.upcomingEvents[0].title)).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/Latest Activities/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(state.latestAudits[0].user?.name ?? '')).toBeVisible({
      timeout: 10000,
    });
  });
});
