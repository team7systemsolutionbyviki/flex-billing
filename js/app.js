/**
 * App.js
 * Handles core UI interactions, routing, and initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize LocalStorage wrapper (fetches from backend)
    if(window.Storage) await Storage.init();
    
    if(window.checkAMCStatus) window.checkAMCStatus();

    // Set Sidebar User Info
    const loggedInUser = localStorage.getItem('t7_logged_in');
    if(loggedInUser) {
        const nameEl = document.getElementById('sidebar-name');
        const avatarEl = document.getElementById('sidebar-avatar');
        if(loggedInUser === 'viki') {
            if(nameEl) nameEl.textContent = 'Viki';
            if(avatarEl) avatarEl.textContent = 'VK';
        } else if (loggedInUser === 'admin') {
            if(nameEl) nameEl.textContent = 'Admin';
            if(avatarEl) avatarEl.textContent = 'AD';
        } else {
            if(nameEl) nameEl.textContent = loggedInUser.charAt(0).toUpperCase() + loggedInUser.slice(1);
            if(avatarEl) avatarEl.textContent = loggedInUser.substring(0, 2).toUpperCase();
        }
    }

    // UI Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    // Toggle Sidebar
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        if(sidebar.classList.contains('collapsed')) {
            sidebarToggle.innerHTML = '<i class="ri-menu-unfold-line"></i>';
        } else {
            sidebarToggle.innerHTML = '<i class="ri-menu-fold-line"></i>';
        }
    });

    // Theme Toggle
    const currentTheme = localStorage.getItem('t7theme') || 'light';
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const theme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('t7theme', theme);
        updateThemeIcon(theme);
    });

    function updateThemeIcon(theme) {
        if(theme === 'dark') {
            themeToggle.innerHTML = '<i class="ri-sun-line"></i>';
        } else {
            themeToggle.innerHTML = '<i class="ri-moon-line"></i>';
        }
    }

    // Routing Logic (Hash based)
    function handleRoute() {
        let hash = window.location.hash || '#dashboard';
        
        // Remove active class from all nav items and hide all views
        navItems.forEach(item => item.classList.remove('active'));
        views.forEach(view => view.classList.remove('active'));

        // Find target nav item and view
        const targetNav = Array.from(navItems).find(nav => nav.getAttribute('href') === hash);
        
        if (targetNav) {
            targetNav.classList.add('active');
            const targetViewId = targetNav.getAttribute('data-target');
            const targetView = document.getElementById(targetViewId);
            
            if (targetView) {
                targetView.classList.add('active');
                pageTitle.textContent = targetNav.querySelector('span').textContent;
                
                // Trigger specific init functions based on view
                triggerViewInit(hash);
            }
        } else {
            // Fallback to dashboard
            window.location.hash = '#dashboard';
        }
    }

    function triggerViewInit(hash) {
        switch(hash) {
            case '#dashboard':
                if(window.Dashboard) Dashboard.init();
                break;
            case '#billing':
                if(window.Billing) Billing.init();
                break;
            case '#customers':
                if(window.Customers) Customers.init();
                break;
            case '#services':
                if(window.Services) Services.init();
                break;
            case '#jobs':
                if(window.Jobs) Jobs.init();
                break;
            case '#settings':
                if(window.Settings) Settings.init();
                break;
            case '#reports':
                if(window.Reports) Reports.init();
                break;
            case '#expenses':
                if(window.Expenses) Expenses.init();
                break;
            case '#purchases':
                if(window.Purchases) Purchases.init();
                break;
            case '#inventory':
                if(window.Inventory) Inventory.init();
                break;
        }
    }

    // Listen to hash changes
    window.addEventListener('hashchange', handleRoute);
    
    // Initial route setup
    handleRoute();
    
    // Notifications init
    if(window.updateNotificationBadge) window.updateNotificationBadge();

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // F2: New Bill
        if (e.key === 'F2') {
            e.preventDefault();
            window.location.hash = '#billing';
        }
        
        // Alt + Number: Sidebar Navigation
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            switch(e.key) {
                case '1': window.location.hash = '#dashboard'; e.preventDefault(); break;
                case '2': window.location.hash = '#billing'; e.preventDefault(); break;
                case '3': window.location.hash = '#jobs'; e.preventDefault(); break;
                case '4': window.location.hash = '#customers'; e.preventDefault(); break;
                case '5': window.location.hash = '#services'; e.preventDefault(); break;
                case '6': window.location.hash = '#inventory'; e.preventDefault(); break;
                case '7': window.location.hash = '#purchases'; e.preventDefault(); break;
                case '8': window.location.hash = '#expenses'; e.preventDefault(); break;
                case '9': window.location.hash = '#reports'; e.preventDefault(); break;
                case '0': window.location.hash = '#settings'; e.preventDefault(); break;
            }
        }
        
        // F3: Focus Customer Search (if in billing)
        if (e.key === 'F3') {
            const customerSearch = document.getElementById('pos-customer-search');
            if (customerSearch && window.location.hash === '#billing') {
                e.preventDefault();
                customerSearch.focus();
            }
        }
        
        // F4: Focus Service Search (if in billing)
        if (e.key === 'F4') {
            const serviceSearch = document.getElementById('pos-service-search');
            if (serviceSearch && window.location.hash === '#billing') {
                e.preventDefault();
                serviceSearch.focus();
            }
        }
        
        // Escape: Close all open modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Job Alarms Check (runs every minute)
    setInterval(() => {
        if(!window.Storage) return;
        const jobs = Storage.get('jobs').filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED' && j.dueDate);
        const now = new Date();
        let changed = false;

        jobs.forEach(j => {
            const due = new Date(j.dueDate);
            const diffMin = (due - now) / 60000; // difference in minutes
            
            // Check if due in <= 30 mins
            if(diffMin > 0 && diffMin <= 30 && !j.notified_30) {
                showToast(`⏳ Job ${j.id} is due in ${Math.round(diffMin)} minutes!`, 'warning');
                j.notified_30 = true;
                Storage.update('jobs', j.id, { notified_30: true });
                changed = true;
                playAlarmBeep();
            } 
            // Check if overdue
            else if (diffMin <= 0 && !j.notified_overdue) {
                showToast(`🚨 Job ${j.id} is OVERDUE!`, 'error');
                j.notified_overdue = true;
                Storage.update('jobs', j.id, { notified_overdue: true });
                changed = true;
                playAlarmBeep();
            }
        });
        
        if (changed && window.Jobs && window.location.hash === '#jobs') {
            Jobs.renderTable();
        }
    }, 60000);
});

// Global Alarm Sound
window.playAlarmBeep = function() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if(!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        
        // Beep pattern
        setTimeout(() => osc.frequency.setValueAtTime(1108.73, ctx.currentTime), 150); // C#6
        
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {
        console.error("Audio playback failed", e);
    }
};

// Global Toast Notification System
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ri-information-line';
    let title = 'Notification';
    
    if(type === 'success') { icon = 'ri-check-line'; title = 'Success'; }
    if(type === 'error') { icon = 'ri-error-warning-line'; title = 'Error'; }
    if(type === 'warning') { icon = 'ri-alert-line'; title = 'Warning'; }

    toast.innerHTML = `
        <div class="toast-icon"><i class="${icon}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="ri-close-line"></i></button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
        if(document.body.contains(toast)) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
};

// Global formatters
window.formatCurrency = function(amount) {
    return '₹ ' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

window.formatDate = function(dateString) {
    if(!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' });
};

window.logout = async function() {
    if(confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('t7_logged_in');
        
        // Take Data Backup before redirect
        const data = {};
        if (window.Storage && Storage.cache) {
            Storage.collections.forEach(col => {
                if (Storage.cache[col]) {
                    data[col] = Storage.cache[col];
                }
            });
        }
        
        if(Object.keys(data).length > 0) {
            const now = new Date();
            const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            const timeStr = String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0') + '-' + String(now.getSeconds()).padStart(2, '0');
            const filename = `T7-PRINT-BACKUP-LOGOUT-${dateStr}_${timeStr}.json`;
            const contentStr = JSON.stringify(data, null, 2);
            const customPath = localStorage.getItem('t7_data_path') || 'C:/T7-Backups';

            let usedServer = false;
            try {
                const response = await fetch('http://localhost:3000/api/backup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: customPath, filename: filename, content: contentStr })
                });
                if (response.ok) usedServer = true;
            } catch(e) {}

            if(!usedServer) {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(contentStr);
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.setAttribute("href", dataStr);
                dlAnchorElem.setAttribute("download", filename);
                document.body.appendChild(dlAnchorElem);
                dlAnchorElem.click();
                document.body.removeChild(dlAnchorElem);
            }
        }

        showToast('Logged out successfully. Backup completed.', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
};

window.sendHelpMessage = function() {
    let shopName = 'Shop';
    if (window.Storage) {
        const shop = Storage.get('shop');
        if (shop && shop.name) {
            shopName = shop.name;
        }
    }
    const message = `I contact from ${shopName} and I need a help.`;
    const url = `https://wa.me/919360039283?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

window.getNotificationsList = function() {
    let notifications = [];
    if (!window.Storage) return notifications;
    
    // Check Jobs
    const jobs = Storage.get('jobs').filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED' && j.dueDate);
    const now = new Date();
    const todayStr = now.toDateString();
    
    jobs.forEach(j => {
        const due = new Date(j.dueDate);
        const diffHours = (due - now) / 3600000;
        
        if (diffHours < 0) {
            notifications.push({ type: 'danger', icon: 'ri-alert-line', text: `Job <strong>${j.id}</strong> is overdue!` });
        } else if (diffHours <= 24 && due.toDateString() === todayStr) {
            notifications.push({ type: 'warning', icon: 'ri-time-line', text: `Job <strong>${j.id}</strong> is due today.` });
        }
    });
    
    // Check Inventory
    const inventory = Storage.get('inventory') || [];
    inventory.forEach(item => {
        if (parseFloat(item.stock) <= parseFloat(item.minStock || 0)) {
            notifications.push({ type: 'warning', icon: 'ri-stock-line', text: `Low stock alert: <strong>${item.name}</strong> (${item.stock} left)` });
        }
    });
    
    return notifications;
};

window.updateNotificationBadge = function() {
    const notifications = window.getNotificationsList();
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (notifications.length > 0) {
            badge.textContent = notifications.length;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
};

window.showNotifications = function() {
    window.updateNotificationBadge(); // Refresh just in case
    const notifications = window.getNotificationsList();
    const list = document.getElementById('notification-list');
    
    if (notifications.length === 0) {
        list.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-muted);">No new notifications.</div>';
    } else {
        list.innerHTML = notifications.map(n => `
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); display:flex; gap: 0.75rem; align-items:flex-start;">
                <div style="color:var(--${n.type}); font-size:1.25rem;"><i class="${n.icon}"></i></div>
                <div style="font-size:0.875rem;">${n.text}</div>
            </div>
        `).join('');
    }
    
    document.getElementById('notification-modal').classList.add('active');
};

window.checkAMCStatus = function() {
    const loggedInUser = localStorage.getItem('t7_logged_in');
    if (loggedInUser === 'viki') return; // Viki is never locked out
    
    if (window.Storage) {
        const shop = Storage.get('shop');
        if (shop) {
            let expiryDateStr = shop.amcExpiry;
            
            // Check for user-specific AMC plan
            if (shop.amcPlans && shop.amcPlans[loggedInUser]) {
                expiryDateStr = shop.amcPlans[loggedInUser];
            }
            
            if (expiryDateStr) {
                const expiry = new Date(expiryDateStr);
                const now = new Date();
                expiry.setHours(23, 59, 59, 999);
                
                if (now > expiry) {
                    const lockScreen = document.getElementById('amc-lock-screen');
                    if (lockScreen) {
                        lockScreen.style.display = 'flex';
                    }
                }
            }
        }
    }
};
