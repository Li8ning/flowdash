import { test, expect } from '@playwright/test';

test('navigate to products page', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.pause();
});