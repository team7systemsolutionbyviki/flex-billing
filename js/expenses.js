window.Expenses = {
    init() {
        this.renderView();
        this.loadCategories();
        this.renderTable();
    },

    renderView() {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3>Expense Management</h3>
                    <button class="btn btn-primary" onclick="Expenses.openModal()"><i class="ri-add-line"></i> Record Expense</button>
                </div>
                <div class="card-body">
                    <div style="display:flex; gap:1rem; margin-bottom:1.5rem;">
                        <input type="month" class="form-control" id="expense-month-filter" style="width:200px" onchange="Expenses.renderTable()">
                        <select class="form-control" id="expense-category-filter" style="width:200px" onchange="Expenses.renderTable()">
                            <option value="ALL">All Categories</option>
                        </select>
                    </div>
                    
                    <div class="row" style="margin-bottom:1.5rem;">
                        <div class="col-md-4">
                            <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-md); box-shadow:var(--clay-btn-active);">
                                <div style="font-size:0.875rem; color:var(--text-muted); margin-bottom:0.25rem;">Total Expenses (Filtered)</div>
                                <div style="font-size:1.5rem; font-weight:700; color:var(--danger);" id="expense-total-display">₹ 0.00</div>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table" id="expenses-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Payment Method</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Expense Modal -->
            <div class="modal-overlay" id="expense-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="expense-modal-title">Record Expense</h3>
                        <button class="icon-btn" onclick="Expenses.closeModal()"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="expense-form">
                            <input type="hidden" id="exp-id">
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Date *</label>
                                    <input type="date" id="exp-date" class="form-control" required>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Category *</label>
                                    <div style="display:flex; gap:0.5rem;">
                                        <select id="exp-category" class="form-control" required></select>
                                        <button type="button" class="btn btn-secondary" onclick="Expenses.addCategory()" style="padding: 0 0.5rem;" title="Add Category"><i class="ri-add-line"></i></button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Description *</label>
                                <input type="text" id="exp-description" class="form-control" placeholder="e.g. Paid electricity bill for Aug" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Amount (₹) *</label>
                                    <input type="number" id="exp-amount" class="form-control" required min="0" step="0.01">
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Payment Method</label>
                                    <select id="exp-method" class="form-control">
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Card</option>
                                        <option value="BANK">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <input type="text" id="exp-notes" class="form-control" placeholder="Optional notes">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Expenses.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Expenses.save()">Save Expense</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('expenses-view').innerHTML = html;
        
        // Set default month filter to current month
        const now = new Date();
        document.getElementById('expense-month-filter').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    renderTable() {
        let expenses = Storage.get('expenses');
        const monthFilter = document.getElementById('expense-month-filter').value;
        const catFilter = document.getElementById('expense-category-filter').value;
        const tbody = document.querySelector('#expenses-table tbody');
        
        tbody.innerHTML = '';
        
        if (monthFilter) {
            expenses = expenses.filter(e => e.date.startsWith(monthFilter));
        }
        
        if (catFilter !== 'ALL') {
            expenses = expenses.filter(e => e.category === catFilter);
        }
        
        // Sort newest first
        expenses.sort((a,b) => new Date(b.date) - new Date(a.date));
        
        let total = 0;
        
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No expenses recorded for this period</td></tr>';
        } else {
            expenses.forEach(e => {
                total += parseFloat(e.amount);
                
                let badgeClass = 'status-badge';
                if(e.method === 'UPI') badgeClass += ' status-printing';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${e.date}</td>
                    <td><span style="font-weight:600; color:var(--text-main);">${e.category}</span></td>
                    <td>${e.description}</td>
                    <td><span class="${badgeClass}" style="background:var(--bg-main); color:var(--text-muted);">${e.method}</span></td>
                    <td style="color:var(--danger); font-weight:600;">${formatCurrency(e.amount)}</td>
                    <td>
                        <button class="icon-btn" onclick="Expenses.edit('${e.id}')"><i class="ri-edit-line"></i></button>
                        <button class="icon-btn" style="color:var(--danger)" onclick="Expenses.delete('${e.id}')"><i class="ri-delete-bin-line"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        document.getElementById('expense-total-display').textContent = formatCurrency(total);
    },

    openModal(id = null) {
        document.getElementById('expense-form').reset();
        document.getElementById('exp-id').value = '';
        document.getElementById('expense-modal-title').textContent = 'Record Expense';
        
        // Default to today
        document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];

        if(id) {
            const e = Storage.findById('expenses', id);
            if(e) {
                document.getElementById('exp-id').value = e.id;
                document.getElementById('exp-date').value = e.date;
                document.getElementById('exp-category').value = e.category;
                document.getElementById('exp-description').value = e.description;
                document.getElementById('exp-amount').value = e.amount;
                document.getElementById('exp-method').value = e.method;
                document.getElementById('exp-notes').value = e.notes || '';
                document.getElementById('expense-modal-title').textContent = 'Edit Expense';
            }
        }

        document.getElementById('expense-modal').classList.add('active');
    },
    
    closeModal() {
        document.getElementById('expense-modal').classList.remove('active');
    },

    save() {
        const form = document.getElementById('expense-form');
        if(!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const id = document.getElementById('exp-id').value;
        const data = {
            date: document.getElementById('exp-date').value,
            category: document.getElementById('exp-category').value,
            description: document.getElementById('exp-description').value,
            amount: parseFloat(document.getElementById('exp-amount').value),
            method: document.getElementById('exp-method').value,
            notes: document.getElementById('exp-notes').value
        };

        if(id) {
            Storage.update('expenses', id, data);
            showToast('Expense updated successfully', 'success');
        } else {
            Storage.add('expenses', data);
            showToast('Expense recorded successfully', 'success');
        }

        this.closeModal();
        this.renderTable();
    },

    edit(id) {
        this.openModal(id);
    },

    delete(id) {
        if(confirm('Are you sure you want to delete this expense record?')) {
            Storage.remove('expenses', id);
            showToast('Expense deleted', 'success');
            this.renderTable();
        }
    },

    loadCategories() {
        let categories = Storage.get('expense_categories');
        if (!categories || categories.length === 0) {
            categories = [
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
            ];
            categories.forEach(c => Storage.add('expense_categories', c));
        }
        
        const filterSelect = document.getElementById('expense-category-filter');
        const modalSelect = document.getElementById('exp-category');
        
        const optionsHtml = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        
        if (filterSelect) {
            // Preserve current value if possible
            const currentVal = filterSelect.value;
            filterSelect.innerHTML = `<option value="ALL">All Categories</option>` + optionsHtml;
            if (currentVal) filterSelect.value = currentVal;
        }
        
        if (modalSelect) {
            const currentVal = modalSelect.value;
            modalSelect.innerHTML = optionsHtml;
            if (currentVal) modalSelect.value = currentVal;
        }
    },

    addCategory() {
        const name = prompt('Enter new expense category name:');
        if (name && name.trim()) {
            const catName = name.trim();
            const categories = Storage.get('expense_categories') || [];
            
            if (categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
                showToast('Category already exists', 'error');
                return;
            }
            
            Storage.add('expense_categories', { name: catName });
            
            this.loadCategories();
            
            const modalSelect = document.getElementById('exp-category');
            if (modalSelect) {
                modalSelect.value = catName;
            }
            
            showToast('Category added', 'success');
        }
    }
};
