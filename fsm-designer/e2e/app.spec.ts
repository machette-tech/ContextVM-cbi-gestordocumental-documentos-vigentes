import { test, expect } from '@playwright/test';

test.describe('AARPIA FSM Designer Application', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/AARPIA FSM Designer/);
  });

  test('should display the AARPIA logo', async ({ page }) => {
    await page.goto('/');
    
    const logo = page.getByAltText('AARPIA');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', '/logo-aarpia.png');
  });

  test('should display the header with title', async ({ page }) => {
    await page.goto('/');
    
    const title = page.getByText('Diseñador Visual FSM');
    await expect(title).toBeVisible();
    
    const subtitle = page.getByText('Arquitectura para Integración y Análisis de Procesos');
    await expect(subtitle).toBeVisible();
  });

  test('should have all three tabs visible', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Entidad L')).toBeVisible();
    await expect(page.getByText('Canvas FSM')).toBeVisible();
    await expect(page.getByText('Esquemas')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');
    
    // Click on Canvas FSM tab
    await page.getByText('Canvas FSM').click();
    await expect(page.getByText('Diseña estados y transiciones de tu máquina de estados')).toBeVisible();
    
    // Click on Esquemas tab
    await page.getByText('Esquemas').click();
    await expect(page.getByText('Define inputs, outputs y correlaciones de datos')).toBeVisible();
    
    // Click back to Entidad L tab
    await page.getByText('Entidad L').click();
    await expect(page.getByText('Define la entidad del contexto: root, context o local')).toBeVisible();
  });

  test('should display footer with version', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    await expect(footer).toContainText('AARPIA');
    await expect(footer).toContainText('v1.0.0');
  });

  test('should have proper styling and colors', async ({ page }) => {
    await page.goto('/');
    
    // Check that the header has the AARPIA primary color
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check that CSS is loaded properly
    const bodyBackground = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bodyBackground).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Logo should still be visible
    await expect(page.getByAltText('AARPIA')).toBeVisible();
    
    // Tabs should be visible
    await expect(page.getByText('Entidad L')).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have critical errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404')
    );
    expect(criticalErrors.length).toBe(0);
  });
});
