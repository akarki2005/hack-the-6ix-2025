import '../styles/globals.css';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { useEffect } from 'react';

function ThemeOverride() {
  useEffect(() => {
    // Function to apply dark theme to Auth0 elements
    const applyDarkTheme = () => {
      // Target Auth0 widgets and modals
      const auth0Elements = document.querySelectorAll('.auth0-lock, .auth0-lock-widget, [class*="auth0"], [data-auth0]');
      
      auth0Elements.forEach(element => {
        element.style.backgroundColor = '#0f172a';
        element.style.color = '#ffffff';
        
        // Apply to child elements as well
        const children = element.querySelectorAll('*');
        children.forEach(child => {
          if (getComputedStyle(child).backgroundColor === 'rgb(255, 255, 255)' || 
              getComputedStyle(child).backgroundColor === 'white') {
            child.style.backgroundColor = '#1e293b';
            child.style.color = '#ffffff';
          }
        });
      });

      // Target any white dialogs or modals
      const whiteElements = document.querySelectorAll('div, section, aside, main');
      whiteElements.forEach(element => {
        const bgColor = getComputedStyle(element).backgroundColor;
        if (bgColor === 'rgb(255, 255, 255)' || bgColor === 'white') {
          // Check if it's likely a modal/popup (has high z-index or fixed/absolute positioning)
          const computedStyle = getComputedStyle(element);
          const zIndex = parseInt(computedStyle.zIndex) || 0;
          const position = computedStyle.position;
          
          if (zIndex > 100 || position === 'fixed' || position === 'absolute') {
            element.style.backgroundColor = '#0f172a';
            element.style.color = '#ffffff';
          }
        }
      });
    };

    // Apply theme immediately
    applyDarkTheme();

    // Set up observer for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          applyDarkTheme();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Apply theme periodically as fallback
    const interval = setInterval(applyDarkTheme, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}

export default function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <ThemeOverride />
      <Component {...pageProps} />
    </UserProvider>
  );
} 