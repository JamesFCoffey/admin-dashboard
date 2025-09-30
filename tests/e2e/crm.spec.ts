import { expect, test } from '@playwright/test';

import { setupAuth, setupGraphQLMocks } from './utils/network';

test.describe('CRM', () => {
  test('supports managing company contacts', async ({ page }) => {
    const state = await setupGraphQLMocks(page);
    await setupAuth(page, { authenticated: true, user: state.user });

    await page.goto('/companies/edit/company-1');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Contacts/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Pam Beesly')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Add contact' }).click();

    const createModal = page.getByRole('dialog', { name: /Add contact/i });
    await expect(createModal).toBeVisible();

    const fullName = createModal.getByLabel('Full name');
    await fullName.fill('Jim Halpert');
    await createModal.getByLabel('Email').fill('jim@dundermifflin.com');
    await createModal.getByLabel('Job title').fill('Senior Account Manager');

    await createModal.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(/Contact created successfully/i)).toBeVisible();

    const newContactRow = page
      .locator('tr[data-row-key]:not([data-row-key^="optimistic"])')
      .filter({ hasText: 'Jim Halpert' })
      .first();
    await expect(newContactRow).toBeVisible({ timeout: 15000 });

    const editButton = newContactRow.getByRole('button', { name: 'Edit' });
    await expect(editButton).toBeEnabled({ timeout: 15000 });
    await editButton.click();
    const editModal = page.getByRole('dialog', { name: /Edit Jim Halpert/i });
    await expect(editModal).toBeVisible();
    await editModal.getByPlaceholder('e.g. Office Administrator').fill('Director of Sales');
    await editModal.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(/Contact updated successfully/i)).toBeVisible();
    await expect(newContactRow.getByText('Director of Sales')).toBeVisible();

    await newContactRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText(/Contact removed/i)).toBeVisible();
    await expect(
      page
        .locator('tr[data-row-key]:not([data-row-key^="optimistic"])')
        .filter({ hasText: 'Jim Halpert' }),
    ).toHaveCount(0, { timeout: 15000 });
  });
});
