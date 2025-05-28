/**
 * Utility functions for Cloudinary image uploads
 */

/**
 * Uploads an image to Cloudinary
 * @param file The file to upload
 * @returns The Cloudinary URL of the uploaded image
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  try {
    // For now, let's use a fallback approach that works with direct uploads
    // This is a temporary solution until the server-side upload is set up

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);

    // Use the unsigned upload preset - this must be created in Cloudinary dashboard
    // and specifically set to "unsigned" mode
    formData.append('upload_preset', 'business_dashboard_unsigned');

    // Upload to Cloudinary using the cloud name from env
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dbmj7rhwt';

    // Create a unique public_id for the image
    const uniqueId = `product_${Date.now()}`;
    formData.append('public_id', uniqueId);

    // Set folder
    formData.append('folder', 'products');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error details:', errorData);
      throw new Error(`Failed to upload image to Cloudinary: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Generates a Cloudinary URL with transformations
 * @param url The original Cloudinary URL
 * @param width The desired width
 * @param height The desired height
 * @returns The transformed Cloudinary URL
 */
export function getOptimizedImageUrl(url: string, width: number, height: number): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Extract the base URL and file path
  const parts = url.split('/upload/');
  if (parts.length !== 2) {
    return url;
  }

  // Add transformation parameters
  return `${parts[0]}/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${parts[1]}`;
}
