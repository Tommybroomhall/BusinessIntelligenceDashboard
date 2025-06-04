// Define gtag for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Track page views
export const trackPageView = (url: string) => {
  console.log(`Page view tracked: ${url}`);

  // Track in Google Analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!measurementId) return;

    window.gtag('config', measurementId, {
      page_path: url
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  properties?: Record<string, string | number | boolean>
) => {
  // Log for debugging
  console.log(`Event tracked: ${eventName}`, properties);
  
  // Track in Google Analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties || {});
  }
};