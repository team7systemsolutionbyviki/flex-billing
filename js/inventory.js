window.Inventory = {
    init() {
        this.renderView();
        this.renderTable();
    },

    renderView() {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3>Inventory Management</h3>
                    <button class="btn btn-primary" onclick="Inventory.openModal()"><i class="ri-add-line"></i> Add Item</button>
                </div>
                <div class="card-body">
                    <div style="display:flex; gap:1rem; margin-bottom:1.5rem;">
                        <input type="text" class="form-control" id="inventory-search" placeholder="Search Item Name or SKU..." onkeyup="Inventory.renderTable()">
                        <select class="form-control" id="inventory-stock-filter" style="width:200px" onchange="Inventory.renderTable()">
                            <option value="ALL">All Items</option>
                            <option value="LOW">Low Stock Alerts</option>
                            <option value="OUT">Out of Stock</option>
                        </select>
                    </div>
                    
                    <div class="row" style="margin-bottom:1.5rem;">
                        <div class="col-md-4">
                            <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-md); box-shadow:var(--clay-btn-active);">
                                <div style="font-size:0.875rem; color:var(--text-muted); margin-bottom:0.25rem;">Total Inventory Value</div>
                                <div style="font-size:1.5rem; font-weight:700; color:var(--primary);" id="inventory-value-display">₹ 0.00</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-md); box-shadow:var(--clay-btn-active);">
                                <div style="font-size:0.875rem; color:var(--text-muted); margin-bottom:0.25rem;">Low Stock Items</div>
                                <div style="font-size:1.5rem; font-weight:700; color:var(--danger);" id="inventory-alerts-display">0</div>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table" id="inventory-table">
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Item Name</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>Unit</th>
                                    <th>Cost Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Inventory Modal -->
            <div class="modal-overlay" id="inventory-modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 id="inventory-modal-title">Add Inventory Item</h3>
                        <button class="icon-btn" onclick="Inventory.closeModal()"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="inventory-form">
                            <input type="hidden" id="inv-id">
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>SKU / Barcode</label>
                                    <input type="text" id="inv-sku" class="form-control" placeholder="Optional identifier">
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Item Name *</label>
                                    <input type="text" id="inv-name" class="form-control" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Category *</label>
                                    <select id="inv-category" class="form-control" required>
                                        <option value="Raw Material">Raw Material</option>
                                        <option value="Ink">Ink / Toner</option>
                                        <option value="Paper">Paper</option>
                                        <option value="Vinyl">Vinyl / Flex</option>
                                        <option value="Packaging">Packaging</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Unit *</label>
                                    <select id="inv-unit" class="form-control" required>
                                        <option value="PCS">PCS</option>
                                        <option value="ROLL">ROLL</option>
                                        <option value="BOX">BOX</option>
                                        <option value="KG">KG</option>
                                        <option value="LITRE">LITRE</option>
                                        <option value="METER">METER</option>
                                        <option value="SQ.FT">SQ.FT</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Current Stock *</label>
                                    <input type="number" id="inv-stock" class="form-control" required min="0" step="0.01">
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Low Stock Alert (Min Stock) *</label>
                                    <input type="number" id="inv-min-stock" class="form-control" required min="0" step="0.01" value="5">
                                </div>
                            </div>
                            <div class="row" style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-md); margin:0 -0.75rem 1rem;">
                                <div class="col-md-4 form-group" style="margin-bottom:0">
                                    <label>Cost Price (₹)</label>
                                    <input type="number" id="inv-cost" class="form-control" required min="0" step="0.01" value="0">
                                </div>
                                <div class="col-md-4 form-group" style="margin-bottom:0">
                                    <label>Dealer Price (₹)</label>
                                    <input type="number" id="inv-dealer" class="form-control" min="0" step="0.01">
                                </div>
                                <div class="col-md-4 form-group" style="margin-bottom:0">
                                    <label>Retail Price (₹)</label>
                                    <input type="number" id="inv-retail" class="form-control" min="0" step="0.01">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Inventory.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Inventory.save()">Save Item</button>
                    </div>
                </div>
            </div>
            
            <!-- Adjust Stock Modal -->
            <div class="modal-overlay" id="adjust-modal">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>Adjust Stock</h3>
                        <button class="icon-btn" onclick="document.getElementById('adjust-modal').classList.remove('active')"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="adj-id">
                        <p id="adj-item-name" style="font-weight:600; margin-bottom:1rem;"></p>
                        <div class="form-group">
                            <label>Current Stock</label>
                            <input type="text" id="adj-current" class="form-control" readonly style="background:transparent;">
                        </div>
                        <div class="form-group">
                            <label>Adjustment Action</label>
                            <select id="adj-action" class="form-control">
                                <option value="ADD">Add Stock (+)</option>
                                <option value="SUBTRACT">Reduce Stock (-)</option>
                                <option value="SET">Set Exact Amount (=)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantity</label>
                            <input type="number" id="adj-qty" class="form-control" required min="0" step="0.01">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('adjust-modal').classList.remove('active')">Cancel</button>
                        <button class="btn btn-primary" onclick="Inventory.saveAdjustment()">Update Stock</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('inventory-view').innerHTML = html;
    },

    renderTable() {
        const search = document.getElementById('inventory-search').value.toLowerCase();
        const filter = document.getElementById('inventory-stock-filter').value;
        let items = Storage.get('inventory');
        
        if (search) {
            items = items.filter(i => 
                i.name.toLowerCase().includes(search) || 
                (i.sku && i.sku.toLowerCase().includes(search))
            );
        }
        
        let totalValue = 0;
        let alerts = 0;
        
        items.forEach(i => {
            const stock = parseFloat(i.stock) || 0;
            const cost = parseFloat(i.cost) || 0;
            const min = parseFloat(i.minStock) || 0;
            
            totalValue += (stock * cost);
            if (stock <= min) alerts++;
        });
        
        if (filter === 'LOW') {
            items = items.filter(i => (parseFloat(i.stock) || 0) <= (parseFloat(i.minStock) || 0) && (parseFloat(i.stock) || 0) > 0);
        } else if (filter === 'OUT') {
            items = items.filter(i => (parseFloat(i.stock) || 0) <= 0);
        }
        
        const tbody = document.querySelector('#inventory-table tbody');
        tbody.innerHTML = '';
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No inventory items found</td></tr>';
        } else {
            items.forEach(i => {
                const stock = parseFloat(i.stock) || 0;
                const min = parseFloat(i.minStock) || 0;
                
                let stockClass = '';
                if(stock <= 0) stockClass = 'color:var(--danger); font-weight:bold;';
                else if(stock <= min) stockClass = 'color:var(--warning); font-weight:bold;';
                else stockClass = 'color:var(--secondary); font-weight:600;';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i.sku || '-'}</td>
                    <td><strong>${i.name}</strong></td>
                    <td>${i.category}</td>
                    <td style="${stockClass}">${stock}</td>
                    <td>${i.unit}</td>
                    <td>${formatCurrency(i.cost)}</td>
                    <td>
                        <button class="icon-btn" title="Adjust Stock" onclick="Inventory.openAdjustModal('${i.id}')"><i class="ri-add-box-line"></i></button>
                        <button class="icon-btn" title="Edit Item" onclick="Inventory.edit('${i.id}')"><i class="ri-edit-line"></i></button>
                        <button class="icon-btn" title="Delete Item" style="color:var(--danger)" onclick="Inventory.delete('${i.id}')"><i class="ri-delete-bin-line"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        document.getElementById('inventory-value-display').textContent = formatCurrency(totalValue);
        document.getElementById('inventory-alerts-display').textContent = alerts;
        
        // Update dashboard widget if exists
        const dashAlert = document.querySelector('.stat-icon.danger + .stat-details .stat-value');
        if(dashAlert) dashAlert.textContent = alerts;
    },

    openModal(id = null) {
        document.getElementById('inventory-form').reset();
        document.getElementById('inv-id').value = '';
        document.getElementById('inventory-modal-title').textContent = 'Add Inventory Item';

        if(id) {
            const i = Storage.findById('inventory', id);
            if(i) {
                document.getElementById('inv-id').value = i.id;
                document.getElementById('inv-sku').value = i.sku || '';
                document.getElementById('inv-name').value = i.name;
                document.getElementById('inv-category').value = i.category;
                document.getElementById('inv-unit').value = i.unit;
                document.getElementById('inv-stock').value = i.stock;
                document.getElementById('inv-min-stock').value = i.minStock;
                document.getElementById('inv-cost').value = i.cost;
                document.getElementById('inv-dealer').value = i.dealerPrice || '';
                document.getElementById('inv-retail').value = i.retailPrice || '';
                
                document.getElementById('inventory-modal-title').textContent = 'Edit Inventory Item';
            }
        }

        document.getElementById('inventory-modal').classList.add('active');
    },
    
    closeModal() {
        document.getElementById('inventory-modal').classList.remove('active');
    },

    save() {
        const form = document.getElementById('inventory-form');
        if(!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const id = document.getElementById('inv-id').value;
        const data = {
            sku: document.getElementById('inv-sku').value,
            name: document.getElementById('inv-name').value,
            category: document.getElementById('inv-category').value,
            unit: document.getElementById('inv-unit').value,
            stock: parseFloat(document.getElementById('inv-stock').value) || 0,
            minStock: parseFloat(document.getElementById('inv-min-stock').value) || 0,
            cost: parseFloat(document.getElementById('inv-cost').value) || 0,
            dealerPrice: parseFloat(document.getElementById('inv-dealer').value) || 0,
            retailPrice: parseFloat(document.getElementById('inv-retail').value) || 0,
        };

        if(id) {
            Storage.update('inventory', id, data);
            showToast('Item updated successfully', 'success');
        } else {
            Storage.add('inventory', data);
            showToast('Item added successfully', 'success');
        }

        this.closeModal();
        this.renderTable();
    },

    openAdjustModal(id) {
        const i = Storage.findById('inventory', id);
        if(!i) return;
        
        document.getElementById('adj-id').value = i.id;
        document.getElementById('adj-item-name').textContent = `${i.name} (${i.sku || 'No SKU'})`;
        document.getElementById('adj-current').value = `${i.stock} ${i.unit}`;
        document.getElementById('adj-qty').value = '';
        
        document.getElementById('adjust-modal').classList.add('active');
    },
    
    saveAdjustment() {
        const id = document.getElementById('adj-id').value;
        const action = document.getElementById('adj-action').value;
        const qty = parseFloat(document.getElementById('adj-qty').value) || 0;
        
        if(qty <= 0 && action !== 'SET') {
            showToast('Enter a valid quantity', 'error');
            return;
        }
        
        const i = Storage.findById('inventory', id);
        if(!i) return;
        
        let newStock = parseFloat(i.stock) || 0;
        
        if(action === 'ADD') newStock += qty;
        if(action === 'SUBTRACT') newStock -= qty;
        if(action === 'SET') newStock = qty;
        
        if(newStock < 0) newStock = 0;
        
        Storage.update('inventory', id, { stock: newStock });
        showToast('Stock adjusted successfully', 'success');
        
        document.getElementById('adjust-modal').classList.remove('active');
        this.renderTable();
    },

    edit(id) {
        this.openModal(id);
    },

    delete(id) {
        if(confirm('Are you sure you want to delete this item?')) {
            Storage.remove('inventory', id);
            showToast('Item deleted', 'success');
            this.renderTable();
        }
    }
};
