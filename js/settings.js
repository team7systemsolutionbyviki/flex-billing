window.Settings = {
    init() {
        this.renderView();
    },

    renderView() {
        const shop = Storage.get('shop');
        
        let userManagementHtml = '';
        if (localStorage.getItem('t7_logged_in') === 'viki') {
            let usersOptions = '';
            const users = Storage.get('users') || [];
            users.forEach(u => {
                if (u.username !== 'viki') {
                    usersOptions += `<option value="${u.username}">User (${u.username})</option>`;
                }
            });
            
            userManagementHtml = `
                <div class="row" style="margin-top: 1.5rem;">
                    <div class="col-md-12">
                        <div class="card" style="border: 2px solid var(--primary);">
                            <div class="card-header" style="background: rgba(var(--primary-rgb), 0.1);">
                                <h3 style="color: var(--primary);"><i class="ri-shield-keyhole-line"></i> Super Admin: User Management</h3>
                            </div>
                            <div class="card-body">
                                <form id="add-user-form">
                                    <div class="row">
                                        <div class="col-md-4 form-group">
                                            <label>New Admin Username</label>
                                            <input type="text" class="form-control" id="new-username" required>
                                        </div>
                                        <div class="col-md-4 form-group">
                                            <label>Password</label>
                                            <input type="text" class="form-control" id="new-password" required>
                                        </div>
                                        <div class="col-md-4 form-group" style="display:flex; align-items:flex-end;">
                                            <button type="button" class="btn btn-primary" onclick="Settings.addUser()" style="width:100%; margin-bottom:0.25rem;"><i class="ri-user-add-line"></i> Add Admin</button>
                                        </div>
                                    </div>
                                </form>

                                <hr style="margin: 1.5rem 0; border-color: var(--border-color);">
                                <form id="amc-form">
                                    <h4 style="margin-bottom:1rem; color:var(--text-main);"><i class="ri-calendar-check-line"></i> AMC Plan Management</h4>
                                    <div class="row">
                                        <div class="col-md-4 form-group">
                                            <label>Select User</label>
                                            <select class="form-control" id="amc-user" onchange="Settings.loadUserAMC()">
                                                <option value="">-- Global (All Users) --</option>
                                                ${usersOptions}
                                            </select>
                                        </div>
                                        <div class="col-md-4 form-group">
                                            <label>AMC Expiry Date</label>
                                            <input type="date" class="form-control" id="amc-expiry-date" value="${shop.amcExpiry || ''}">
                                        </div>
                                        <div class="col-md-4 form-group" style="display:flex; align-items:flex-end;">
                                            <button type="button" class="btn btn-warning" onclick="Settings.saveAMC()" style="width:100%; margin-bottom:0.25rem;"><i class="ri-save-3-line"></i> Set AMC Plan</button>
                                        </div>
                                    </div>
                                </form>
                                <div class="table-responsive" style="margin-top: 1.5rem;">
                                    <table class="table" id="users-table">
                                        <thead><tr><th>Username</th><th>Password</th><th>Role</th><th>Actions</th></tr></thead>
                                        <tbody></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        let amcStatusHtml = '';
        const loggedInUser = localStorage.getItem('t7_logged_in');
        
        let userExpiryDate = shop.amcExpiry;
        if (shop.amcPlans && shop.amcPlans[loggedInUser]) {
            userExpiryDate = shop.amcPlans[loggedInUser];
        }

        if (userExpiryDate && loggedInUser !== 'viki') {
            const expiryObj = new Date(userExpiryDate);
            const now = new Date();
            expiryObj.setHours(23, 59, 59, 999);
            const diffDays = Math.ceil((expiryObj - now) / (1000 * 60 * 60 * 24));
            
            let statusColor = 'var(--success)';
            let statusText = `Active (Expires on ${userExpiryDate})`;
            
            if (diffDays <= 0) {
                statusColor = 'var(--danger)';
                statusText = 'Expired';
            } else if (diffDays <= 30) {
                statusColor = 'var(--warning)';
                statusText = `Expires soon (${diffDays} days left - ${userExpiryDate})`;
            }
            
            amcStatusHtml = `
                <div class="card" style="border-left: 4px solid ${statusColor}; margin-bottom: 1.5rem;">
                    <div class="card-body" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0; color:var(--text-main);"><i class="ri-shield-check-line" style="color:${statusColor};"></i> AMC Plan Status</h4>
                            <p style="margin:0; margin-top:0.25rem; color:var(--text-muted); font-size:0.9rem;">Your Annual Maintenance Contract status.</p>
                        </div>
                        <div style="font-weight:bold; color:${statusColor}; font-size:1.1rem; text-align:right;">
                            ${statusText}
                        </div>
                    </div>
                </div>
            `;
        }
        
        const html = `
            ${amcStatusHtml}
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h3>Shop Details</h3>
                        </div>
                        <div class="card-body">
                            <form id="shop-settings-form">
                                <div class="form-group">
                                    <label>Shop Name *</label>
                                    <input type="text" class="form-control" id="shop-name" value="${shop.name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>Owner Name</label>
                                    <input type="text" class="form-control" id="shop-owner" value="${shop.owner || ''}">
                                </div>
                                <div class="row">
                                    <div class="col-md-6 form-group">
                                        <label>Phone Number *</label>
                                        <input type="text" class="form-control" id="shop-phone" value="${shop.phone || ''}" required>
                                    </div>
                                    <div class="col-md-6 form-group">
                                        <label>Email</label>
                                        <input type="email" class="form-control" id="shop-email" value="${shop.email || ''}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Complete Address</label>
                                    <input type="text" class="form-control" id="shop-address" value="${shop.address || ''}">
                                </div>
                                <div class="row">
                                    <div class="col-md-4 form-group">
                                        <label>GSTIN</label>
                                        <input type="text" class="form-control" id="shop-gstin" value="${shop.gstin || ''}">
                                    </div>
                                    <div class="col-md-4 form-group">
                                        <label>PAN / Udyam Number</label>
                                        <input type="text" class="form-control" id="shop-pan" value="${shop.pan || ''}">
                                    </div>
                                    <div class="col-md-4 form-group">
                                        <label>GST % (Default)</label>
                                        <input type="number" class="form-control" id="shop-gst-percent" value="${shop.gstPercent !== undefined ? shop.gstPercent : 18}" min="0" max="100" step="0.1">
                                    </div>
                                </div>
                                <div style="margin-top: 1rem;">
                                    <button type="button" class="btn btn-primary" onclick="Settings.saveShopDetails()"><i class="ri-save-line"></i> Save Shop Details</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h3>Data & Architecture</h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label>Automatic Backup Folder Path (Requires backup-server.js)</label>
                                <input type="text" class="form-control" id="data-path" value="${localStorage.getItem('t7_data_path') || 'C:/T7-Backups'}" placeholder="e.g. C:/T7-Backups">
                                <small style="color:var(--text-muted); font-size:0.75rem; display:block; margin-top:0.25rem;">
                                    If you run <strong>node backup-server.js</strong> on your computer, backups will automatically save to this exact folder silently. Otherwise, they will download via your browser.
                                </small>
                            </div>
                            <div style="margin-top: 1rem; margin-bottom: 2rem;">
                                <button type="button" class="btn btn-secondary" onclick="Settings.saveDataPath()"><i class="ri-save-line"></i> Save Path</button>
                            </div>
                            
                            <hr style="border:none; border-top:1px solid var(--border-color); margin:1.5rem 0;">
                            
                            <h4 style="margin-bottom:1rem;">Data Management</h4>
                            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                                <button class="btn btn-secondary" onclick="Settings.exportBackup()"><i class="ri-download-line"></i> Download Backup (JSON)</button>
                                <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()"><i class="ri-upload-line"></i> Import Backup (JSON)</button>
                                <input type="file" id="import-file" style="display:none" accept=".json" onchange="Settings.handleImport(event)">
                                <button class="btn btn-danger" onclick="Settings.promptClearData()"><i class="ri-delete-bin-line"></i> Erase All System Data</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ${userManagementHtml}
        `;
        document.getElementById('settings-view').innerHTML = html;
        if (localStorage.getItem('t7_logged_in') === 'viki') {
            this.renderUsersTable();
        }
    },

    saveShopDetails() {
        const name = document.getElementById('shop-name').value;
        const phone = document.getElementById('shop-phone').value;
        
        if(!name || !phone) {
            showToast('Shop Name and Phone are required.', 'error');
            return;
        }

        const shopData = {
            name: name,
            owner: document.getElementById('shop-owner').value,
            phone: phone,
            email: document.getElementById('shop-email').value,
            address: document.getElementById('shop-address').value,
            gstin: document.getElementById('shop-gstin').value,
            pan: document.getElementById('shop-pan').value,
            gstPercent: parseFloat(document.getElementById('shop-gst-percent').value) || 0
        };
        
        Storage.set('shop', shopData);
        showToast('Shop details saved successfully!', 'success');
        
        // Update header if applicable
        const sidebarLogo = document.querySelector('.logo span');
        if(sidebarLogo && name) sidebarLogo.textContent = name;
    },

    renderUsersTable() {
        const users = Storage.get('users') || [];
        const tbody = document.querySelector('#users-table tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        const customUsers = users.filter(u => u.username !== 'viki');
        
        if (customUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No custom admins added yet.</td></tr>';
            return;
        }
        
        customUsers.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td>${u.username}</td>
                    <td>${u.password}</td>
                    <td><span class="status-badge status-ready">${u.role || 'ADMIN'}</span></td>
                    <td>
                        <button class="icon-btn" style="color:var(--danger)" onclick="Settings.deleteUser('${u.id}')"><i class="ri-delete-bin-line"></i></button>
                    </td>
                </tr>
            `;
        });
    },

    addUser() {
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value.trim();
        
        if(!username || !password) {
            showToast('Username and password are required', 'error');
            return;
        }
        
        if(username === 'viki') {
            showToast('Cannot override system accounts', 'error');
            return;
        }
        
        const users = Storage.get('users') || [];
        if(users.some(u => u.username === username)) {
            showToast('Username already exists', 'error');
            return;
        }
        
        Storage.add('users', {
            username: username,
            password: password,
            role: 'ADMIN'
        });
        
        showToast('Admin added successfully', 'success');
        document.getElementById('add-user-form').reset();
        this.renderUsersTable();
    },

    deleteUser(id) {
        if(confirm('Are you sure you want to remove this admin?')) {
            Storage.remove('users', id);
            showToast('Admin removed', 'success');
            this.renderUsersTable();
        }
    },
    
    loadUserAMC() {
        const username = document.getElementById('amc-user').value;
        const shop = Storage.get('shop') || {};
        const amcPlans = shop.amcPlans || {};
        
        if (username) {
            document.getElementById('amc-expiry-date').value = amcPlans[username] || '';
        } else {
            document.getElementById('amc-expiry-date').value = shop.amcExpiry || '';
        }
    },
    
    saveAMC() {
        const username = document.getElementById('amc-user').value;
        const date = document.getElementById('amc-expiry-date').value;
        const shop = Storage.get('shop') || {};
        
        if (username) {
            if (!shop.amcPlans) shop.amcPlans = {};
            shop.amcPlans[username] = date;
        } else {
            shop.amcExpiry = date;
        }
        
        Storage.set('shop', shop);
        showToast('AMC Plan Updated Successfully!', 'success');
    },

    saveDataPath() {
        const path = document.getElementById('data-path').value;
        localStorage.setItem('t7_data_path', path);
        
        // Force a full database sync to the newly selected folder immediately
        if (window.Storage && Storage.cache) {
            Storage.collections.forEach(col => {
                if (Storage.cache[col]) {
                    Storage.set(col, Storage.cache[col]);
                }
            });
        }
        
        showToast('Data path updated! Database synced to ' + path, 'success');
    },

    handleImport(event) {
        const file = event.target.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if(confirm('Are you sure you want to import this data? It will overwrite existing data.')) {
                    Object.keys(data).forEach(key => {
                        Storage.set(key, data[key]);
                    });
                    showToast('Data imported successfully. Reloading...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (err) {
                showToast('Invalid JSON file format', 'error');
            }
            document.getElementById('import-file').value = '';
        };
        reader.readAsText(file);
    },
    
    async exportBackup() {
        const data = {};
        Storage.collections.forEach(col => {
            data[col] = Storage.get(col);
        });
        
        const now = new Date();
        const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const timeStr = String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0') + '-' + String(now.getSeconds()).padStart(2, '0');
        const filename = `T7-PRINT-BACKUP-MANUAL-${dateStr}_${timeStr}.json`;
        const contentStr = JSON.stringify(data, null, 2);
        const customPath = localStorage.getItem('t7_data_path') || 'C:/T7-Backups';

        try {
            // Try pushing to local backup server
            const response = await fetch('http://localhost:3000/api/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: customPath,
                    filename: filename,
                    content: contentStr
                })
            });
            
            if (response.ok) {
                showToast(`Backup silently saved to ${customPath}`, 'success');
                return; // Success! No need for browser download prompt
            }
        } catch (e) {
            // Server not running, fallback to browser download
            console.log('Backup server not reachable. Falling back to browser download.');
        }
        
        // Fallback: standard browser download
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(contentStr);
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", filename);
        dlAnchorElem.click();
        
        showToast('Backup downloaded via browser', 'success');
    },
    
    promptClearData() {
        const loggedInUser = localStorage.getItem('t7_logged_in');
        let correctPassword = null;
        if (loggedInUser === 'viki') {
            correctPassword = 'viki1101';
        } else {
            const users = Storage.get('users') || [];
            const userObj = users.find(u => u.username === loggedInUser);
            if (userObj) correctPassword = userObj.password;
        }
        
        if (!correctPassword) {
            showToast('Unable to verify user credentials.', 'error');
            return;
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:400px; transform:translateY(0);">
                <div class="modal-header">
                    <h3>Confirm Data Erasure</h3>
                    <button class="icon-btn" onclick="this.closest('.modal-overlay').remove()"><i class="ri-close-line"></i></button>
                </div>
                <div class="modal-body">
                    <p style="color:var(--danger); margin-bottom:1rem;"><strong>WARNING:</strong> This will permanently delete ALL system data!</p>
                    <div class="form-group">
                        <label>Enter your password to confirm:</label>
                        <input type="password" id="confirm-erase-password" class="form-control" placeholder="Password">
                    </div>
                </div>
                <div class="modal-footer" style="padding:1rem; text-align:right; border-top:1px solid var(--border-color);">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn btn-danger" id="confirm-erase-btn"><i class="ri-delete-bin-line"></i> Erase All Data</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        setTimeout(() => document.getElementById('confirm-erase-password').focus(), 100);

        document.getElementById('confirm-erase-btn').onclick = () => {
            const val = document.getElementById('confirm-erase-password').value;
            if (val === correctPassword) {
                Storage.clearAllData();
                location.reload();
            } else {
                showToast('Incorrect password. Data not erased.', 'error');
                overlay.remove();
            }
        };
    }
};
