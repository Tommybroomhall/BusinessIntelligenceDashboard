/**
 * Security utilities for sanitizing user input and preventing XSS attacks
 */

/**
 * Sanitizes URLs to prevent XSS attacks
 * Only allows http, https, and data URLs for images
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  // Empty string check
  if (!trimmedUrl) {
    return null;
  }

  try {
    // Parse the URL to validate it
    const parsedUrl = new URL(trimmedUrl);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'data:'];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      console.warn('Blocked potentially unsafe URL protocol:', parsedUrl.protocol);
      return null;
    }

    // For data URLs, ensure they're image types
    if (parsedUrl.protocol === 'data:') {
      const imageDataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/i;
      if (!imageDataUrlPattern.test(trimmedUrl)) {
        console.warn('Blocked non-image data URL');
        return null;
      }
    }

    return trimmedUrl;
  } catch (error) {
    // Invalid URL format
    console.warn('Invalid URL format:', trimmedUrl);
    return null;
  }
}

/**
 * Sanitizes text content to prevent XSS
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Basic HTML entity encoding
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
} 