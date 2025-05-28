# Cloudinary Setup for Product Image Uploads

The project is configured to use Cloudinary for product image uploads with an unsigned upload preset.

## Creating an Unsigned Upload Preset (Required)

You need to create a specific unsigned upload preset for this project:

1. Log in to your Cloudinary dashboard at [https://cloudinary.com/console](https://cloudinary.com/console)
2. Navigate to Settings > Upload > Upload presets
3. Click "Add upload preset"
4. Set the following options:
   - Preset name: `business_dashboard_unsigned` (must match the name in the code)
   - Signing Mode: Set to "Unsigned" (this is critical)
   - Folder: Set to "products" (optional but recommended)
   - Access Mode: Set to "public"
5. Save the preset

## Why We Need an Unsigned Preset

The error you're seeing ("Upload preset must be whitelisted for unsigned uploads") occurs because:

1. The `ml_default` preset is configured for signed uploads
2. Our client-side code is attempting to use it for unsigned uploads
3. For security reasons, Cloudinary requires presets to be explicitly marked as unsigned for direct browser uploads

## Two Options for Image Uploads

### Option 1: Unsigned Upload (Current Implementation)

This is what we're using now. It's simpler but less secure:

- Direct browser-to-Cloudinary uploads
- Requires an unsigned upload preset
- No server-side code needed
- Less secure but easier to implement

### Option 2: Server-Side Upload (More Secure)

We've prepared server-side code for this approach:

- Browser uploads to your server first
- Server uses your Cloudinary API secret to securely upload to Cloudinary
- More secure but requires setting up the server

## Update the Code for a Different Preset

If you want to use a different preset, update the `uploadToCloudinary` function in `client/src/lib/cloudinary.ts`:

```typescript
// Change this line:
formData.append('upload_preset', 'ml_default');

// To use your preset name:
formData.append('upload_preset', 'your_preset_name'); // Replace with your preset name
```

## Environment Variables

Make sure your Cloudinary cloud name is correctly set in the `.env` file:

```env
CLOUDINARY_CLOUD_NAME=dbmj7rhwt
```

And in the client-side `.env.local` file:

```env
VITE_CLOUDINARY_CLOUD_NAME=dbmj7rhwt
```

## Troubleshooting

If you encounter upload errors:

1. Check the browser console for detailed error messages
2. Verify that your cloud name is correct
3. Ensure the upload preset exists and is set to "Unsigned"
4. Check that the file size is within Cloudinary's limits for your plan
5. Verify that the file type is supported (images: jpg, png, gif, etc.)

For more information, see the [Cloudinary documentation on upload presets](https://cloudinary.com/documentation/upload_presets).
