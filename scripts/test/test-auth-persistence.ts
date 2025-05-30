#!/usr/bin/env tsx

/**
 * Test script to verify JWT authentication persistence
 * This script tests the authentication flow and cookie handling
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:5000';
const CLIENT_URL = 'http://localhost:5173';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class AuthTester {
  private results: TestResult[] = [];
  private cookies: string[] = [];

  private addResult(test: string, passed: boolean, message: string, details?: any) {
    this.results.push({ test, passed, message, details });
    console.log(`${passed ? '✅' : '❌'} ${test}: ${message}`);
    if (details) {
      console.log(`   Details:`, details);
    }
  }

  private extractCookies(response: any) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      this.cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    }
  }

  private getCookieHeader() {
    return this.cookies.join('; ');
  }

  async testServerConnection() {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        this.addResult(
          'Server Connection',
          true,
          'Server is running and responding with expected 401 for unauthenticated request'
        );
      } else {
        this.addResult(
          'Server Connection',
          false,
          `Unexpected response status: ${response.status}`,
          { status: response.status, statusText: response.statusText }
        );
      }
    } catch (error) {
      this.addResult(
        'Server Connection',
        false,
        'Failed to connect to server',
        { error: error.message }
      );
    }
  }

  async testLogin() {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@businessdash.com',
          password: 'password123'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.extractCookies(response);
        
        this.addResult(
          'Login',
          true,
          'Login successful',
          { 
            user: data.user?.email,
            hasCookies: this.cookies.length > 0,
            cookies: this.cookies.map(c => c.split(';')[0]) // Show only cookie names
          }
        );
      } else {
        const errorData = await response.text();
        this.addResult(
          'Login',
          false,
          `Login failed with status ${response.status}`,
          { error: errorData }
        );
      }
    } catch (error) {
      this.addResult(
        'Login',
        false,
        'Login request failed',
        { error: error.message }
      );
    }
  }

  async testAuthenticatedRequest() {
    if (this.cookies.length === 0) {
      this.addResult(
        'Authenticated Request',
        false,
        'No cookies available from login'
      );
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.getCookieHeader(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult(
          'Authenticated Request',
          true,
          'Successfully authenticated with JWT cookie',
          { user: data.user?.email, tenant: data.tenant?.name }
        );
      } else {
        const errorData = await response.text();
        this.addResult(
          'Authenticated Request',
          false,
          `Authentication failed with status ${response.status}`,
          { error: errorData, cookies: this.getCookieHeader() }
        );
      }
    } catch (error) {
      this.addResult(
        'Authenticated Request',
        false,
        'Authenticated request failed',
        { error: error.message }
      );
    }
  }

  async testLogout() {
    if (this.cookies.length === 0) {
      this.addResult(
        'Logout',
        false,
        'No cookies available for logout test'
      );
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.getCookieHeader(),
        },
      });

      if (response.ok) {
        this.extractCookies(response);
        this.addResult(
          'Logout',
          true,
          'Logout successful',
          { 
            clearedCookies: this.cookies.some(c => c.includes('token=;') || c.includes('token=""'))
          }
        );
      } else {
        const errorData = await response.text();
        this.addResult(
          'Logout',
          false,
          `Logout failed with status ${response.status}`,
          { error: errorData }
        );
      }
    } catch (error) {
      this.addResult(
        'Logout',
        false,
        'Logout request failed',
        { error: error.message }
      );
    }
  }

  async testCORSHeaders() {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/me`, {
        method: 'OPTIONS',
        headers: {
          'Origin': CLIENT_URL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });

      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      };

      const hasValidCORS = corsHeaders['access-control-allow-credentials'] === 'true' &&
                          (corsHeaders['access-control-allow-origin'] === CLIENT_URL || 
                           corsHeaders['access-control-allow-origin'] === '*');

      this.addResult(
        'CORS Configuration',
        hasValidCORS,
        hasValidCORS ? 'CORS properly configured for credentials' : 'CORS configuration issues detected',
        corsHeaders
      );
    } catch (error) {
      this.addResult(
        'CORS Configuration',
        false,
        'Failed to test CORS configuration',
        { error: error.message }
      );
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('AUTHENTICATION PERSISTENCE TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`\nTests passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Authentication persistence should work correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.');
      console.log('\nFailed tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.test}: ${result.message}`);
      });
    }
  }

  async runAllTests() {
    console.log('Starting Authentication Persistence Tests...\n');
    
    await this.testServerConnection();
    await this.testCORSHeaders();
    await this.testLogin();
    await this.testAuthenticatedRequest();
    await this.testLogout();
    
    this.printSummary();
  }
}

// Run the tests
async function main() {
  const tester = new AuthTester();
  await tester.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
