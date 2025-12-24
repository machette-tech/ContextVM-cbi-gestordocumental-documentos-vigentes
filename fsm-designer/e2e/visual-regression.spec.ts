import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('should match header snapshot', async ({ page }) => {
    await page.goto('/');
    
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match Entity tab snapshot', async ({ page }) => {
    await page.goto('/');
    
    await page.getByText('Entidad L').click();
    const content = page.locator('[role="tabpanel"]').first();
    await expect(content).toHaveScreenshot('entity-tab.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match Canvas tab snapshot', async ({ page }) => {
    await page.goto('/');
    
    await page.getByText('Canvas FSM').click();
    await page.waitForTimeout(500); // Wait for React Flow to load
    const content = page.locator('[role="tabpanel"]').first();
    await expect(content).toHaveScreenshot('canvas-tab.png', {
      maxDiffPixels: 200,
    });
  });

  test('should match Schemas tab snapshot', async ({ page }) => {
    await page.goto('/');
    
    await page.getByText('Esquemas').click();
    const content = page.locator('[role="tabpanel"]').first();
    await expect(content).toHaveScreenshot('schemas-tab.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match full page snapshot on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('full-page-desktop.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('should match full page snapshot on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('full-page-mobile.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});
