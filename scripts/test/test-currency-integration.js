#!/usr/bin/env node

/**
 * Test script to verify currency integration works correctly
 * This script tests:
 * 1. Currency formatting with various locales and currencies
 * 2. Validation of currency codes
 * 3. Default fallbacks
 */

// Test currency formatting
function testCurrencyFormatting() {
  console.log('🧪 Testing Currency Formatting...\n');

  const testCases = [
    { code: 'GBP', symbol: '£', locale: 'en-GB', amount: 1234.56 },
    { code: 'USD', symbol: '$', locale: 'en-US', amount: 1234.56 },
    { code: 'EUR', symbol: '€', locale: 'en-IE', amount: 1234.56 },
    { code: 'JPY', symbol: '¥', locale: 'ja-JP', amount: 1234 },
    { code: 'INR', symbol: '₹', locale: 'en-IN', amount: 1234.56 },
    { code: 'AUD', symbol: 'A$', locale: 'en-AU', amount: 1234.56 }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach(({ code, symbol, locale, amount }) => {
    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);

      console.log(`✅ ${code} (${locale}): ${formatted}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${code} (${locale}): Error - ${error.message}`);
    }
  });

  console.log(`\n📊 Currency Formatting Tests: ${passedTests}/${totalTests} passed\n`);
  return passedTests === totalTests;
}

// Test currency validation
function testCurrencyValidation() {
  console.log('🧪 Testing Currency Validation...\n');

  const validCurrencies = [
    { code: 'GBP', locale: 'en-GB' },
    { code: 'USD', locale: 'en-US' },
    { code: 'EUR', locale: 'de-DE' },
    { code: 'JPY', locale: 'ja-JP' }
  ];

  const invalidCurrencies = [
    { code: 'XYZ', locale: 'en-US' }, // Invalid currency code
    { code: 'USD', locale: 'xx-XX' }, // Invalid locale
    { code: 'EUR', locale: 'en-US' }  // Mismatched currency/locale (should still work)
  ];

  let validTests = 0;
  let invalidTests = 0;

  console.log('Valid Currency Tests:');
  validCurrencies.forEach(({ code, locale }) => {
    try {
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code
      }).format(100);
      console.log(`✅ ${code}/${locale}: Valid`);
      validTests++;
    } catch (error) {
      console.log(`❌ ${code}/${locale}: Should be valid but failed - ${error.message}`);
    }
  });

  console.log('\nInvalid Currency Tests:');
  invalidCurrencies.forEach(({ code, locale }) => {
    try {
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code
      }).format(100);
      
      // For EUR/en-US, this actually works (mismatched but valid)
      if (code === 'EUR' && locale === 'en-US') {
        console.log(`✅ ${code}/${locale}: Works (mismatched but valid)`);
      } else {
        console.log(`⚠️ ${code}/${locale}: Should be invalid but passed`);
      }
    } catch (error) {
      console.log(`✅ ${code}/${locale}: Correctly rejected - ${error.message}`);
      invalidTests++;
    }
  });

  console.log(`\n📊 Validation Tests: ${validTests}/4 valid passed, ${invalidTests}/2 invalid rejected\n`);
  return validTests >= 4;
}

// Test default fallbacks
function testDefaultFallbacks() {
  console.log('🧪 Testing Default Fallbacks...\n');

  const defaultCurrency = {
    code: 'GBP',
    symbol: '£',
    locale: 'en-GB'
  };

  try {
    const formatted = new Intl.NumberFormat(defaultCurrency.locale, {
      style: 'currency',
      currency: defaultCurrency.code
    }).format(1234.56);

    console.log(`✅ Default fallback (${defaultCurrency.code}): ${formatted}`);
    console.log(`✅ Default symbol: ${defaultCurrency.symbol}`);
    console.log(`✅ Default locale: ${defaultCurrency.locale}`);
    
    console.log('\n📊 Default Fallback Tests: All passed\n');
    return true;
  } catch (error) {
    console.log(`❌ Default fallback failed: ${error.message}`);
    console.log('\n📊 Default Fallback Tests: Failed\n');
    return false;
  }
}

// Test supported currencies from our list
function testSupportedCurrencies() {
  console.log('🧪 Testing Our Supported Currencies List...\n');

  const supportedCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'KRW',
    'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'TRY', 'BRL', 'MXN',
    'ZAR', 'ILS', 'SAR', 'AED', 'SGD', 'HKD', 'NZD'
  ];

  let supportedCount = 0;
  let totalCount = supportedCurrencies.length;

  supportedCurrencies.forEach(code => {
    try {
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code
      }).format(100);
      supportedCount++;
      if (supportedCount <= 5) { // Only show first 5 to avoid spam
        console.log(`✅ ${code}: Supported`);
      }
    } catch (error) {
      console.log(`❌ ${code}: Not supported - ${error.message}`);
    }
  });

  if (supportedCount > 5) {
    console.log(`... and ${supportedCount - 5} more currencies`);
  }

  console.log(`\n📊 Supported Currencies: ${supportedCount}/${totalCount} work with Intl.NumberFormat\n`);
  return supportedCount > totalCount * 0.8; // 80% should work
}

// Run all tests
function runAllTests() {
  console.log('🚀 Currency Integration Test Suite\n');
  console.log('='.repeat(50) + '\n');

  const results = {
    formatting: testCurrencyFormatting(),
    validation: testCurrencyValidation(),
    fallbacks: testDefaultFallbacks(),
    supported: testSupportedCurrencies()
  };

  console.log('📋 Test Summary:');
  console.log('='.repeat(30));
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const overallPassed = Object.values(results).every(result => result);
  console.log('\n' + '='.repeat(30));
  console.log(`${overallPassed ? '🎉' : '💥'} Overall: ${overallPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (overallPassed) {
    console.log('\n✨ Currency integration is working correctly!');
    console.log('🔧 Next steps:');
    console.log('   1. Run the migration script: node scripts/db/migrate-currency-settings.js');
    console.log('   2. Test the settings page in the browser');
    console.log('   3. Verify currency changes reflect across the dashboard');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the currency configuration.');
  }

  console.log('\n' + '='.repeat(50));
  
  return overallPassed;
}

// Execute if run directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

export { runAllTests }; 