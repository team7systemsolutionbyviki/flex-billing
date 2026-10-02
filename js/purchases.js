window.Purchases = {
    init() {
        this.renderView();
        this.renderTable();
    },

    renderView() {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3>Purchase Management</h3>
                    <button class="btn btn-primary" onclick="Purchases.openModal()"><i class="ri-add-line"></i> Add Purchase</button>
                </div>
                <div class="card-body">
                    <div style="display:flex; gap:1rem; margin-bottom:1.5rem;">
                        <input type="text" class="form-control" id="purchase-search" placeholder="Search Supplier or Invoice..." onkeyup="Purchases.renderTable()">
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table" id="purchases-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Invoice No</th>
                                    <th>Supplier</th>
                                    <th>Product</th>
                                    <th>Total</th>
                                    <th>Balance</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Purchase Modal -->
            <div class="modal-overlay" id="purchase-modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 id="purchase-modal-title">Record Purchase</h3>
                        <button class="icon-btn" onclick="Purchases.closeModal()"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="purchase-form">
                            <input type="hidden" id="pur-id">
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Date *</label>
                                    <input type="date" id="pur-date" class="form-control" required>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Purchase Invoice No *</label>
                                    <input type="text" id="pur-invoice" class="form-control" placeholder="e.g. INV-2023-01" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Supplier Name *</label>
                                    <input type="text" id="pur-supplier" class="form-control" required>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Product / Material *</label>
                                    <input type="text" id="pur-product" class="form-control" placeholder="e.g. Flex Roll 4ft, Ink" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 form-group">
                                    <label>Quantity *</label>
                                    <input type="number" id="pur-qty" class="form-control" required min="1" step="0.1" value="1" oninput="Purchases.calculateTotal()">
                                </div>
                                <div class="col-md-4 form-group">
                                    <label>Rate (₹) *</label>
                                    <input type="number" id="pur-rate" class="form-control" required min="0" step="0.01" oninput="Purchases.calculateTotal()">
                                </div>
                                <div class="col-md-4 form-group">
                                    <label>GST (%)</label>
                                    <input type="number" id="pur-gst" class="form-control" value="0" min="0" step="0.1" oninput="Purchases.calculateTotal()">
                                </div>
                            </div>
                            
                            <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-md); box-shadow:var(--clay-btn-active); margin-bottom:1rem;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                                    <span>Subtotal:</span>
                                    <strong id="pur-subtotal-display">₹ 0.00</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; color:var(--text-muted)">
                                    <span>GST Amount:</span>
                                    <strong id="pur-gst-display">₹ 0.00</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; font-size:1.25rem; font-weight:700; color:var(--primary);">
                                    <span>Total Amount:</span>
                                    <strong id="pur-total-display">₹ 0.00</strong>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Amount Paid (₹)</label>
                                    <input type="number" id="pur-paid" class="form-control" value="0" min="0" step="0.01" oninput="Purchases.calculateBalance()">
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Balance Due (₹)</label>
                                    <input type="number" id="pur-balance" class="form-control" readonly style="background:transparent; color:var(--danger); font-weight:bold;">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Purchases.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Purchases.save()">Save Purchase</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('purchases-view').innerHTML = html;
    },

    calculateTotal() {
        const qty = parseFloat(document.getElementById('pur-qty').value) || 0;
        const rate = parseFloat(document.getElementById('pur-rate').value) || 0;
        const gstPercent = parseFloat(document.getElementById('pur-gst').value) || 0;
        
        const subtotal = qty * rate;
        const gstAmount = subtotal * (gstPercent / 100);
        const total = subtotal + gstAmount;
        
        document.getElementById('pur-subtotal-display').textContent = formatCurrency(subtotal);
        document.getElementById('pur-gst-display').textContent = formatCurrency(gstAmount);
        document.getElementById('pur-total-display').textContent = formatCurrency(total);
        
        // Store raw total for balance calculation
        document.getElementById('pur-total-display').dataset.val = total;
        
        this.calculateBalance();
    },
    
    calculateBalance() {
        const totalRaw = document.getElementById('pur-total-display').dataset.val;
        if(totalRaw === undefined) return;
        
        const total = parseFloat(totalRaw) || 0;
        const paid = parseFloat(document.getElementById('pur-paid').value) || 0;
        const balance = total - paid;
        
        document.getElementById('pur-balance').value = balance.toFixed(2);
    },

    renderTable() {
        const search = document.getElementById('purchase-search').value.toLowerCase();
        let purchases = Storage.get('purchases');
        
        if (search) {
            purchases = purchases.filter(p => 
                p.supplier.toLowerCase().includes(search) || 
                p.invoiceNo.toLowerCase().includes(search) ||
                p.product.toLowerCase().includes(search)
            );
        }
        
        // Sort newest first
        purchases.sort((a,b) => new Date(b.date) - new Date(a.date));
        
        const tbody = document.querySelector('#purchases-table tbody');
        tbody.innerHTML = '';
        
        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No purchases found</td></tr>';
        } else {
            purchases.forEach(p => {
                const isUnpaid = parseFloat(p.balance) > 0;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatDate(p.date).split(' ')[0]}</td>
                    <td><strong>${p.invoiceNo}</strong></td>
                    <td>${p.supplier}</td>
                    <td>${p.product} <small class="text-muted">(${p.qty})</small></td>
                    <td style="font-weight:600;">${formatCurrency(p.total)}</td>
                    <td style="color:${isUnpaid ? 'var(--danger)' : 'var(--secondary)'}; font-weight:600;">
                        ${formatCurrency(p.balance)}
                    </td>
                    <td>
                        <button class="icon-btn" onclick="Purchases.edit('${p.id}')"><i class="ri-edit-line"></i></button>
                        <button class="icon-btn" style="color:var(--danger)" onclick="Purchases.delete('${p.id}')"><i class="ri-delete-bin-line"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    },

    openModal(id = null) {
        document.getElementById('purchase-form').reset();
        document.getElementById('pur-id').value = '';
        document.getElementById('purchase-modal-title').textContent = 'Record Purchase';
        
        // Default to today
        document.getElementById('pur-date').value = new Date().toISOString().split('T')[0];
        
        this.calculateTotal(); // Reset displays

        if(id) {
            const p = Storage.findById('purchases', id);
            if(p) {
                document.getElementById('pur-id').value = p.id;
                document.getElementById('pur-date').value = p.date;
                document.getElementById('pur-invoice').value = p.invoiceNo;
                document.getElementById('pur-supplier').value = p.supplier;
                document.getElementById('pur-product').value = p.product;
                document.getElementById('pur-qty').value = p.qty;
                document.getElementById('pur-rate').value = p.rate;
                document.getElementById('pur-gst').value = p.gstPercent || 0;
                document.getElementById('pur-paid').value = p.paid;
                
                this.calculateTotal();
                document.getElementById('purchase-modal-title').textContent = 'Edit Purchase';
            }
        }

        document.getElementById('purchase-modal').classList.add('active');
    },
    
    closeModal() {
        document.getElementById('purchase-modal').classList.remove('active');
    },

    save() {
        const form = document.getElementById('purchase-form');
        if(!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const id = document.getElementById('pur-id').value;
        const total = parseFloat(document.getElementById('pur-total-display').dataset.val) || 0;
        const paid = parseFloat(document.getElementById('pur-paid').value) || 0;
        
        const data = {
            date: document.getElementById('pur-date').value,
            invoiceNo: document.getElementById('pur-invoice').value,
            supplier: document.getElementById('pur-supplier').value,
            product: document.getElementById('pur-product').value,
            qty: parseFloat(document.getElementById('pur-qty').value),
            rate: parseFloat(document.getElementById('pur-rate').value),
            gstPercent: parseFloat(document.getElementById('pur-gst').value) || 0,
            total: total,
            paid: paid,
            balance: total - paid
        };

        if(id) {
            Storage.update('purchases', id, data);
            showToast('Purchase updated successfully', 'success');
        } else {
            Storage.add('purchases', data);
            showToast('Purchase recorded successfully', 'success');
        }

        this.closeModal();
        this.renderTable();
    },

    edit(id) {
        this.openModal(id);
    },

    delete(id) {
        if(confirm('Are you sure you want to delete this purchase record?')) {
            Storage.remove('purchases', id);
            showToast('Purchase deleted', 'success');
            this.renderTable();
        }
    }
};
