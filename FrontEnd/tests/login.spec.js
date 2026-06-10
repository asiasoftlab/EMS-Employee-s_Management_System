// @ts-check
import { test, expect } from '@playwright/test';

test('EMS Login Page should load correctly', async ({ page }) => {
  // 1. Navigate to your local EMS app's login page
  // Make sure your Vite server is running! (usually http://localhost:5174 or 5173)
  await page.goto('http://localhost:5174/login');

  // 2. Verify the page title or a specific heading
  // Based on your EMS Login page, it should have a heading "Welcome Back"
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

  // 3. Verify the "Email Address" input field is visible
  await expect(page.getByPlaceholder('Enter your email address')).toBeVisible();

  // 4. Verify the "Password" input field is visible
  await expect(page.getByPlaceholder('Enter your password')).toBeVisible();

  // 5. Verify the "Sign In" button is visible
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  // 6. Fill in credentials
  await page.getByPlaceholder('Enter your email address').fill('test@example.com');
  await page.getByPlaceholder('Enter your password').fill('password123');

  // 7. Mock ALL backend API requests to prevent the fake token from causing errors on the real backend
  await page.route('http://localhost:5000/**', async route => {
    if (route.request().url().includes('/api/auth/login')) {
      const json = { token: 'fake-token', name: 'Test User', role: 'employee' };
      return route.fulfill({ json });
    }
    // Return empty JSON or success for all other backend requests
    return route.fulfill({ json: [] });
  });

  // 8. Click Sign In and verify navigation to the home/dashboard page
  await page.getByRole('button', { name: 'Sign In' }).click();

  // 9. Verify navigation to the next page (home page)
  await expect(page).toHaveURL('http://localhost:5174/');

  // 10. Verify that the next page content loaded successfully (Task Dashboard)
  await expect(page.getByRole('heading', { name: 'Task Dashboard' })).toBeVisible();
});
