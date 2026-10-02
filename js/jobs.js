window.Jobs = {
    init() {
        this.setupView();
        this.renderTable();
    },

    setupView() {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3>Job Orders Tracking</h3>
                    <button class="btn btn-primary" onclick="window.location.hash='#billing'"><i class="ri-add-line"></i> New Job (via Billing)</button>
                </div>
                <div class="card-body">
                    <div style="display:flex; gap:1rem; margin-bottom:1.5rem">
                        <select class="form-control" id="job-status-filter" style="width:250px" onchange="Jobs.renderTable()">
                            <option value="ACTIVE">Active Jobs (Not Delivered)</option>
                            <option value="NEW">New</option>
                            <option value="DESIGNING">Designing</option>
                            <option value="PRINTING">Printing</option>
                            <option value="READY">Ready</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="ALL">All Jobs (Including Delivered)</option>
                        </select>
                        <input type="text" class="form-control" id="job-search" placeholder="Search ID or Customer..." onkeyup="Jobs.renderTable()">
                    </div>
                    <div class="table-responsive">
                        <table class="table" id="jobs-table">
                            <thead>
                                <tr>
                                    <th>Job ID</th>
                                    <th>Date & Due Date</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('jobs-view').innerHTML = html;
    },

    renderTable() {
        const jobs = Storage.get('jobs').sort((a,b) => new Date(b.date) - new Date(a.date));
        const customers = Storage.get('customers');
        const filterStatus = document.getElementById('job-status-filter').value;
        const search = document.getElementById('job-search').value.toLowerCase();
        
        const tbody = document.querySelector('#jobs-table tbody');
        tbody.innerHTML = '';
        
        let filtered = jobs;
        if (filterStatus === 'ACTIVE') {
            filtered = filtered.filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED');
        } else if (filterStatus !== 'ALL') {
            filtered = filtered.filter(j => j.status === filterStatus);
        }
        if(search) {
            filtered = filtered.filter(j => {
                const c = customers.find(x => x.id === j.customerId);
                const cName = c ? c.name.toLowerCase() : '';
                return j.id.toLowerCase().includes(search) || cName.includes(search);
            });
        }
        
        if(filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No jobs found</td></tr>';
            return;
        }

        filtered.forEach(j => {
            const cust = customers.find(c => c.id === j.customerId);
            const custName = cust ? cust.name : 'Unknown';
            
            // Generate items summary
            let itemsSummary = '';
            if(j.items && j.items.length > 0) {
                itemsSummary = j.items.map(i => i.name).join(', ');
                if(itemsSummary.length > 30) itemsSummary = itemsSummary.substring(0, 30) + '...';
            } else if (j.serviceId) {
                // Compatibility for old demo data
                const s = Storage.findById('services', j.serviceId);
                itemsSummary = s ? s.name : 'Service';
            }
            
            let statusBadge = `<span class="status-badge" style="background:#E5E7EB; color:#374151">${j.status}</span>`;
            if(j.status === 'NEW') statusBadge = `<span class="status-badge status-new">NEW</span>`;
            if(j.status === 'PRINTING') statusBadge = `<span class="status-badge status-printing">PRINTING</span>`;
            if(j.status === 'READY') statusBadge = `<span class="status-badge status-ready">READY</span>`;
            if(j.status === 'DELIVERED') statusBadge = `<span class="status-badge status-ready" style="background:#10B981; color:#fff">DELIVERED</span>`;

            const dueDateHtml = j.dueDate ? `<br><small style="color:var(--danger)">Due: ${formatDate(j.dueDate)}</small>` : '';
            const deliveredHtml = j.deliveredAt && j.status === 'DELIVERED' ? `<br><small style="color:var(--success)">Delivered: ${formatDate(j.deliveredAt)}</small>` : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${j.id}</strong></td>
                <td>${formatDate(j.date).split(' ')[0]}${dueDateHtml}${deliveredHtml}</td>
                <td>${custName}</td>
                <td title="${itemsSummary}">${itemsSummary}</td>
                <td>${statusBadge}</td>
                <td>${formatCurrency(j.total)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="Jobs.billJob('${j.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="ri-bill-line"></i> BILL</button>
                    <button class="btn btn-sm btn-danger" onclick="Jobs.deleteJob('${j.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="ri-delete-bin-line"></i> DEL</button>
                    <select class="form-control" style="width:110px; font-size:0.75rem; padding:0.25rem; display:inline-block;" onchange="Jobs.updateStatus('${j.id}', this.value)">
                        <option value="NEW" ${j.status === 'NEW' ? 'selected' : ''}>NEW</option>
                        <option value="DESIGNING" ${j.status === 'DESIGNING' ? 'selected' : ''}>DESIGNING</option>
                        <option value="PRINTING" ${j.status === 'PRINTING' ? 'selected' : ''}>PRINTING</option>
                        <option value="READY" ${j.status === 'READY' ? 'selected' : ''}>READY</option>
                        <option value="DELIVERED" ${j.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    updateStatus(id, newStatus) {
        const updateData = { status: newStatus };
        if (newStatus === 'DELIVERED') {
            updateData.deliveredAt = new Date().toISOString();
        }
        
        Storage.update('jobs', id, updateData);
        showToast(`Job status updated to ${newStatus}`, 'success');
        this.renderTable();
        // Also update dashboard if it's visible
        if(window.Dashboard) Dashboard.renderRecentJobs();
    },

    billJob(id) {
        if(window.Billing) {
            window.location.hash = '#billing';
            // Wait for DOM to render Billing view before loading job data
            setTimeout(() => {
                Billing.loadJob(id);
            }, 100);
        } else {
            showToast('Billing module not loaded', 'error');
        }
    },

    deleteJob(id) {
        if(confirm('Are you sure you want to delete this Job Order?')) {
            Storage.delete('jobs', id);
            showToast('Job Order deleted', 'success');
            this.renderTable();
            if(window.Dashboard) Dashboard.renderRecentJobs();
        }
    }
};
