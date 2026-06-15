import { initHeader, showSearch } from './components/header.js';
import { initBottomNav } from './components/bottomNav.js';
import { initAuth } from './auth.js';
import { initRouter, registerRoute } from './router.js';
import { setState, subscribe } from './state.js';
import { initMessaging, requestNotificationPermission } from './services/messagingService.js';

// Import views
import { mount as homeMount, unmount as homeUnmount } from './views/homeView.js';
import { mount as marketMount, unmount as marketUnmount } from './views/marketView.js';
import { mount as rfqMount, unmount as rfqUnmount } from './views/rfqView.js';
import { mount as messagesMount, unmount as messagesUnmount } from './views/messagesView.js';
import { mount as profileMount, unmount as profileUnmount } from './views/profileView.js';
import { mount as marketDetailMount, unmount as marketDetailUnmount } from './views/marketDetailView.js';
import { mount as rfqDetailMount, unmount as rfqDetailUnmount } from './views/rfqDetailView.js';

// Register routes
registerRoute('/', { mount: homeMount, unmount: homeUnmount });
registerRoute('/market', { mount: marketMount, unmount: marketUnmount });
registerRoute('/rfq', { mount: rfqMount, unmount: rfqUnmount });
registerRoute('/messages', { mount: messagesMount, unmount: messagesUnmount });
registerRoute('/profile', { mount: profileMount, unmount: profileUnmount });

// Detail routes
registerRoute('/market/:id', { mount: marketDetailMount, unmount: marketDetailUnmount });
registerRoute('/rfq/:id', { mount: rfqDetailMount, unmount: rfqDetailUnmount });

// Initialize app
async function initApp() {
  try {
    // Init UI components
    initHeader();
    initBottomNav();

    // Init auth
    await initAuth();

    // Init FCM messaging (non-blocking)
    initMessaging().catch(() => {});

    // Request notification permission if not yet decided
    if ('Notification' in window && Notification.permission === 'default') {
      // Delay permission request until user interacts
      const requestOnInteraction = () => {
        requestNotificationPermission();
        document.removeEventListener('click', requestOnInteraction);
      };
      document.addEventListener('click', requestOnInteraction, { once: true });
    }

    // Init router (this triggers initial view render)
    initRouter();

    console.log('NCE App initialized — Indonesia\'s Digital Trading Floor');
  } catch (err) {
    console.error('App init error:', err);
  }
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
