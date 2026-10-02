window.Dashboard = {
    init() {
        this.renderStats();
        this.renderRecentJobs();
    },

    renderStats() {
        const invoices = Storage.get('invoices');
        const jobs = Storage.get('jobs');
        
        let todaySales = 0;
        let todayProfit = 0; // Simplified
        let pendingPayments = 0;
        
        const today = new Date().toISOString().split('T')[0];
        
        invoices.forEach(inv => {
            if(inv.date.startsWith(today)) {
                todaySales += parseFloat(inv.total);
            }
            pendingPayments += parseFloat(inv.balance);
        });

        const pendingJobs = jobs.filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED').length;
        
        const dashboardHtml = `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-icon success"><i class="ri-money-rupee-circle-line"></i></div>
                    <div class="stat-details">
                        <div class="stat-title">Today's Sales</div>
                        <div class="stat-value">${formatCurrency(todaySales)}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning"><i class="ri-wallet-3-line"></i></div>
                    <div class="stat-details">
                        <div class="stat-title">Pending Payments</div>
                        <div class="stat-value">${formatCurrency(pendingPayments)}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon primary"><i class="ri-printer-line"></i></div>
                    <div class="stat-details">
                        <div class="stat-title">Pending Jobs</div>
                        <div class="stat-value">${pendingJobs}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon danger"><i class="ri-alert-line"></i></div>
                    <div class="stat-details">
                        <div class="stat-title">Low Stock Items</div>
                        <div class="stat-value">0</div>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>Recent Jobs</h3>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table" id="recent-jobs-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Service</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div class="card-body">
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <button class="btn btn-primary" onclick="window.location.hash='#billing'"><i class="ri-add-line"></i> New Bill</button>
                            <button class="btn btn-secondary" onclick="window.location.hash='#jobs'"><i class="ri-task-line"></i> New Job</button>
                            <button class="btn btn-secondary" onclick="window.location.hash='#customers'"><i class="ri-user-add-line"></i> Add Customer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('dashboard-view').innerHTML = dashboardHtml;
        this.renderRecentJobs();
    },

    renderRecentJobs() {
        const jobs = Storage.get('jobs').sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        const services = Storage.get('services');
        const tbody = document.querySelector('#recent-jobs-table tbody');
        
        if(!tbody) return;
        tbody.innerHTML = '';
        
        if(jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No recent jobs</td></tr>';
            return;
        }
        
        jobs.forEach(job => {
            let serviceName = 'Unknown';
            if (job.items && job.items.length > 0) {
                serviceName = job.items.map(i => i.name).join(', ');
                if(serviceName.length > 25) serviceName = serviceName.substring(0, 25) + '...';
            } else if (job.serviceId) {
                const service = services.find(s => s.id === job.serviceId);
                serviceName = service ? service.name : 'Service';
            }
            
            let badgeClass = 'status-new';
            if(job.status === 'PRINTING') badgeClass = 'status-printing';
            if(job.status === 'READY' || job.status === 'DELIVERED') badgeClass = 'status-ready';
            
            tbody.innerHTML += `
                <tr>
                    <td>${formatDate(job.date).split(' ')[0]}</td>
                    <td>${serviceName}</td>
                    <td><span class="status-badge ${badgeClass}">${job.status}</span></td>
                    <td>${formatCurrency(job.total)}</td>
                </tr>
            `;
        });
    }
};
