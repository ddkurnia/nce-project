import { initHeader, showSearch } from './components/header.js';
import { initBottomNav } from './components/bottomNav.js';
import { initAuth } from './auth.js';
import { initRouter, registerRoute } from './router.js';
import { setState, subscribe } from './state.js';

// Import views
import { mount as homeMount, unmount as homeUnmount } from './views/homeView.js';
import { mount as marketMount, unmount as marketUnmount } from './views/marketView.js';
import { mount as rfqMount, unmount as rfqUnmount } from './views/rfqView.js';
import { mount as messagesMount, unmount as messagesUnmount } from './views/messagesView.js';
import { mount as profileMount, unmount as profileUnmount } from './views/profileView.js';

// Register routes
registerRoute('/', { mount: homeMount, unmount: homeUnmount });
registerRoute('/market', { mount: marketMount, unmount: marketUnmount });
registerRoute('/rfq', { mount: rfqMount, unmount: rfqUnmount });
registerRoute('/messages', { mount: messagesMount, unmount: messagesUnmount });
registerRoute('/profile', { mount: profileMount, unmount: profileUnmount });

// Detail routes (reuse parent views for now)
registerRoute('/market/:id', { mount: marketMount, unmount: marketUnmount });
registerRoute('/rfq/:id', { mount: rfqMount, unmount: rfqUnmount });

// Initialize app
async function initApp() {
  try {
    // Init UI components
    initHeader();
    initBottomNav();

    // Init auth
    await initAuth();

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
