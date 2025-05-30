#!/usr/bin/env tsx

/**
 * Playwright test script to verify JWT authentication persistence
 * This script tests the complete authentication flow in a real browser environment
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';

const SERVER_URL = 'http://localhost:5000';
const CLIENT_URL = 'http://localhost:5173';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class AuthPersistenceTester {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];

  private addResult(test: string, passed: boolean, message: string, details?: any) {
    this.results.push({ test, passed, message, details });
    console.log(`${passed ? '✅' : '❌'} ${test}: ${message}`);
    if (details) {
      console.log(`   Details:`, JSON.stringify(details, null, 2));
    }
  }

  async setup() {
    try {
      console.log('Setting up browser...');
      this.browser = await chromium.launch({ 
        headless: false, // Set to true for CI/automated testing
        slowMo: 500 // Slow down for better visibility
      });
      
      this.context = await this.browser.newContext({
        // Accept all cookies and enable storage
        acceptDownloads: true,
        ignoreHTTPSErrors: true,
      });
      
      this.page = await this.context.newPage();
      
      // Enable console logging from the page
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`Browser Error: ${msg.text()}`);
        }
      });
      
      this.addResult('Browser Setup', true, 'Browser and page initialized successfully');
    } catch (error) {
      this.addResult('Browser Setup', false, 'Failed to setup browser', { error: error.message });
      throw error;
    }
  }

  async testServerConnection() {
    try {
      console.log('\nTesting server connection...');
      await this.page!.goto(CLIENT_URL, { waitUntil: 'networkidle' });
      
      // Check if we can reach the login page
      const title = await this.page!.title();
      const isLoginPage = await this.page!.locator('text=Welcome to BusinessDash').isVisible();
      
      this.addResult(
        'Server Connection',
        isLoginPage,
        isLoginPage ? 'Successfully reached login page' : 'Could not reach login page',
        { title, url: this.page!.url() }
      );
    } catch (error) {
      this.addResult('Server Connection', false, 'Failed to connect to application', { error: error.message });
    }
  }

  async testLogin() {
    try {
      console.log('\nTesting login functionality...');
      
      // Fill in login credentials
      await this.page!.fill('input[type="email"]', 'admin@businessdash.com');
      await this.page!.fill('input[type="password"]', 'password123');
      
      // Click login button
      await this.page!.click('button[type="submit"]');
      
      // Wait for navigation or success indication
      await this.page!.waitForTimeout(2000);
      
      // Check if we're redirected to dashboard
      const currentUrl = this.page!.url();
      const isDashboard = currentUrl.includes('/') && !currentUrl.includes('/login');
      
      // Check for authentication cookies
      const cookies = await this.context!.cookies();
      const tokenCookie = cookies.find(cookie => cookie.name === 'token');
      
      this.addResult(
        'Login',
        isDashboard && !!tokenCookie,
        isDashboard && !!tokenCookie ? 'Login successful with JWT cookie set' : 'Login failed or cookie not set',
        { 
          currentUrl, 
          isDashboard,
          hasTokenCookie: !!tokenCookie,
          tokenCookieValue: tokenCookie ? `${tokenCookie.value.substring(0, 20)}...` : 'none'
        }
      );
    } catch (error) {
      this.addResult('Login', false, 'Login test failed', { error: error.message });
    }
  }

  async testAuthenticationPersistence() {
    try {
      console.log('\nTesting authentication persistence...');
      
      // Refresh the page to test persistence
      await this.page!.reload({ waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      // Check if we're still authenticated (not redirected to login)
      const currentUrl = this.page!.url();
      const isStillAuthenticated = !currentUrl.includes('/login');
      
      // Check if user data is displayed (indicating successful auth check)
      const hasUserData = await this.page!.locator('[data-testid="user-avatar"], .avatar, text=admin@businessdash.com').first().isVisible().catch(() => false);
      
      // Check cookies are still present
      const cookies = await this.context!.cookies();
      const tokenCookie = cookies.find(cookie => cookie.name === 'token');
      
      this.addResult(
        'Authentication Persistence',
        isStillAuthenticated && !!tokenCookie,
        isStillAuthenticated && !!tokenCookie ? 'Authentication persisted after page refresh' : 'Authentication lost after refresh',
        { 
          currentUrl,
          isStillAuthenticated,
          hasUserData,
          hasTokenCookie: !!tokenCookie
        }
      );
    } catch (error) {
      this.addResult('Authentication Persistence', false, 'Persistence test failed', { error: error.message });
    }
  }

  async testNewTabPersistence() {
    try {
      console.log('\nTesting authentication persistence in new tab...');
      
      // Open a new tab
      const newPage = await this.context!.newPage();
      await newPage.goto(CLIENT_URL, { waitUntil: 'networkidle' });
      await newPage.waitForTimeout(2000);
      
      // Check if we're authenticated in the new tab
      const currentUrl = newPage.url();
      const isAuthenticated = !currentUrl.includes('/login');
      
      // Check cookies in new tab
      const cookies = await this.context!.cookies();
      const tokenCookie = cookies.find(cookie => cookie.name === 'token');
      
      await newPage.close();
      
      this.addResult(
        'New Tab Persistence',
        isAuthenticated && !!tokenCookie,
        isAuthenticated && !!tokenCookie ? 'Authentication persisted in new tab' : 'Authentication not shared across tabs',
        { 
          currentUrl,
          isAuthenticated,
          hasTokenCookie: !!tokenCookie
        }
      );
    } catch (error) {
      this.addResult('New Tab Persistence', false, 'New tab test failed', { error: error.message });
    }
  }

  async testLogout() {
    try {
      console.log('\nTesting logout functionality...');
      
      // Look for logout button or user menu
      const logoutButton = this.page!.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout-button"]').first();
      const userMenu = this.page!.locator('.avatar, [data-testid="user-menu"], button:has(.avatar)').first();
      
      // Try to find and click logout
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await this.page!.waitForTimeout(500);
      }
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await this.page!.waitForTimeout(2000);
      } else {
        // Alternative: try to logout via API call
        await this.page!.evaluate(async () => {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include'
            });
          } catch (e) {
            console.log('Logout API call failed:', e);
          }
        });
        await this.page!.reload({ waitUntil: 'networkidle' });
      }
      
      // Check if we're redirected to login page
      const currentUrl = this.page!.url();
      const isLoggedOut = currentUrl.includes('/login');
      
      // Check if token cookie is cleared
      const cookies = await this.context!.cookies();
      const tokenCookie = cookies.find(cookie => cookie.name === 'token');
      const isTokenCleared = !tokenCookie || tokenCookie.value === '' || tokenCookie.value === '""';
      
      this.addResult(
        'Logout',
        isLoggedOut && isTokenCleared,
        isLoggedOut && isTokenCleared ? 'Logout successful and token cleared' : 'Logout failed or token not cleared',
        { 
          currentUrl,
          isLoggedOut,
          isTokenCleared,
          tokenCookieValue: tokenCookie ? tokenCookie.value : 'none'
        }
      );
    } catch (error) {
      this.addResult('Logout', false, 'Logout test failed', { error: error.message });
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.addResult('Cleanup', true, 'Browser closed successfully');
      }
    } catch (error) {
      this.addResult('Cleanup', false, 'Failed to cleanup browser', { error: error.message });
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('AUTHENTICATION PERSISTENCE TEST SUMMARY (PLAYWRIGHT)');
    console.log('='.repeat(70));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`\nTests passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Authentication persistence is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.');
      console.log('\nFailed tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.test}: ${result.message}`);
      });
    }
    
    console.log('\nRecommendations:');
    console.log('- Ensure the development server is running on port 5000');
    console.log('- Verify CORS is properly configured for cross-origin requests');
    console.log('- Check that JWT cookies are set with correct attributes');
    console.log('- Test in both development and production environments');
  }

  async runAllTests() {
    console.log('Starting Authentication Persistence Tests with Playwright...\n');
    
    try {
      await this.setup();
      await this.testServerConnection();
      await this.testLogin();
      await this.testAuthenticationPersistence();
      await this.testNewTabPersistence();
      await this.testLogout();
    } finally {
      await this.cleanup();
      this.printSummary();
    }
  }
}

// Run the tests
async function main() {
  const tester = new AuthPersistenceTester();
  await tester.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
