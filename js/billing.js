window.Billing = {
    cart: [],
    selectedCustomer: null,
    customers: [],
    services: [],

    init() {
        this.services = Storage.get('services');
        this.customers = Storage.get('customers');
        this.renderView();
        
        if (this.selectedCustomer) {
            document.getElementById('selected-customer-display').innerHTML = `
                <span>${this.selectedCustomer.name} <small>(${this.selectedCustomer.type || ''})</small></span>
                <button class="icon-btn" onclick="Billing.clearCustomer()" style="font-size:1rem; padding:0;"><i class="ri-close-circle-line"></i></button>
            `;
        }

        this.renderServices();
        this.updateCart();
    },

    renderView() {
        const shop = Storage.get('shop');
        const gstPercent = shop.gstPercent !== undefined ? shop.gstPercent : 18;
        const html = `
            <div class="pos-container">
                <div class="pos-left">
                    <div class="pos-search-bar">
                        <div class="search-input-wrapper" style="flex:2">
                            <i class="ri-user-search-line"></i>
                            <input type="text" id="pos-customer-search" placeholder="Search Customer (Name/Mobile) [F3]" autocomplete="off">
                            <div id="customer-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; background:var(--bg-card); border:1px solid var(--border-color); z-index:10; max-height:200px; overflow-y:auto; border-radius:var(--radius-md); box-shadow:var(--shadow-md);"></div>
                        </div>
                        <div class="search-input-wrapper" style="flex:1">
                            <div id="selected-customer-display" style="padding:0.75rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-main); font-weight:600; display:flex; justify-content:space-between; align-items:center;">
                                <span>Walk-in Customer</span>
                                <button class="icon-btn" onclick="Billing.clearCustomer()" style="font-size:1rem; padding:0;"><i class="ri-close-circle-line"></i></button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pos-search-bar" style="padding-bottom:0; border:none; background:transparent; display:flex; gap:1rem;">
                        <div class="search-input-wrapper" style="flex:2">
                            <i class="ri-search-line"></i>
                            <input type="text" id="pos-service-search" placeholder="Search Services/Products... [F4]" onkeyup="Billing.filterServices(this.value)">
                        </div>
                        <div class="search-input-wrapper" style="flex:1">
                            <select id="pos-price-level" class="form-control" onchange="Billing.filterServices(document.getElementById('pos-service-search').value)" style="border:none; padding-left:1rem; cursor:pointer;">
                                <option value="Retail">Retail Prices</option>
                                <option value="Dealer">Dealer Prices</option>
                                <option value="Wholesale">Wholesale Prices</option>
                            </select>
                        </div>
                    </div>

                    <div class="services-grid" id="pos-services-grid">
                        <!-- Loaded dynamically -->
                    </div>
                </div>

                <div class="pos-right">
                    <div class="cart-header">
                        <h3 style="font-size:1rem; font-weight:600;">Current Invoice</h3>
                        <button class="icon-btn" onclick="Billing.clearCart()"><i class="ri-delete-bin-line"></i></button>
                    </div>
                    <div class="cart-items" id="cart-items-container">
                        <!-- Cart Items -->
                    </div>
                    <div class="cart-totals">
                        <div class="total-line">
                            <span>Subtotal</span>
                            <span id="cart-subtotal">₹ 0.00</span>
                        </div>
                        <div class="total-line">
                            <span>Discount <input type="number" id="cart-discount" value="0" style="width:60px; text-align:right; border:1px solid var(--border-color); background:var(--bg-main); color:var(--text-main); border-radius:4px;" onchange="Billing.updateTotals()"></span>
                            <span id="cart-discount-val">- ₹ 0.00</span>
                        </div>
                        <div class="total-line">
                            <span>GST (${gstPercent}%) <input type="checkbox" id="cart-gst-enable" checked onchange="Billing.updateTotals()"></span>
                            <span id="cart-gst-val">₹ 0.00</span>
                        </div>
                        <div class="total-line grand">
                            <span>Total</span>
                            <span id="cart-total">₹ 0.00</span>
                        </div>
                    </div>
                    <div class="cart-actions">
                        <button class="btn btn-secondary" style="flex:0.7" onclick="Billing.generateQuotation()"><i class="ri-file-list-3-line"></i> Quote</button>
                        <button class="btn btn-secondary" style="flex:0.7" onclick="Billing.saveAsJob()"><i class="ri-task-line"></i> Job</button>
                        <button class="btn btn-primary" style="flex:1" onclick="Billing.processPayment()"><i class="ri-bank-card-line"></i> Pay</button>
                    </div>
                </div>
            </div>

            <!-- Item Calculator Modal -->
            <div class="modal-overlay" id="calc-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="calc-modal-title">Item Calculator</h3>
                        <button class="icon-btn" onclick="Billing.closeCalcModal()"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body" id="calc-modal-body">
                        <!-- Dynamic fields based on item type -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Billing.closeCalcModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Billing.addCalculatedItem()">Add to Cart</button>
                    </div>
                </div>
            </div>
            
            <!-- Payment Modal -->
            <div class="modal-overlay" id="payment-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Process Payment</h3>
                        <button class="icon-btn" onclick="Billing.closePaymentModal()"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body">
                        <h2 style="text-align:center; font-size:2rem; margin-bottom:1rem; color:var(--primary);" id="payment-total-display">₹ 0.00</h2>
                        <div class="form-group">
                            <label>Payment Method</label>
                            <select class="form-control" id="payment-method">
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                                <option value="CREDIT">Credit / Unpaid</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount Received</label>
                            <input type="number" class="form-control" id="payment-received" oninput="Billing.calcChange()">
                        </div>
                        <div class="form-group">
                            <label>Balance / Change</label>
                            <input type="text" class="form-control" id="payment-change" readonly>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Billing.completeInvoice(false)">Complete & Print</button>
                        <button class="btn btn-primary" onclick="Billing.completeInvoice(true)" style="background:#25D366; border-color:#25D366;"><i class="ri-whatsapp-line"></i> WhatsApp & PDF</button>
                    </div>
                </div>
            </div>

            <!-- Job Modal -->
            <div class="modal-overlay" id="job-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create Job Order</h3>
                        <button class="icon-btn" onclick="document.getElementById('job-modal').classList.remove('active')"><i class="ri-close-line"></i></button>
                    </div>
                    <div class="modal-body">
                        <h2 style="text-align:center; font-size:1.5rem; margin-bottom:1rem; color:var(--primary);" id="job-total-display">₹ 0.00</h2>
                        <div class="form-group">
                            <label>Delivery Due Date & Time</label>
                            <input type="datetime-local" class="form-control" id="job-due-date">
                        </div>
                        <div class="form-group">
                            <label>Advance Payment Received</label>
                            <input type="number" class="form-control" id="job-advance-amt" value="0">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('job-modal').classList.remove('active')">Cancel</button>
                        <button class="btn btn-primary" onclick="Billing.confirmSaveJob()">Save Job</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('billing-view').innerHTML = html;

        // Customer Search Logic
        const searchInput = document.getElementById('pos-customer-search');
        const dropdown = document.getElementById('customer-dropdown');
        let currentFocus = -1;
        
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            dropdown.innerHTML = '';
            currentFocus = -1;
            if(val.length < 2) {
                dropdown.style.display = 'none';
                return;
            }
            
            const filtered = this.customers.filter(c => c.name.toLowerCase().includes(val) || c.mobile.includes(val));
            if(filtered.length > 0) {
                filtered.forEach(c => {
                    const div = document.createElement('div');
                    div.className = 'dropdown-item';
                    div.style.padding = '0.5rem 1rem';
                    div.style.cursor = 'pointer';
                    div.style.borderBottom = '1px solid var(--border-color)';
                    div.innerHTML = `<strong>${c.name}</strong> - ${c.mobile} (${c.type})`;
                    div.onclick = () => {
                        this.selectedCustomer = c;
                        document.getElementById('selected-customer-display').innerHTML = `
                            <span>${c.name} <small>(${c.type})</small></span>
                            <button class="icon-btn" onclick="Billing.clearCustomer()" style="font-size:1rem; padding:0;"><i class="ri-close-circle-line"></i></button>
                        `;
                        searchInput.value = '';
                        dropdown.style.display = 'none';
                        
                        // Auto-switch price level based on customer
                        const priceLvl = document.getElementById('pos-price-level');
                        if (priceLvl) {
                            if (c.type === 'Dealer') priceLvl.value = 'Dealer';
                            else if (c.type === 'Wholesale') priceLvl.value = 'Wholesale';
                            else priceLvl.value = 'Retail';
                        }
                        this.filterServices(document.getElementById('pos-service-search') ? document.getElementById('pos-service-search').value : '');
                    };
                    dropdown.appendChild(div);
                });
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }


        });
        searchInput.addEventListener('keydown', (e) => {
            const items = dropdown.getElementsByClassName('dropdown-item');
            if (e.key === 'ArrowDown') {
                currentFocus++;
                addActive(items);
            } else if (e.key === 'ArrowUp') {
                currentFocus--;
                addActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1) {
                    if (items[currentFocus]) items[currentFocus].click();
                } else if (items.length > 0) {
                    items[0].click();
                }
            }
        });
        
        function addActive(items) {
            if (!items || items.length === 0) return false;
            removeActive(items);
            if (currentFocus >= items.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (items.length - 1);
            items[currentFocus].style.backgroundColor = 'var(--bg-card-hover)'; // Highlight
            items[currentFocus].scrollIntoView({block: 'nearest'});
        }
        function removeActive(items) {
            for (let i = 0; i < items.length; i++) {
                items[i].style.backgroundColor = '';
            }
        }
    },

    clearCustomer() {
        this.selectedCustomer = null;
        document.getElementById('selected-customer-display').innerHTML = `
            <span>Walk-in Customer</span>
            <button class="icon-btn" onclick="Billing.clearCustomer()" style="font-size:1rem; padding:0;"><i class="ri-close-circle-line"></i></button>
        `;
        const priceLvl = document.getElementById('pos-price-level');
        if (priceLvl) priceLvl.value = 'Retail';
        this.filterServices(document.getElementById('pos-service-search') ? document.getElementById('pos-service-search').value : '');
    },

    renderServices(filter = '') {
        const grid = document.getElementById('pos-services-grid');
        grid.innerHTML = '';
        
        const filtered = this.services.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) || s.code.toLowerCase().includes(filter.toLowerCase()));
        
        const priceLevel = document.getElementById('pos-price-level') ? document.getElementById('pos-price-level').value : 'Retail';
        
        filtered.forEach(s => {
            let price = s.rate;
            if (priceLevel === 'Dealer' && s.dealerRate) price = s.dealerRate;
            if (priceLevel === 'Wholesale' && s.wholesaleRate) price = s.wholesaleRate;

            const div = document.createElement('div');
            div.className = 'service-card';
            div.innerHTML = `
                <div class="service-name">${s.name}</div>
                <div class="service-price">₹${price} / ${s.unit}</div>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.25rem">${s.category}</div>
            `;
            div.onclick = () => this.openCalcModal(s, price);
            grid.appendChild(div);
        });
    },

    filterServices(val) {
        this.renderServices(val);
    },

    openCalcModal(service, basePrice) {
        this.currentCalcService = { ...service, currentRate: basePrice };
        const modal = document.getElementById('calc-modal');
        document.getElementById('calc-modal-title').textContent = service.name;
        
        const body = document.getElementById('calc-modal-body');
        
        if (service.unit === 'Sq.Ft' || service.unit === 'Sq.Meter') {
            body.innerHTML = `
                <div class="row">
                    <div class="col-md-6 form-group">
                        <label>Width (Ft)</label>
                        <input type="number" class="form-control" id="calc-w" value="1" step="0.1" oninput="Billing.recalcModal()">
                    </div>
                    <div class="col-md-6 form-group">
                        <label>Height (Ft)</label>
                        <input type="number" class="form-control" id="calc-h" value="1" step="0.1" oninput="Billing.recalcModal()">
                    </div>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" class="form-control" id="calc-qty" value="1" oninput="Billing.recalcModal()">
                </div>
                <div class="form-group">
                    <label>Rate (/ ${service.unit})</label>
                    <input type="number" class="form-control" id="calc-rate" value="${basePrice}" oninput="Billing.recalcModal()">
                </div>
                <div class="form-group">
                    <label>Design Notes</label>
                    <input type="text" class="form-control" id="calc-notes" placeholder="Optional notes">
                </div>
                <div style="margin-top:1rem; padding:1rem; background:var(--bg-main); border-radius:var(--radius-md);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                        <span>Total Area:</span> <strong id="calc-area-display">1.00 Sq.Ft</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:1.25rem; font-weight:bold; color:var(--primary);">
                        <span>Total Amount:</span> <span id="calc-total-display">₹ ${basePrice.toFixed(2)}</span>
                    </div>
                </div>
            `;
        } else {
            // Standard Item
            body.innerHTML = `
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" class="form-control" id="calc-qty" value="1" oninput="Billing.recalcModal()">
                </div>
                <div class="form-group">
                    <label>Rate (/ ${service.unit})</label>
                    <input type="number" class="form-control" id="calc-rate" value="${basePrice}" oninput="Billing.recalcModal()">
                </div>
                <div class="form-group">
                    <label>Design Notes</label>
                    <input type="text" class="form-control" id="calc-notes" placeholder="Optional notes">
                </div>
                <div style="margin-top:1rem; padding:1rem; background:var(--bg-main); border-radius:var(--radius-md);">
                    <div style="display:flex; justify-content:space-between; font-size:1.25rem; font-weight:bold; color:var(--primary);">
                        <span>Total Amount:</span> <span id="calc-total-display">₹ ${basePrice.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }
        
        modal.classList.add('active');
    },

    recalcModal() {
        const s = this.currentCalcService;
        const qty = parseFloat(document.getElementById('calc-qty').value) || 1;
        const rate = parseFloat(document.getElementById('calc-rate').value) || 0;
        let total = 0;
        
        if (s.unit === 'Sq.Ft' || s.unit === 'Sq.Meter') {
            const w = parseFloat(document.getElementById('calc-w').value) || 0;
            const h = parseFloat(document.getElementById('calc-h').value) || 0;
            const area = w * h * qty;
            document.getElementById('calc-area-display').textContent = area.toFixed(2) + ' ' + s.unit;
            total = area * rate;
        } else {
            total = qty * rate;
        }
        
        document.getElementById('calc-total-display').textContent = '₹ ' + total.toFixed(2);
    },

    closeCalcModal() {
        document.getElementById('calc-modal').classList.remove('active');
    },

    addCalculatedItem() {
        const s = this.currentCalcService;
        const qty = parseFloat(document.getElementById('calc-qty').value) || 1;
        const rate = parseFloat(document.getElementById('calc-rate').value) || 0;
        const notes = document.getElementById('calc-notes').value;
        
        let meta = '';
        let amount = 0;

        if (s.unit === 'Sq.Ft' || s.unit === 'Sq.Meter') {
            const w = parseFloat(document.getElementById('calc-w').value) || 0;
            const h = parseFloat(document.getElementById('calc-h').value) || 0;
            const area = w * h;
            meta = `${w}ft x ${h}ft = ${area.toFixed(2)} ${s.unit}`;
            amount = area * qty * rate;
        } else {
            amount = qty * rate;
        }

        const cartItem = {
            id: 'item_' + Date.now(),
            serviceId: s.id,
            name: s.name,
            qty: qty,
            rate: rate,
            amount: amount,
            meta: meta,
            notes: notes
        };

        this.cart.push(cartItem);
        this.closeCalcModal();
        this.updateCart();
        showToast('Item added to cart', 'success');
    },

    removeCartItem(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.updateCart();
    },

    clearCart() {
        this.cart = [];
        document.getElementById('cart-discount').value = 0;
        this.updateCart();
    },

    updateCart() {
        const container = document.getElementById('cart-items-container');
        container.innerHTML = '';
        
        let subtotal = 0;

        this.cart.forEach(item => {
            subtotal += item.amount;
            
            const metaHtml = item.meta ? `<div class="cart-item-meta">${item.meta}</div>` : '';
            const notesHtml = item.notes ? `<div class="cart-item-meta" style="color:var(--warning)">Note: ${item.notes}</div>` : '';
            
            container.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        ${metaHtml}
                        ${notesHtml}
                        <div class="cart-item-meta">${item.qty} x ₹${item.rate}</div>
                    </div>
                    <div class="cart-item-price">₹${item.amount.toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <button class="icon-btn" onclick="Billing.removeCartItem('${item.id}')"><i class="ri-close-line" style="color:var(--danger)"></i></button>
                    </div>
                </div>
            `;
        });

        if(this.cart.length === 0) {
            container.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted);">Cart is empty</div>';
        }

        this.updateTotals(subtotal);
    },

    updateTotals(subtotalVal = null) {
        let subtotal = subtotalVal !== null ? subtotalVal : this.cart.reduce((sum, item) => sum + item.amount, 0);
        const discount = parseFloat(document.getElementById('cart-discount').value) || 0;
        
        let taxableAmount = subtotal - discount;
        if(taxableAmount < 0) taxableAmount = 0;
        
        let gstAmount = 0;
        const gstEnable = document.getElementById('cart-gst-enable').checked;
        if(gstEnable) {
            const shop = Storage.get('shop');
            const gstPercent = shop.gstPercent !== undefined ? shop.gstPercent : 18;
            gstAmount = taxableAmount * (gstPercent / 100);
        }
        
        const grandTotal = Math.round(taxableAmount + gstAmount); // rounding off

        document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('cart-discount-val').textContent = '- ' + formatCurrency(discount);
        document.getElementById('cart-gst-val').textContent = formatCurrency(gstAmount);
        document.getElementById('cart-total').textContent = formatCurrency(grandTotal);
        
        this.currentTotals = {
            subtotal, discount, gstAmount, grandTotal
        };
    },

    processPayment() {
        if(this.cart.length === 0) {
            showToast('Cart is empty', 'error');
            return;
        }
        
        document.getElementById('payment-total-display').textContent = formatCurrency(this.currentTotals.grandTotal);
        document.getElementById('payment-received').value = this.currentTotals.grandTotal;
        document.getElementById('payment-change').value = '₹ 0.00';
        document.getElementById('payment-modal').classList.add('active');
    },

    calcChange() {
        const received = parseFloat(document.getElementById('payment-received').value) || 0;
        const change = received - this.currentTotals.grandTotal;
        document.getElementById('payment-change').value = '₹ ' + change.toFixed(2);
    },
    
    closePaymentModal() {
        document.getElementById('payment-modal').classList.remove('active');
    },

    loadJob(jobId) {
        const job = Storage.findById('jobs', jobId);
        if(!job) {
            showToast('Job not found', 'error');
            return;
        }

        
        // Select customer
        const cust = Storage.findById('customers', job.customerId);
        if(cust) {
            this.selectedCustomer = cust;
        }

        // Load items to cart
        if (job.items && job.items.length > 0) {
            this.cart = [...job.items];
        } else if (job.serviceId) {
            // Legacy support for mock jobs (j1, j2)
            const s = Storage.findById('services', job.serviceId);
            if (s) {
                this.cart = [{
                    id: 'item_' + Date.now(),
                    serviceId: s.id,
                    name: s.name,
                    qty: 1,
                    rate: job.total || s.rate,
                    amount: job.total || s.rate,
                    meta: '',
                    notes: ''
                }];
            } else {
                this.cart = [];
            }
        } else {
            this.cart = [];
        }
        
        // Store reference so we know we are billing a specific job
        this.currentJobId = job.id;
        
        // If UI is already rendered, update it directly
        const custDisplay = document.getElementById('selected-customer-display');
        if(custDisplay) {
            if(cust) {
                custDisplay.innerHTML = `
                    <span>${cust.name} <small>(${cust.type || ''})</small></span>
                    <button class="icon-btn" onclick="Billing.clearCustomer()" style="font-size:1rem; padding:0;"><i class="ri-close-circle-line"></i></button>
                `;
            }
            this.updateCart();
        }
        
        showToast('Job loaded for billing', 'success');
    },

    generateQuotation() {
        if(this.cart.length === 0) {
            showToast('Cart is empty', 'error');
            return;
        }

        const quotation = {
            no: 'QT-' + Math.floor(10000 + Math.random() * 90000),
            date: new Date().toISOString(),
            customerId: this.selectedCustomer ? this.selectedCustomer.id : null,
            customerName: this.selectedCustomer ? this.selectedCustomer.name : 'Walk-in',
            items: this.cart,
            subtotal: this.currentTotals.subtotal,
            discount: this.currentTotals.discount,
            gst: this.currentTotals.gstAmount,
            total: this.currentTotals.grandTotal,
            paid: 0,
            balance: this.currentTotals.grandTotal,
            method: 'QUOTATION'
        };
        
        Storage.add('quotations', quotation);
        
        showToast(`Quotation ${quotation.no} generated successfully`, 'success');
        this.clearCart();
        this.clearCustomer();
        
        this.invoiceToPDF(quotation, false);
    },

    completeInvoice(sendWhatsApp = false) {
        const method = document.getElementById('payment-method').value;
        const received = parseFloat(document.getElementById('payment-received').value) || 0;
        
        const invoice = {
            no: 'INV-' + Math.floor(10000 + Math.random() * 90000),
            date: new Date().toISOString(),
            customerId: this.selectedCustomer ? this.selectedCustomer.id : null,
            customerName: this.selectedCustomer ? this.selectedCustomer.name : 'Walk-in',
            items: this.cart,
            subtotal: this.currentTotals.subtotal,
            discount: this.currentTotals.discount,
            gst: this.currentTotals.gstAmount,
            total: this.currentTotals.grandTotal,
            paid: received > this.currentTotals.grandTotal ? this.currentTotals.grandTotal : received,
            method: method
        };
        
        invoice.balance = invoice.total - invoice.paid;
        
        Storage.add('invoices', invoice);
        
        // Handle customer balance
        if(this.selectedCustomer && invoice.balance > 0) {
            let cust = Storage.findById('customers', this.selectedCustomer.id);
            if(cust) {
                cust.balance = (parseFloat(cust.balance) || 0) + invoice.balance;
                Storage.update('customers', cust.id, { balance: cust.balance });
            }
        }
        
        if (this.currentJobId) {
            Storage.update('jobs', this.currentJobId, { 
                status: 'DELIVERED', 
                deliveredAt: new Date().toISOString() 
            });
            this.currentJobId = null;
        }
        
        showToast(`Invoice ${invoice.no} generated successfully`, 'success');
        this.closePaymentModal();
        this.clearCart();
        this.clearCustomer();
        
        this.invoiceToPDF(invoice, sendWhatsApp);
    },

    invoiceToPDF(invoice, sendWhatsApp) {
        const shop = Storage.get('shop');
        const shopName = shop.name || 'Shop';
        
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.background = '#ffffff';
        element.style.color = '#000000';
        element.style.fontFamily = 'monospace';
        element.style.fontSize = '12px';
        element.style.width = '400px'; 
        element.style.margin = '0 auto';
        
        let itemsHtml = invoice.items.map((i, index) => `
            <tr>
                <td style="padding:4px; border-right:1px solid #000; border-bottom:1px solid #000;">${index + 1}</td>
                <td style="padding:4px; border-right:1px solid #000; border-bottom:1px solid #000;">${i.name} ${i.meta ? '('+i.meta+')' : ''}</td>
                <td style="padding:4px; border-right:1px solid #000; border-bottom:1px solid #000; text-align:center">${i.qty}</td>
                <td style="padding:4px; border-right:1px solid #000; border-bottom:1px solid #000; text-align:right">${i.rate}</td>
                <td style="padding:4px; border-bottom:1px solid #000; text-align:right">${i.amount.toFixed(2)}</td>
            </tr>
        `).join('');

        const dDate = new Date(invoice.date);
        const dateStr = dDate.toLocaleDateString('en-IN');
        const timeStr = dDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' });
        
        let customerMobile = '_________________';
        if (invoice.customerId) {
            const cust = Storage.findById('customers', invoice.customerId);
            if(cust && cust.mobile) customerMobile = cust.mobile;
        }
        
        const cgst = invoice.gst / 2;
        const sgst = invoice.gst / 2;
        
        const docTitle = invoice.no.startsWith('QT-') ? 'QUOTATION' : 'INVOICE';

        element.innerHTML = `
            <div style="border: 1px solid #000; padding: 10px;">
                <div style="text-align:center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <h2 style="margin:0; font-size:16px;">${shopName}</h2>
                    <p style="margin:5px 0 0;">${shop.address || 'Printing • Xerox • Design • Photo • Flex'}</p>
                    <p style="margin:5px 0 0;">Mobile: ${shop.phone || ''}</p>
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                    <strong>${docTitle}</strong>
                    <span>No: ${invoice.no}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                    <span>Date: ${dateStr}</span>
                    <span>Time: ${timeStr}</span>
                </div>

                <div style="border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <div>Customer Name: ${invoice.customerName || '_________________'}</div>
                    <div style="margin-top:5px;">Mobile: ${customerMobile}</div>
                </div>

                <table style="width:100%; border-collapse: collapse; margin-bottom:10px; border: 1px solid #000;">
                    <thead>
                        <tr style="border-bottom: 1px solid #000;">
                            <th style="padding:4px; text-align:left; border-right: 1px solid #000; width: 30px;">#</th>
                            <th style="padding:4px; text-align:left; border-right: 1px solid #000;">Description</th>
                            <th style="padding:4px; text-align:center; border-right: 1px solid #000; width: 40px;">Qty</th>
                            <th style="padding:4px; text-align:right; border-right: 1px solid #000; width: 60px;">Rate</th>
                            <th style="padding:4px; text-align:right; width: 80px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <div style="display:flex; justify-content:flex-end; margin-bottom:3px;">
                        <span style="width: 120px; text-align: right;">Sub Total:</span>
                        <span style="width: 80px; text-align: right;">₹${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-bottom:3px;">
                        <span style="width: 120px; text-align: right;">Discount:</span>
                        <span style="width: 80px; text-align: right;">₹${invoice.discount.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-bottom:3px;">
                        <span style="width: 120px; text-align: right;">CGST:</span>
                        <span style="width: 80px; text-align: right;">₹${cgst.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-bottom:3px;">
                        <span style="width: 120px; text-align: right;">SGST:</span>
                        <span style="width: 80px; text-align: right;">₹${sgst.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-top:5px; font-weight:bold;">
                        <span style="width: 120px; text-align: right; border-top: 1px solid #000; padding-top: 2px;">TOTAL:</span>
                        <span style="width: 80px; text-align: right; border-top: 1px solid #000; padding-top: 2px;">₹${invoice.total.toFixed(2)}</span>
                    </div>
                </div>

                <div style="border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <div style="margin-bottom: 5px;">Payment: CASH / UPI / CARD</div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>Paid: ₹${invoice.paid.toFixed(2)}</span>
                        <span>Balance: ₹${invoice.balance.toFixed(2)}</span>
                    </div>
                </div>

                <div style="text-align: center;">
                    <p style="margin: 0; font-weight: bold;">THANK YOU FOR YOUR BUSINESS</p>
                    <p style="margin: 5px 0 0;">${shopName}</p>
                </div>
            </div>
        `;
        
        if(typeof html2pdf !== 'undefined') {
            const opt = {
                margin:       0.5,
                filename:     `${invoice.no}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'a5', orientation: 'portrait' }
            };
            
            showToast('Generating PDF...', 'info');
            html2pdf().set(opt).from(element).save().then(() => {
                if(sendWhatsApp) this.sendWhatsApp(invoice, shopName);
            }).catch(() => {
                if(sendWhatsApp) this.sendWhatsApp(invoice, shopName);
            });
        } else {
            if(sendWhatsApp) this.sendWhatsApp(invoice, shopName);
        }
    },

    sendWhatsApp(invoice, shopName) {
        let text = `*${shopName}* - Invoice Summary\n\n`;
        text += `Invoice No: ${invoice.no}\n`;
        text += `Date: ${formatDate(invoice.date).split(' ')[0]}\n\n`;
        
        text += `*Items:*\n`;
        invoice.items.forEach(i => {
            text += `- ${i.name} (${i.qty}) : ₹${i.amount.toFixed(2)}\n`;
        });
        
        text += `\n*Total: ₹${invoice.total.toFixed(2)}*\n`;
        text += `Paid: ₹${invoice.paid.toFixed(2)}\n`;
        text += `Balance: ₹${invoice.balance.toFixed(2)}\n\n`;
        text += `Thank you for your business!`;
        
        let mobile = '';
        if (invoice.customerId) {
            const cust = Storage.findById('customers', invoice.customerId);
            if(cust && cust.mobile) {
                mobile = cust.mobile.replace(/[^0-9]/g, '');
                if(mobile.length === 10) mobile = '91' + mobile; 
            }
        }
        
        const url = `https://wa.me/${mobile}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    },

    saveAsJob() {
        if(this.cart.length === 0) {
            showToast('Cart is empty', 'error');
            return;
        }
        if(!this.selectedCustomer) {
            showToast('Select a customer for Job Order', 'warning');
            return;
        }
        
        document.getElementById('job-total-display').textContent = formatCurrency(this.currentTotals.grandTotal);
        
        const now = new Date();
        now.setHours(now.getHours() + 24); // default to tomorrow
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('job-due-date').value = now.toISOString().slice(0, 16);
        document.getElementById('job-advance-amt').value = 0;
        
        document.getElementById('job-modal').classList.add('active');
    },

    confirmSaveJob() {
        const advanceStr = document.getElementById('job-advance-amt').value;
        const dueDate = document.getElementById('job-due-date').value;
        
        let advance = parseFloat(advanceStr);
        if(isNaN(advance) || advance < 0) advance = 0;
        
        if(advance > this.currentTotals.grandTotal) {
            showToast('Advance cannot exceed total amount', 'error');
            return;
        }

        const existingJobs = Storage.get('jobs');
        let prefix = 'JOB';
        if(this.cart.length > 0 && this.cart[0].name) {
            let itemName = this.cart[0].name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
            if(itemName) prefix = itemName;
        }
        
        let maxCounter = 0;
        existingJobs.forEach(j => {
            if (j.id.startsWith(prefix + '-')) {
                const parts = j.id.split('-');
                const num = parseInt(parts[1], 10);
                if (!isNaN(num) && num > maxCounter) {
                    maxCounter = num;
                }
            }
        });
        
        let counter = maxCounter + 1;
        let jobId = `${prefix}-${String(counter).padStart(5, '0')}`;
        while(existingJobs.find(j => j.id === jobId)) {
            counter++;
            jobId = `${prefix}-${String(counter).padStart(5, '0')}`;
        }

        const job = {
            id: jobId,
            date: new Date().toISOString(),
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            customerId: this.selectedCustomer.id,
            items: this.cart,
            total: this.currentTotals.grandTotal,
            advance: advance,
            status: 'NEW',
            notified_30: false,
            notified_overdue: false
        };
        
        Storage.add('jobs', job);

        if(advance > 0) {
            let cust = Storage.findById('customers', this.selectedCustomer.id);
            if(cust) {
                cust.balance = (parseFloat(cust.balance) || 0) - advance;
                Storage.update('customers', cust.id, { balance: cust.balance });
                
                Storage.add('payments', {
                    id: 'PAY-' + Math.floor(10000 + Math.random() * 90000),
                    customerId: cust.id,
                    date: new Date().toISOString(),
                    amount: advance,
                    notes: `Advance for ${job.id}`
                });
            }
        }

        showToast(`Job Order created successfully`, 'success');
        document.getElementById('job-modal').classList.remove('active');
        this.clearCart();
        this.clearCustomer();
        window.location.hash = '#jobs';
    },

    loadJob(id) {
        const job = Storage.findById('jobs', id);
        if(!job) {
            showToast('Job not found', 'error');
            return;
        }
        
        this.cart = [...(job.items || [])];
        if(job.customerId) {
            const cust = Storage.findById('customers', job.customerId);
            if(cust) {
                this.selectedCustomer = cust;
                document.getElementById('selected-customer-display').innerHTML = `
                    <span>${cust.name} <small>(${cust.type})</small></span>
                    <button class="icon-btn" onclick="Billing.clearCustomer()" style="font-size:1rem; padding:0;"><i class="ri-close-circle-line"></i></button>
                `;
            }
        }
        
        document.getElementById('cart-discount').value = job.discount || 0;
        document.getElementById('cart-gst-enable').checked = (job.gst > 0);
        
        this.currentJobId = id;
        this.updateCart();
        window.location.hash = '#billing';
    }
};
