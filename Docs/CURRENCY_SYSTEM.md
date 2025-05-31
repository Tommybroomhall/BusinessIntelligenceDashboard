# Currency System Documentation

This document describes the centralized currency system implemented in the Business Intelligence Dashboard.

## Overview

The currency system allows each business tenant to configure their preferred currency, which is then used consistently throughout the dashboard for all monetary displays, calculations, and exports.

## Key Features

- ✅ **Centralized Configuration**: Single currency setting per tenant/business
- ✅ **Global Support**: Supports 27+ major world currencies
- ✅ **Automatic Formatting**: Uses `Intl.NumberFormat` for proper localization
- ✅ **Backward Compatibility**: Existing tenants get GBP (£) as default
- ✅ **Real-time Updates**: Currency changes reflect immediately across the dashboard
- ✅ **Server Validation**: Backend validates currency codes and locale compatibility

## Architecture

### Database Schema

**Tenant Model** (`server/models.ts`):
```typescript
interface ITenant {
  // ... other fields
  currencyCode: string;    // ISO currency code (e.g., "GBP", "USD", "EUR")
  currencySymbol: string;  // Currency symbol (e.g., "£", "$", "€")
  currencyLocale: string;  // Locale for formatting (e.g., "en-GB", "en-US")
}
```

**Default Values**:
- `currencyCode`: "GBP"
- `currencySymbol`: "£"  
- `currencyLocale`: "en-GB"

### Frontend Implementation

**Currency Context** (`client/src/context/CurrencyContext.tsx`):
- Provides currency settings to all components
- Automatically fetches tenant currency configuration
- Provides formatting hooks for components

**Utilities** (`client/src/lib/utils.ts`):
- `formatCurrency()` - Main formatting function using `Intl.NumberFormat`
- `formatCurrencySymbol()` - Alternative symbol-based formatting
- `DEFAULT_CURRENCY` - Fallback currency settings

### Backend Implementation

**API Routes** (`server/routes/tenants/index.ts`):
- `GET /api/tenants` - Returns tenant with currency settings
- `PATCH /api/tenants` - Updates tenant currency settings with validation

**Validation**:
- Currency codes must be from the supported list
- Locale format must match regex: `/^[a-z]{2}(-[A-Z]{2})?$/`
- Backend tests currency/locale compatibility with `Intl.NumberFormat`

## Supported Currencies

| Code | Symbol | Name | Example Locale |
|------|--------|------|----------------|
| GBP  | £      | British Pound Sterling | en-GB |
| USD  | $      | US Dollar | en-US |
| EUR  | €      | Euro | en-IE |
| JPY  | ¥      | Japanese Yen | ja-JP |
| AUD  | A$     | Australian Dollar | en-AU |
| CAD  | C$     | Canadian Dollar | en-CA |
| INR  | ₹      | Indian Rupee | en-IN |
| ... and 20+ more | | | |

*Full list available in `server/models.ts` and `shared/types.ts`*

## Usage

### Frontend Components

```typescript
import { useCurrencyFormatter } from '@/context/CurrencyContext';

function MyComponent() {
  const { formatCurrency } = useCurrencyFormatter();
  
  return (
    <div>
      Price: {formatCurrency(123.45)}
      {/* Outputs: £123.45 (if tenant uses GBP) */}
    </div>
  );
}
```

### Settings Page

Users can change currency via Settings → Business → Business Currency:

1. Select from dropdown of supported currencies
2. Changes are saved to database via API
3. Currency context refreshes automatically
4. All monetary displays update immediately

## Migration

### For Existing Deployments

Run the migration script to add currency settings to existing tenants:

```bash
node scripts/db/migrate-currency-settings.js
```

This script:
- Finds tenants without currency settings
- Sets default currency to GBP (£) 
- Updates `currencyCode`, `currencySymbol`, and `currencyLocale` fields

### Database Migration

The Mongoose schema includes default values, so new tenant creation automatically includes currency settings.

## Testing

### Automated Tests

Run the currency integration test suite:

```bash
node scripts/test/test-currency-integration.js
```

Tests cover:
- Currency formatting with various locales
- Validation of currency codes  
- Default fallbacks
- Supported currency compatibility

### Manual Testing

1. **Settings Page**: Change currency and verify it saves
2. **Dashboard**: Check sales overview displays new currency
3. **Products**: Verify product prices show new currency
4. **Orders**: Check order amounts use new currency
5. **Customers**: Verify customer spending displays new currency

## Error Handling

### Frontend Fallbacks

- **Missing currency settings**: Falls back to GBP (£) with warning
- **Invalid currency data**: Uses default settings
- **API errors**: Shows error toast but continues with cached data

### Backend Validation

- **Invalid currency codes**: Returns 400 error with details
- **Incompatible locale/currency**: Tests with `Intl.NumberFormat` before saving
- **Malformed data**: Validates with Zod schema

## Components Updated

All components displaying monetary values have been updated:

- ✅ Sales Overview (`sales-overview.tsx`)
- ✅ Popular Products (`popular-products.tsx`)  
- ✅ Products Page (`Products.tsx`)
- ✅ Order Details (`order-details-dialog.tsx`)
- ✅ Customer Details (`customer-details-dialog.tsx`)
- ✅ Settings Page (`settings.tsx`)

## File Structure

```
├── server/
│   ├── models.ts                 # Database schemas with currency fields
│   ├── routes/tenants/index.ts   # API routes with currency validation
│   └── mongoStorage.ts           # Database operations
├── client/src/
│   ├── context/CurrencyContext.tsx   # Currency context and hooks
│   ├── lib/utils.ts                  # Currency formatting utilities
│   ├── pages/settings.tsx            # Currency configuration UI
│   └── components/                   # Updated components
├── shared/
│   └── types.ts                  # Shared currency types
├── scripts/
│   ├── db/migrate-currency-settings.js    # Migration script
│   └── test/test-currency-integration.js  # Test suite
└── docs/
    └── CURRENCY_SYSTEM.md        # This documentation
```

## Troubleshooting

### Common Issues

**Currency not updating**: 
- Check browser console for API errors
- Verify currency context is properly wrapped around components
- Clear browser cache and reload

**Invalid currency error**:
- Ensure currency code is in supported list
- Check locale format matches pattern
- Verify currency/locale compatibility

**Default currency showing**:
- Check tenant has currency settings in database
- Run migration script if upgrading from old version
- Verify API endpoint returns currency fields

### Debug Steps

1. Check browser network tab for `/api/tenants` response
2. Verify currency fields are present in response
3. Check console for currency context warnings
4. Test currency formatting in browser console:
   ```javascript
   new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP'}).format(123.45)
   ```

## Next Steps

Future enhancements could include:

- **Exchange Rate Integration**: Auto-convert between currencies
- **Historical Rates**: Track currency changes over time  
- **Multi-Currency Support**: Support different currencies per product/customer
- **Currency Symbols in Charts**: Update chart libraries to use tenant currency
- **Export Formatting**: Ensure PDFs and CSV exports use correct currency

---

*Last updated: [Current Date]*
*Version: 1.0* 