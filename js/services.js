window.Services = {
    init() {
        this.renderTable();
        
        // Find Add button in Services View
        const btn = document.querySelector('#services-view .btn-primary');
        if(btn) btn.onclick = () => this.openModal();
    },

    renderTable() {
        const services = Storage.get('services');
        const tbody = document.querySelector('#services-table tbody');
        tbody.innerHTML = '';
        
        if(services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No services found</td></tr>';
            return;
        }

        services.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.code || ''}</td>
                <td><strong>${s.name}</strong></td>
                <td>${s.category}</td>
                <td>${formatCurrency(s.rate)}</td>
                <td>${s.unit}</td>
                <td>
                    <button class="icon-btn" onclick="Services.edit('${s.id}')"><i class="ri-edit-line"></i></button>
                    <button class="icon-btn" style="color:var(--danger)" onclick="Services.delete('${s.id}')"><i class="ri-delete-bin-line"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    openModal(id = null) {
        let modal = document.getElementById('service-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'service-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="service-modal-title">Add Service/Product</h3>
                        <button class="icon-btn" onclick="document.getElementById('service-modal').classList.remove('active')"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="service-form">
                            <input type="hidden" id="srv-id">
                            <div class="row">
                                <div class="col-md-4 form-group">
                                    <label>Code</label>
                                    <input type="text" id="srv-code" class="form-control">
                                </div>
                                <div class="col-md-8 form-group">
                                    <label>Name *</label>
                                    <input type="text" id="srv-name" class="form-control" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Category</label>
                                    <div style="display:flex; gap:0.5rem;">
                                        <select id="srv-category" class="form-control">
                                            <!-- Dynamically populated -->
                                        </select>
                                        <button type="button" class="btn btn-secondary" onclick="Services.addCategory()" style="padding: 0 0.5rem;" title="Add Category"><i class="ri-add-line"></i></button>
                                    </div>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Unit *</label>
                                    <div style="display:flex; gap:0.5rem;">
                                        <select id="srv-unit" class="form-control">
                                            <!-- Dynamically populated -->
                                        </select>
                                        <button type="button" class="btn btn-secondary" onclick="Services.addUnit()" style="padding: 0 0.5rem;" title="Add Unit"><i class="ri-add-line"></i></button>
                                    </div>
                                </div>
                            </div>
                            <div class="row" style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-md); margin:0 -0.75rem 1rem;">
                                <div class="col-md-4 form-group" style="margin-bottom:0">
                                    <label>Retail Rate</label>
                                    <input type="number" id="srv-rate" class="form-control" required>
                                </div>
                                <div class="col-md-4 form-group" style="margin-bottom:0">
                                    <label>Dealer Rate</label>
                                    <input type="number" id="srv-dealer-rate" class="form-control">
                                </div>
                                <div class="col-md-4 form-group" style="margin-bottom:0">
                                    <label>Wholesale Rate</label>
                                    <input type="number" id="srv-wholesale-rate" class="form-control">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('service-modal').classList.remove('active')">Cancel</button>
                        <button class="btn btn-primary" onclick="Services.save()">Save</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('service-form').reset();
        document.getElementById('srv-id').value = '';
        document.getElementById('service-modal-title').textContent = 'Add Service/Product';

        // Load categories and units
        this.loadCategories();
        this.loadUnits();

        if(id) {
            const s = Storage.findById('services', id);
            if(s) {
                document.getElementById('srv-id').value = s.id;
                document.getElementById('srv-code').value = s.code || '';
                document.getElementById('srv-name').value = s.name;
                document.getElementById('srv-category').value = s.category;
                document.getElementById('srv-unit').value = s.unit;
                document.getElementById('srv-rate').value = s.rate;
                document.getElementById('srv-dealer-rate').value = s.dealerRate || s.rate;
                document.getElementById('srv-wholesale-rate').value = s.wholesaleRate || s.rate;
                document.getElementById('service-modal-title').textContent = 'Edit Service';
            }
        }

        modal.classList.add('active');
    },

    save() {
        const id = document.getElementById('srv-id').value;
        const name = document.getElementById('srv-name').value;
        const rate = parseFloat(document.getElementById('srv-rate').value);
        
        if(!name || isNaN(rate)) {
            showToast('Name and Rate are required', 'error');
            return;
        }

        const data = {
            code: document.getElementById('srv-code').value,
            name,
            category: document.getElementById('srv-category').value,
            unit: document.getElementById('srv-unit').value,
            rate,
            dealerRate: parseFloat(document.getElementById('srv-dealer-rate').value) || rate,
            wholesaleRate: parseFloat(document.getElementById('srv-wholesale-rate').value) || rate
        };

        if(id) {
            Storage.update('services', id, data);
            showToast('Service updated successfully', 'success');
        } else {
            Storage.add('services', data);
            showToast('Service added successfully', 'success');
        }

        document.getElementById('service-modal').classList.remove('active');
        this.renderTable();
    },

    edit(id) {
        this.openModal(id);
    },

    delete(id) {
        if(confirm('Are you sure you want to delete this service?')) {
            Storage.remove('services', id);
            showToast('Service deleted', 'success');
            this.renderTable();
        }
    },

    loadCategories() {
        let categories = Storage.get('service_categories');
        if (!categories || categories.length === 0) {
            categories = [
                { id: 'cat1', name: 'Flex' },
                { id: 'cat2', name: 'Photo' },
                { id: 'cat3', name: 'Card' },
                { id: 'cat4', name: 'Xerox' },
                { id: 'cat5', name: 'Lamination' },
                { id: 'cat6', name: 'Other' }
            ];
            categories.forEach(c => Storage.add('service_categories', c));
        }
        
        const select = document.getElementById('srv-category');
        if (select) {
            select.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    },

    addCategory() {
        const name = prompt('Enter new category name:');
        if(name && name.trim()) {
            const catName = name.trim();
            const categories = Storage.get('service_categories') || [];
            
            // Check if already exists
            if (categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
                showToast('Category already exists', 'error');
                return;
            }
            
            Storage.add('service_categories', { name: catName });
            
            const select = document.getElementById('srv-category');
            if (select) {
                const option = document.createElement('option');
                option.value = catName;
                option.textContent = catName;
                select.appendChild(option);
                select.value = catName;
            }
            showToast('Category added', 'success');
        }
    },

    loadUnits() {
        let units = Storage.get('service_units');
        if (!units || units.length === 0) {
            units = [
                { name: 'Sq.Ft' },
                { name: 'Sq.Meter' },
                { name: 'PCS' },
                { name: 'BOX' },
                { name: 'Set' }
            ];
            units.forEach(u => Storage.add('service_units', u));
        }
        
        const select = document.getElementById('srv-unit');
        if (select) {
            select.innerHTML = units.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
        }
    },

    addUnit() {
        const name = prompt('Enter new unit name (e.g. Kg, Ltr, Packet):');
        if(name && name.trim()) {
            const unitName = name.trim();
            const units = Storage.get('service_units') || [];
            
            if (units.some(u => u.name.toLowerCase() === unitName.toLowerCase())) {
                showToast('Unit already exists', 'error');
                return;
            }
            
            Storage.add('service_units', { name: unitName });
            
            const select = document.getElementById('srv-unit');
            if (select) {
                const option = document.createElement('option');
                option.value = unitName;
                option.textContent = unitName;
                select.appendChild(option);
                select.value = unitName;
            }
            showToast('Unit added', 'success');
        }
    }
};
