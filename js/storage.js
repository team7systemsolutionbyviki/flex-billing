/**
 * Storage.js
 * Emulates a local server database using localStorage/IndexedDB.
 * Provides a clean API for modules to use.
 */

const Storage = {
    prefix: 't7print_',
    
    // Core Collections
    collections: [
        'shop', 'settings', 'customers', 'suppliers', 'products', 
        'services', 'service_categories', 'invoices', 'quotations', 'jobs', 'purchases', 
        'expenses', 'expense_categories', 'payments', 'users', 'inventory', 'activity_log'
    ],

    cache: {},

    // Initialize missing collections
    async init() {
        let backendHasData = false;
        const customPath = localStorage.getItem('t7_data_path') || '';
        const urlParams = customPath ? `?path=${encodeURIComponent(customPath)}` : '';
        
        // Try to fetch initial data from Node backend
        try {
            const response = await fetch(`http://localhost:3000/api/data${urlParams}`);
            if(response.ok) {
                const resData = await response.json();
                if(resData.success && resData.data && Object.keys(resData.data).length > 0) {
                    backendHasData = true;
                    // Hydrate cache with backend data
                    Object.keys(resData.data).forEach(col => {
                        this.cache[col] = resData.data[col];
                    });
                }
            }
        } catch(e) {
            console.log("Backend not running, falling back to cache only");
        }

        this.collections.forEach(col => {
            const localData = localStorage.getItem(this.prefix + col);
            
            if (backendHasData && this.cache[col]) {
                localStorage.setItem(this.prefix + col, JSON.stringify(this.cache[col]));
            } else if (!backendHasData && localData) {
                this.cache[col] = JSON.parse(localData);
            } else if (!this.cache[col]) {
                this.cache[col] = this.getDefault(col);
                this.set(col, this.cache[col]);
            }
        });
        
        // Initial setup for shop settings if empty
        let shop = this.get('shop');
        if (!shop || Object.keys(shop).length === 0) {
            this.set('shop', {
                name: 'T7 PRINT BILLING',
                owner: 'Admin',
                phone: '9876543210',
                email: 'info@t7print.com',
                address: '123 Print Street, Tamil Nadu, India',
                gstin: '33ABCDE1234F1Z5'
            });
        }
    },

    getDefault(col) {
        if (col === 'shop' || col === 'settings') return {};
        return [];
    },

    // Read full collection
    get(collection) {
        return this.cache[collection] || this.getDefault(collection);
    },

    set(collection, data) {
        this.cache[collection] = data;
        
        // Save to localStorage as the primary persistence mechanism
        localStorage.setItem(this.prefix + collection, JSON.stringify(data));
        
        const customPath = localStorage.getItem('t7_data_path') || '';
        const urlParams = customPath ? `?path=${encodeURIComponent(customPath)}` : '';
        
        // Sync to backend asynchronously (Optimistic UI)
        fetch(`http://localhost:3000/api/collection/${collection}${urlParams}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(e => { /* Ignore if offline */ });
    },

    // Add new record to an array collection
    add(collection, item) {
        const data = this.get(collection);
        if (!Array.isArray(data)) return false;
        
        if (!item.id) {
            item.id = Date.now().toString() + Math.floor(Math.random()*1000).toString();
        }
        item.createdAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        
        data.push(item);
        this.set(collection, data);
        
        this.logActivity('Create', collection, `Added new item in ${collection}`);
        return item.id;
    },

    // Update existing record
    update(collection, id, updates) {
        const data = this.get(collection);
        if (!Array.isArray(data)) return false;
        
        const index = data.findIndex(item => item.id === id);
        if (index === -1) return false;
        
        data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
        this.set(collection, data);
        
        this.logActivity('Update', collection, `Updated item ${id} in ${collection}`);
        return true;
    },

    // Delete record
    remove(collection, id) {
        let data = this.get(collection);
        if (!Array.isArray(data)) return false;
        
        const initialLength = data.length;
        data = data.filter(item => item.id !== id);
        
        if (data.length !== initialLength) {
            this.set(collection, data);
            this.logActivity('Delete', collection, `Deleted item ${id} from ${collection}`);
            return true;
        }
        return false;
    },
    
    // Find record by ID
    findById(collection, id) {
        const data = this.get(collection);
        if (!Array.isArray(data)) return null;
        return data.find(item => item.id === id) || null;
    },

    logActivity(action, module, description) {
        const logs = this.get('activity_log');
        logs.unshift({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            action,
            module,
            description,
            user: 'Admin'
        });
        
        // Keep only last 100 logs
        if(logs.length > 100) logs.length = 100;
        
        this.set('activity_log', logs);
    },

    // Generate Demo Data
    generateDemoData() {
        this.set('customers', [
            { id: 'c1', name: 'Rahul Sharma', mobile: '9876543211', type: 'Retail', balance: 0 },
            { id: 'c2', name: 'Mega Prints Ltd', mobile: '9876543212', type: 'Business', balance: 5000 },
            { id: 'c3', name: 'Suresh Kumar', mobile: '9876543213', type: 'Dealer', balance: 1500 }
        ]);

        this.set('services', [
            { id: 's1', code: 'FLX-1', name: 'Normal Flex', category: 'Flex', unit: 'Sq.Ft', rate: 12, dealerRate: 8, wholesaleRate: 7 },
            { id: 's2', code: 'FLX-2', name: 'Star Flex', category: 'Flex', unit: 'Sq.Ft', rate: 25, dealerRate: 18, wholesaleRate: 15 },
            { id: 's3', code: 'PHT-1', name: '4x6 Photo Print', category: 'Photo', unit: 'PCS', rate: 10, dealerRate: 7, wholesaleRate: 5 },
            { id: 's4', code: 'VC-1', name: 'Visiting Card (1000pcs)', category: 'Card', unit: 'BOX', rate: 500, dealerRate: 350, wholesaleRate: 300 }
        ]);

        this.set('service_categories', [
            { id: 'cat1', name: 'Flex' },
            { id: 'cat2', name: 'Photo' },
            { id: 'cat3', name: 'Card' },
            { id: 'cat4', name: 'Xerox' },
            { id: 'cat5', name: 'Lamination' },
            { id: 'cat6', name: 'Other' }
        ]);

        this.set('expense_categories', [
            { id: 'ec1', name: 'Rent' },
            { id: 'ec2', name: 'Electricity' },
            { id: 'ec3', name: 'Salary' },
            { id: 'ec4', name: 'Transport' },
            { id: 'ec5', name: 'Internet' },
            { id: 'ec6', name: 'Phone' },
            { id: 'ec7', name: 'Maintenance' },
            { id: 'ec8', name: 'Ink' },
            { id: 'ec9', name: 'Material' },
            { id: 'ec10', name: 'Repair' },
            { id: 'ec11', name: 'Other' }
        ]);
        
        this.set('jobs', [
            { id: 'j1', customerId: 'c1', serviceId: 's1', status: 'NEW', date: new Date().toISOString(), total: 1200, advance: 500 },
            { id: 'j2', customerId: 'c2', serviceId: 's4', status: 'PRINTING', date: new Date().toISOString(), total: 500, advance: 500 }
        ]);
        
        this.set('invoices', [
            { id: 'i1', no: 'INV-001', date: new Date().toISOString(), customerId: 'c1', total: 1200, paid: 1200, balance: 0 },
            { id: 'i2', no: 'INV-002', date: new Date().toISOString(), customerId: 'c3', total: 3500, paid: 2000, balance: 1500 }
        ]);
    },

    clearAllData() {
        if(confirm("Are you sure you want to clear all data? This cannot be undone.")) {
            this.collections.forEach(col => {
                this.cache[col] = this.getDefault(col);
                this.set(col, this.cache[col]); // pushes empty state to backend
            });
        }
    }
};

