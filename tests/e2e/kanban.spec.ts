import { expect, test } from '@playwright/test';

import { setupAuth, setupGraphQLMocks } from './utils/network';

test.describe('Kanban', () => {
  test('allows dragging tasks between stages', async ({ page }) => {
    const state = await setupGraphQLMocks(page);
    await setupAuth(page, { authenticated: true, user: state.user });

    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const todoHeader = page.getByText('TODO', { exact: true }).first();
    const inProgressHeader = page.getByText('IN PROGRESS', { exact: true }).first();
    const taskCard = page.getByText('Plan quarterly roadmap').first();

    await expect(todoHeader).toBeVisible({ timeout: 15000 });
    await expect(taskCard).toBeVisible({ timeout: 15000 });

    const taskBox = await taskCard.boundingBox();
    const todoBox = await todoHeader.boundingBox();
    const inProgressBox = await inProgressHeader.boundingBox();

    if (!taskBox || !todoBox || !inProgressBox) {
      throw new Error('Failed to measure kanban elements');
    }

    await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(inProgressBox.x + inProgressBox.width / 2, inProgressBox.y + 160, {
      steps: 20,
    });
    await page.waitForTimeout(80);
    await page.mouse.up();

    await expect
      .poll(async () => {
        const box = await taskCard.boundingBox();
        if (!box) {
          return Number.NEGATIVE_INFINITY;
        }
        return box.x;
      })
      .toBeGreaterThan(todoBox.x + 50);

    await expect(taskCard).toBeVisible();
  });
});
