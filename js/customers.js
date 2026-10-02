window.Customers = {
    init() {
        this.renderTable();
        document.getElementById('btn-add-customer').onclick = () => this.openCustomerModal();
    },

    renderTable() {
        const customers = Storage.get('customers');
        const tbody = document.querySelector('#customers-table tbody');
        tbody.innerHTML = '';
        
        if(customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No customers found</td></tr>';
            return;
        }

        customers.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id.substring(0, 8)}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.mobile}</td>
                <td><span class="status-badge" style="background:#E5E7EB; color:#374151">${c.type}</span></td>
                <td style="color:${c.balance > 0 ? 'var(--danger)' : 'inherit'}">${formatCurrency(c.balance || 0)}</td>
                <td>
                    <button class="icon-btn" style="color:var(--primary)" title="History" onclick="Customers.viewHistory('${c.id}')"><i class="ri-history-line"></i></button>
                    <button class="icon-btn" title="Edit" onclick="Customers.edit('${c.id}')"><i class="ri-edit-line"></i></button>
                    <button class="icon-btn" style="color:var(--danger)" title="Delete" onclick="Customers.delete('${c.id}')"><i class="ri-delete-bin-line"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    openCustomerModal(id = null) {
        // Create modal dynamically if not exists
        let modal = document.getElementById('customer-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'customer-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="customer-modal-title">Add Customer</h3>
                        <button class="icon-btn" onclick="document.getElementById('customer-modal').classList.remove('active')"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="customer-form">
                            <input type="hidden" id="cust-id">
                            <div class="form-group">
                                <label>Customer Name *</label>
                                <input type="text" id="cust-name" class="form-control" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>Mobile Number *</label>
                                    <input type="text" id="cust-mobile" class="form-control" required>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Customer Type</label>
                                    <select id="cust-type" class="form-control">
                                        <option value="Retail">Retail</option>
                                        <option value="Dealer">Dealer</option>
                                        <option value="Wholesale">Wholesale</option>
                                        <option value="Business">Business</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Address</label>
                                <input type="text" id="cust-address" class="form-control">
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label>GSTIN</label>
                                    <input type="text" id="cust-gstin" class="form-control">
                                </div>
                                <div class="col-md-6 form-group">
                                    <label>Opening Balance</label>
                                    <input type="number" id="cust-balance" class="form-control" value="0">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('customer-modal').classList.remove('active')">Cancel</button>
                        <button class="btn btn-primary" onclick="Customers.save()">Save</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('customer-form').reset();
        document.getElementById('cust-id').value = '';
        document.getElementById('customer-modal-title').textContent = 'Add Customer';

        if(id) {
            const c = Storage.findById('customers', id);
            if(c) {
                document.getElementById('cust-id').value = c.id;
                document.getElementById('cust-name').value = c.name;
                document.getElementById('cust-mobile').value = c.mobile;
                document.getElementById('cust-type').value = c.type;
                document.getElementById('cust-address').value = c.address || '';
                document.getElementById('cust-gstin').value = c.gstin || '';
                document.getElementById('cust-balance').value = c.balance || 0;
                document.getElementById('customer-modal-title').textContent = 'Edit Customer';
            }
        }

        modal.classList.add('active');
    },

    save() {
        const id = document.getElementById('cust-id').value;
        const name = document.getElementById('cust-name').value;
        const mobile = document.getElementById('cust-mobile').value;
        
        if(!name || !mobile) {
            showToast('Name and Mobile are required', 'error');
            return;
        }

        const data = {
            name,
            mobile,
            type: document.getElementById('cust-type').value,
            address: document.getElementById('cust-address').value,
            gstin: document.getElementById('cust-gstin').value,
            balance: parseFloat(document.getElementById('cust-balance').value) || 0
        };

        if(id) {
            Storage.update('customers', id, data);
            showToast('Customer updated successfully', 'success');
        } else {
            Storage.add('customers', data);
            showToast('Customer added successfully', 'success');
        }

        document.getElementById('customer-modal').classList.remove('active');
        this.renderTable();
    },

    edit(id) {
        this.openCustomerModal(id);
    },

    delete(id) {
        if(confirm('Are you sure you want to delete this customer?')) {
            Storage.remove('customers', id);
            showToast('Customer deleted', 'success');
            this.renderTable();
        }
    },

    viewHistory(id) {
        const c = Storage.findById('customers', id);
        if(!c) return;

        const invoices = Storage.get('invoices').filter(inv => inv.customerId === id);
        const payments = Storage.get('payments').filter(p => p.customerId === id);
        
        let totalBilled = 0;
        let totalPaid = 0;
        
        let historyItems = [];
        
        invoices.forEach(inv => {
            totalBilled += (inv.total || 0);
            totalPaid += (inv.paid || 0);
            historyItems.push({
                type: 'Invoice',
                date: inv.date,
                no: inv.no,
                id: inv.id,
                total: inv.total,
                paid: inv.paid,
                balance: inv.balance
            });
        });

        payments.forEach(p => {
            totalPaid += (p.amount || 0);
            historyItems.push({
                type: 'Payment',
                date: p.date,
                no: p.id,
                id: p.id,
                notes: p.notes,
                total: null,
                paid: p.amount,
                balance: null
            });
        });

        let historyHtml = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type / Ref</th>
                        <th>Billed Amount</th>
                        <th>Paid Amount</th>
                        <th>Inv. Balance</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (historyItems.length === 0) {
            historyHtml += '<tr><td colspan="6" style="text-align:center">No history found for this customer.</td></tr>';
        } else {
            // sort by date descending
            historyItems.sort((a,b) => new Date(b.date) - new Date(a.date));
            historyItems.forEach(item => {
                const totalDisplay = item.total !== null ? formatCurrency(item.total) : '-';
                const balanceDisplay = item.balance !== null ? formatCurrency(item.balance) : '-';
                const rowStyle = item.type === 'Payment' ? 'background: rgba(16, 185, 129, 0.05);' : '';
                
                let detailsHtml = `<strong>${item.type}</strong><br><small style="color:var(--text-muted)">${item.no}</small>`;
                if(item.notes) {
                    detailsHtml += `<br><small style="color:var(--text-muted)"><i>${item.notes}</i></small>`;
                }

                let actionHtml = '';
                if (item.type === 'Payment') {
                    actionHtml = `
                        <button class="icon-btn" style="color:var(--primary)" title="Edit Payment" onclick="Customers.editPayment('${id}', '${item.id}', ${item.paid})"><i class="ri-edit-line"></i></button>
                        <button class="icon-btn" style="color:var(--danger)" title="Delete Payment" onclick="Customers.deletePayment('${id}', '${item.id}', ${item.paid})"><i class="ri-delete-bin-line"></i></button>
                    `;
                } else if (item.type === 'Invoice') {
                    actionHtml = `
                        <button class="icon-btn" style="color:var(--primary)" title="Edit Invoice" onclick="Customers.editInvoice('${id}', '${item.id}')"><i class="ri-edit-line"></i></button>
                        <button class="icon-btn" style="color:var(--danger)" title="Delete Invoice" onclick="Customers.deleteInvoice('${id}', '${item.id}')"><i class="ri-delete-bin-line"></i></button>
                    `;
                }

                historyHtml += `
                    <tr style="${rowStyle}">
                        <td>${formatDate(item.date).split(' ')[0]}</td>
                        <td>${detailsHtml}</td>
                        <td>${totalDisplay}</td>
                        <td style="color:var(--success)">${formatCurrency(item.paid)}</td>
                        <td style="color:${(item.balance || 0) > 0 ? 'var(--danger)' : 'inherit'}">${balanceDisplay}</td>
                        <td>${actionHtml}</td>
                    </tr>
                `;
            });
        }
        
        historyHtml += `
                </tbody>
            </table>
        `;

        let modal = document.getElementById('customer-history-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'customer-history-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>History: ${c.name}</h3>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        ${c.balance > 0 ? `<button class="btn btn-sm btn-primary" onclick="Customers.receivePayment('${c.id}')">Receive Payment</button>` : ''}
                        <button class="icon-btn" onclick="document.getElementById('customer-history-modal').classList.remove('active')"><i class="ri-close-line"></i></button>
                    </div>
                </div>
                <div class="modal-body">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 1.5rem; background: var(--bg-main); padding: 1rem; border-radius: var(--radius-md);">
                        <div>
                            <div style="font-size:0.85rem; color:var(--text-muted);">Total Billed</div>
                            <div style="font-size:1.25rem; font-weight:bold;">${formatCurrency(totalBilled)}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--text-muted);">Total Paid</div>
                            <div style="font-size:1.25rem; font-weight:bold; color:var(--success);">${formatCurrency(totalPaid)}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--text-muted);">Current Balance Due</div>
                            <div style="font-size:1.25rem; font-weight:bold; color:var(--danger);">${formatCurrency(c.balance || 0)}</div>
                        </div>
                    </div>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${historyHtml}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    receivePayment(id) {
        const c = Storage.findById('customers', id);
        if(!c || c.balance <= 0) return;

        const amtStr = prompt(`Enter payment amount to receive (Current Balance: ${formatCurrency(c.balance)}):`, c.balance);
        if(amtStr === null) return;
        
        const amt = parseFloat(amtStr);
        if(isNaN(amt) || amt <= 0) {
            showToast('Invalid amount', 'error');
            return;
        }

        if(amt > c.balance) {
            showToast('Cannot receive more than the balance due', 'error');
            return;
        }

        c.balance -= amt;
        Storage.update('customers', id, { balance: c.balance });

        // Record payment
        Storage.add('payments', {
            id: 'PAY-' + Math.floor(10000 + Math.random() * 90000),
            customerId: id,
            date: new Date().toISOString(),
            amount: amt
        });

        showToast('Payment received successfully', 'success');
        document.getElementById('customer-history-modal').classList.remove('active');
        this.renderTable();
        
        // Re-open history to show updated balance
        this.viewHistory(id);
    },

    deletePayment(customerId, paymentId, amount) {
        if(confirm('Are you sure you want to delete this payment? The amount will be added back to the customer balance.')) {
            const c = Storage.findById('customers', customerId);
            if(c) {
                c.balance = (parseFloat(c.balance) || 0) + (parseFloat(amount) || 0);
                Storage.update('customers', customerId, { balance: c.balance });
            }
            Storage.remove('payments', paymentId);
            showToast('Payment adjustment reversed', 'success');
            
            document.getElementById('customer-history-modal').classList.remove('active');
            this.renderTable();
            this.viewHistory(customerId);
        }
    },

    editPayment(customerId, paymentId, oldAmount) {
        const amtStr = prompt('Enter the new corrected payment amount:', oldAmount);
        if(amtStr === null) return;
        const newAmt = parseFloat(amtStr);
        if(isNaN(newAmt) || newAmt <= 0) {
            showToast('Invalid amount', 'error');
            return;
        }

        const c = Storage.findById('customers', customerId);
        if(c) {
            const tempBalance = (parseFloat(c.balance) || 0) + oldAmount; // Revert old payment logically
            if (newAmt > tempBalance) {
                showToast('Cannot receive more than the balance due', 'error');
                return;
            }
            c.balance = tempBalance - newAmt; // Apply new payment
            Storage.update('customers', customerId, { balance: c.balance });
        }
        
        Storage.update('payments', paymentId, { amount: newAmt });
        showToast('Payment updated successfully', 'success');
        
        document.getElementById('customer-history-modal').classList.remove('active');
        this.renderTable();
        this.viewHistory(customerId);
    },

    editInvoice(customerId, invoiceId) {
        const inv = Storage.findById('invoices', invoiceId);
        if (!inv) return;
        
        const newTotalStr = prompt('Enter the corrected TOTAL amount for this invoice:', inv.total);
        if(newTotalStr === null) return;
        
        const newPaidStr = prompt('Enter the corrected PAID amount for this invoice:', inv.paid);
        if(newPaidStr === null) return;
        
        const newTotal = parseFloat(newTotalStr) || 0;
        const newPaid = parseFloat(newPaidStr) || 0;
        
        const oldBalance = inv.balance || 0;
        const newBalance = newTotal - newPaid;
        const diff = newBalance - oldBalance;
        
        const c = Storage.findById('customers', customerId);
        if(c) {
            c.balance = (parseFloat(c.balance) || 0) + diff;
            if(c.balance < 0) c.balance = 0;
            Storage.update('customers', customerId, { balance: c.balance });
        }
        
        Storage.update('invoices', invoiceId, { total: newTotal, paid: newPaid, balance: newBalance });
        showToast('Invoice updated successfully', 'success');
        
        document.getElementById('customer-history-modal').classList.remove('active');
        this.renderTable();
        this.viewHistory(customerId);
    },

    deleteInvoice(customerId, invoiceId) {
        if(confirm('Are you sure you want to delete this invoice? The remaining balance will be deducted from the customer.')) {
            const invoice = Storage.findById('invoices', invoiceId);
            if(invoice) {
                const c = Storage.findById('customers', customerId);
                if(c) {
                    c.balance = (parseFloat(c.balance) || 0) - (parseFloat(invoice.balance) || 0);
                    if(c.balance < 0) c.balance = 0;
                    Storage.update('customers', customerId, { balance: c.balance });
                }
                Storage.remove('invoices', invoiceId);
                showToast('Invoice deleted', 'success');
                
                document.getElementById('customer-history-modal').classList.remove('active');
                this.renderTable();
                this.viewHistory(customerId);
            }
        }
    }
};
