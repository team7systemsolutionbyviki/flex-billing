window.Reports = {
    init() {
        this.renderView();
        this.generateReport(); // Load default
    },

    renderView() {
        const html = `
            <div class="card">
                <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
                    <h3>System Reports</h3>
                    <div style="display:flex; gap:0.5rem; flex-wrap: wrap; align-items:center;">
                        <select id="report-type" class="form-control" style="width:auto;" onchange="Reports.toggleCustomDate(); Reports.generateReport()">
                            <option value="today">Today's Sales</option>
                            <option value="month">This Month Sales</option>
                            <option value="custom">Custom Date Sales</option>
                            <option value="customer_date">Customer & Date Sales</option>
                            <option value="pending_jobs">Pending Job Orders</option>
                            <option value="outstanding">Outstanding Balances</option>
                        </select>
                        <div id="custom-date-filters" style="display:none; gap:0.5rem; align-items:center;">
                            <input type="date" id="from-date" class="form-control" style="width:auto;" onchange="Reports.generateReport()">
                            <span>to</span>
                            <input type="date" id="to-date" class="form-control" style="width:auto;" onchange="Reports.generateReport()">
                        </div>
                        <div id="customer-filter-container" style="display:none; gap:0.5rem; align-items:center;">
                            <select id="report-customer" class="form-control" style="width:auto; min-width:150px;" onchange="Reports.generateReport()">
                                <option value="ALL">All Customers</option>
                                <!-- populated dynamically -->
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="Reports.downloadPDF()"><i class="ri-file-pdf-line"></i> Download PDF</button>
                        <button class="btn btn-secondary" onclick="Reports.shareWhatsApp()" style="background-color:#25D366; color:white; border:none;"><i class="ri-whatsapp-line"></i> Share WhatsApp</button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="report-print-area" style="background:var(--bg-card); padding:1rem; border-radius:var(--radius-md);">
                        <div style="text-align:center; margin-bottom:1.5rem; display:none;" id="report-print-header">
                            <h2 style="margin:0;" id="print-shop-name">T7 PRINT BILLING</h2>
                            <p style="margin:0; color:#666;" id="print-report-title">Report</p>
                            <p style="margin:0; color:#666; font-size:0.8rem;" id="print-report-date"></p>
                        </div>
                        <div class="table-responsive" id="report-table-container">
                            <!-- Table goes here -->
                        </div>
                        <div id="report-summary" style="margin-top:1.5rem; padding-top:1rem; border-top:2px dashed var(--border-color); display:flex; justify-content:flex-end; gap:2rem; font-size:1.125rem; font-weight:bold;">
                            <!-- Summary goes here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('reports-view').innerHTML = html;
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('from-date').value = today;
        document.getElementById('to-date').value = today;
        
        const customers = Storage.get('customers') || [];
        const custSelect = document.getElementById('report-customer');
        if (custSelect) {
            customers.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.name} (${c.mobile})`;
                custSelect.appendChild(opt);
            });
        }
    },

    toggleCustomDate() {
        const type = document.getElementById('report-type').value;
        const filters = document.getElementById('custom-date-filters');
        const custFilter = document.getElementById('customer-filter-container');
        
        if (type === 'custom' || type === 'customer_date') {
            filters.style.display = 'flex';
        } else {
            filters.style.display = 'none';
        }
        
        if (type === 'customer_date') {
            custFilter.style.display = 'flex';
        } else {
            custFilter.style.display = 'none';
        }
    },

    generateReport() {
        const type = document.getElementById('report-type').value;
        const container = document.getElementById('report-table-container');
        const summary = document.getElementById('report-summary');
        const titleEl = document.getElementById('print-report-title');
        
        container.innerHTML = '';
        summary.innerHTML = '';
        
        let tableHtml = '<table class="table"><thead><tr>';
        
        if (type === 'today' || type === 'month' || type === 'custom' || type === 'customer_date') {
            const invoices = Storage.get('invoices');
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const monthStr = todayStr.substring(0, 7);
            
            let customerId = 'ALL';
            
            if (type === 'today') titleEl.textContent = "Daily Sales Report";
            else if (type === 'month') titleEl.textContent = "Monthly Sales Report";
            else if (type === 'custom') {
                const from = document.getElementById('from-date').value;
                const to = document.getElementById('to-date').value;
                titleEl.textContent = `Custom Sales Report (${from} to ${to})`;
            }
            else if (type === 'customer_date') {
                const from = document.getElementById('from-date').value;
                const to = document.getElementById('to-date').value;
                const custSelect = document.getElementById('report-customer');
                customerId = custSelect.value;
                const customerName = custSelect.options[custSelect.selectedIndex].text;
                titleEl.textContent = `Sales Report - ${customerName} (${from} to ${to})`;
            }
            
            const filtered = invoices.filter(inv => {
                const invDate = inv.date.split('T')[0];
                let dateMatch = false;
                
                if (type === 'today') dateMatch = (invDate === todayStr);
                else if (type === 'month') dateMatch = invDate.startsWith(monthStr);
                else if (type === 'custom' || type === 'customer_date') {
                    const from = document.getElementById('from-date').value;
                    const to = document.getElementById('to-date').value;
                    dateMatch = (invDate >= from && invDate <= to);
                }
                
                if (type === 'customer_date' && customerId !== 'ALL') {
                    return dateMatch && (inv.customerId === customerId);
                }
                
                return dateMatch;
            });
            
            tableHtml += '<th>Inv No</th><th>Date</th><th>Customer</th><th>Amount</th><th>Paid</th><th>Balance</th></tr></thead><tbody>';
            
            let totalAmt = 0, totalPaid = 0, totalBal = 0;
            
            if(filtered.length === 0) {
                tableHtml += '<tr><td colspan="6" style="text-align:center">No sales records found</td></tr>';
            } else {
                filtered.forEach(inv => {
                    totalAmt += parseFloat(inv.total) || 0;
                    totalPaid += parseFloat(inv.paid) || 0;
                    totalBal += parseFloat(inv.balance) || 0;
                    
                    tableHtml += `
                        <tr>
                            <td>${inv.no}</td>
                            <td>${formatDate(inv.date).split(' ')[0]}</td>
                            <td>${inv.customerName || 'Walk-in'}</td>
                            <td>${formatCurrency(inv.total)}</td>
                            <td>${formatCurrency(inv.paid)}</td>
                            <td style="color:${inv.balance > 0 ? 'var(--danger)' : 'inherit'}">${formatCurrency(inv.balance)}</td>
                        </tr>
                    `;
                });
                
                summary.innerHTML = `
                    <div>Total Sales: <span style="color:var(--primary)">${formatCurrency(totalAmt)}</span></div>
                    <div>Received: <span style="color:var(--secondary)">${formatCurrency(totalPaid)}</span></div>
                    <div>Due: <span style="color:var(--danger)">${formatCurrency(totalBal)}</span></div>
                `;
            }
        } 
        else if (type === 'pending_jobs') {
            titleEl.textContent = "Pending Job Orders Report";
            const jobs = Storage.get('jobs').filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED');
            const customers = Storage.get('customers');
            
            tableHtml += '<th>Job ID</th><th>Date</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead><tbody>';
            
            let totalAmt = 0;
            if(jobs.length === 0) {
                tableHtml += '<tr><td colspan="5" style="text-align:center">No pending jobs</td></tr>';
            } else {
                jobs.forEach(j => {
                    const cust = customers.find(c => c.id === j.customerId);
                    totalAmt += parseFloat(j.total) || 0;
                    
                    tableHtml += `
                        <tr>
                            <td>${j.id}</td>
                            <td>${formatDate(j.date).split(' ')[0]}</td>
                            <td>${cust ? cust.name : 'Unknown'}</td>
                            <td>${j.status}</td>
                            <td>${formatCurrency(j.total)}</td>
                        </tr>
                    `;
                });
                summary.innerHTML = `<div>Total Pending Job Value: <span style="color:var(--primary)">${formatCurrency(totalAmt)}</span></div>`;
            }
        }
        else if (type === 'outstanding') {
            titleEl.textContent = "Outstanding Balances Report";
            const customers = Storage.get('customers').filter(c => parseFloat(c.balance) > 0);
            
            tableHtml += '<th>Customer ID</th><th>Name</th><th>Mobile</th><th>Type</th><th>Balance Due</th></tr></thead><tbody>';
            
            let totalDue = 0;
            if(customers.length === 0) {
                tableHtml += '<tr><td colspan="5" style="text-align:center">No outstanding balances</td></tr>';
            } else {
                customers.forEach(c => {
                    const bal = parseFloat(c.balance) || 0;
                    totalDue += bal;
                    tableHtml += `
                        <tr>
                            <td>${c.id.substring(0,8)}</td>
                            <td>${c.name}</td>
                            <td>${c.mobile}</td>
                            <td>${c.type}</td>
                            <td style="color:var(--danger)">${formatCurrency(bal)}</td>
                        </tr>
                    `;
                });
                summary.innerHTML = `<div>Total Market Outstanding: <span style="color:var(--danger)">${formatCurrency(totalDue)}</span></div>`;
            }
        }
        
        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;
        
        // Update header details for printing
        const shop = Storage.get('shop');
        document.getElementById('print-shop-name').textContent = shop.name || 'T7 PRINT BILLING';
        document.getElementById('print-report-date').textContent = 'Generated: ' + formatDate(new Date().toISOString());
    },

    downloadPDF() {
        if(typeof html2pdf === 'undefined') {
            showToast('PDF Library loading, please wait a second and try again.', 'warning');
            return;
        }

        const element = document.getElementById('report-print-area');
        const header = document.getElementById('report-print-header');
        const reportType = document.getElementById('report-type');
        const titleName = reportType.options[reportType.selectedIndex].text.replace(/ /g, '_');
        
        // Show header only for PDF
        header.style.display = 'block';
        
        // To ensure Claymorphism shadows don't mess up the PDF, we could temporarily remove them or change bg
        const originalBg = element.style.background;
        element.style.background = '#ffffff';

        const opt = {
            margin:       0.5,
            filename:     `${titleName}_${new Date().toISOString().split('T')[0]}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        showToast('Generating PDF...', 'info');
        
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore UI
            header.style.display = 'none';
            element.style.background = originalBg;
            showToast('PDF Downloaded', 'success');
        }).catch(err => {
            header.style.display = 'none';
            element.style.background = originalBg;
            showToast('Error generating PDF', 'error');
            console.error(err);
        });
    },

    shareWhatsApp() {
        const type = document.getElementById('report-type').value;
        const shop = Storage.get('shop');
        const shopName = shop.name || 'T7 PRINT BILLING';
        
        let text = `*${shopName}*\n`;
        text += `*Report:* ${document.getElementById('print-report-title').textContent}\n`;
        text += `*Date:* ${new Date().toISOString().split('T')[0]}\n\n`;
        
        // Extract summary
        const summaryNodes = document.getElementById('report-summary').querySelectorAll('div');
        if(summaryNodes.length > 0) {
            summaryNodes.forEach(n => {
                text += `${n.textContent}\n`;
            });
        } else {
            text += `No data available for this period.`;
        }
        
        text += `\n_Generated by T7 Print System_`;
        
        const encodedText = encodeURIComponent(text);
        const url = `https://wa.me/?text=${encodedText}`;
        
        window.open(url, '_blank');
        showToast('Opening WhatsApp', 'success');
    }
};
