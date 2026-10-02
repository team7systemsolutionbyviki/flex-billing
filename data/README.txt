# Data Architecture - T7 Print Billing

This folder is intended for server-side JSON storage when the application is migrated to a backend like Node.js or Hostinger (PHP).

## Current Static Implementation
Since the current requirement strictly states "HTML5, CSS3, Vanilla JavaScript" with NO backend (No PHP, No Node.js), actual data persistence is handled by the browser's `localStorage` via the `js/storage.js` wrapper.

Frontend JavaScript running in a browser **cannot** write directly to the local file system (this `data/` folder) for security reasons without using specialized APIs like the File System Access API (which requires user prompt) or a running backend server.

Therefore:
1. All application state is preserved locally in the browser.
2. The `Storage.js` interface mimics a database connection.
3. You can export backups as JSON files through the application's Backup module (which will trigger a browser download).
4. For future migration, `Storage.js` can be easily refactored to make `fetch()` calls to a PHP/MySQL or Node backend, reading/writing from this folder or a real database.

### Files intended for this structure once a server is attached:
- shop.json
- settings.json
- customers.json
- suppliers.json
- products.json
- services.json
- invoices.json
- quotations.json
- jobs.json
- purchases.json
- expenses.json
- payments.json
- users.json
- inventory.json
- activity-log.json
