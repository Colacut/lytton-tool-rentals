// Demo credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'lytton2025';

// Data storage (in-memory only - resets on page refresh)
let tools = [];
let customers = [];
let rentals = [];
let currentUser = null;
let nextToolId = 1;
let nextCustomerId = 1;
let nextRentalId = 1;
let editingToolId = null;
let editingCustomerId = null;
let currentToolImage = null;
let shoppingCart = [];
let currentCategory = 'all';
let searchQuery = '';
let searchDebounceTimer = null;

// Initialize with sample data
function initializeSampleData() {
  // Sample tools
  tools = [
    { id: 1, name: 'Cordless Drill Set', category: 'Power Tools', description: 'Professional 18V cordless drill with 2 batteries and charger', dailyRate: 15, weeklyRate: 45, monthlyRate: 180, quantity: 3, available: 2, status: 'Available', sku: 'PWR-001', purchaseCost: 150, purchaseDate: '2025-01-15', image: null },
    { id: 2, name: 'Pressure Washer', category: 'Specialty Equipment', description: '3000 PSI gas-powered pressure washer', dailyRate: 45, weeklyRate: 135, monthlyRate: 540, quantity: 2, available: 1, status: 'Available', sku: 'SPE-005', purchaseCost: 500, purchaseDate: '2025-02-01', image: null },
    { id: 3, name: 'Table Saw', category: 'Cutting Tools', description: '10-inch professional table saw with stand', dailyRate: 35, weeklyRate: 105, monthlyRate: 420, quantity: 1, available: 0, status: 'Available', sku: 'CUT-003', purchaseCost: 450, purchaseDate: '2025-01-20', image: null },
    { id: 4, name: 'Circular Saw', category: 'Cutting Tools', description: '7.25-inch circular saw', dailyRate: 20, weeklyRate: 60, monthlyRate: 240, quantity: 2, available: 2, status: 'Available', sku: 'CUT-001', purchaseCost: 120, purchaseDate: '2025-01-10', image: null },
    { id: 5, name: 'Lawn Mower', category: 'Garden Tools', description: 'Gas-powered push lawn mower', dailyRate: 35, weeklyRate: 105, monthlyRate: 420, quantity: 3, available: 2, status: 'Available', sku: 'GRD-001', purchaseCost: 300, purchaseDate: '2025-02-05', image: null }
  ];
  nextToolId = 6;

  // Sample customers
  customers = [
    { id: 1, name: 'John Thompson', email: 'jthompson@email.com', phone: '250-555-0123', address: '123 Main St, Lytton BC', license: 'BC123456', emergency: '', notes: '', totalRentals: 5, totalSpent: 450, lastRental: '2025-10-20' },
    { id: 2, name: 'Sarah Construction Ltd', email: 'sarah@construction.ca', phone: '250-555-0456', address: '456 Fraser Ave, Lytton BC', license: 'BC789012', emergency: '', notes: '', totalRentals: 12, totalSpent: 1850, lastRental: '2025-10-25' },
    { id: 3, name: 'Mike Wilson', email: 'mwilson@email.com', phone: '250-555-0789', address: '789 River Rd, Lytton BC', license: 'BC345678', emergency: '', notes: '', totalRentals: 3, totalSpent: 225, lastRental: '2025-09-15' }
  ];
  nextCustomerId = 4;

  // Sample rentals
  rentals = [
    { id: 1, customerId: 2, customerName: 'Sarah Construction Ltd', toolId: 3, toolName: 'Table Saw', startDate: '2025-10-25', endDate: '2025-10-28', period: 'daily', cost: 105, deposit: 100, status: 'Active', payment: 'Credit Card', notes: '' },
    { id: 2, customerId: 1, customerName: 'John Thompson', toolId: 2, toolName: 'Pressure Washer', startDate: '2025-10-20', endDate: '2025-10-27', period: 'weekly', cost: 135, deposit: 50, status: 'Returned', payment: 'Cash', notes: '', returnDate: '2025-10-26' },
    { id: 3, customerId: 1, customerName: 'John Thompson', toolId: 1, toolName: 'Cordless Drill Set', startDate: '2025-09-10', endDate: '2025-09-12', period: 'daily', cost: 30, deposit: 50, status: 'Returned', payment: 'Debit Card', notes: '', returnDate: '2025-09-12' }
  ];
  nextRentalId = 4;
}

// Login handler
function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    currentUser = username;
    errorDiv.style.display = 'none';
    showToast('Login successful!', 'success');
    showPage('dashboard');
    updateDashboard();
  } else {
    errorDiv.textContent = 'Invalid username or password';
    errorDiv.style.display = 'block';
  }
}

// Logout handler
function handleLogout() {
  if (confirm('Are you sure you want to sign out?')) {
    currentUser = null;
    document.getElementById('login-form').reset();
    showPage('customer');
    showToast('Logged out successfully', 'info');
  }
}

// Page navigation
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  document.getElementById(`${pageId}-page`).classList.add('active');
}

// Tab switching
function switchTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.add('active');

  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => tab.classList.remove('active'));
  event.target.closest('.nav-tab').classList.add('active');

  // Refresh data for specific tabs
  if (tabId === 'overview') updateDashboard();
  if (tabId === 'tools') renderToolsTable();
  if (tabId === 'rentals') renderRentalsTab();
  if (tabId === 'customers') renderCustomersTable();
  if (tabId === 'reports') renderReports();
}

// Update dashboard overview
function updateDashboard() {
  // Calculate metrics
  const monthlyRevenue = rentals.filter(r => {
    const date = new Date(r.startDate);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, r) => sum + r.cost, 0);

  const currentlyRented = rentals.filter(r => r.status === 'Active').length;
  const availableTools = tools.reduce((sum, t) => sum + t.available, 0);
  const totalCustomers = customers.length;

  document.getElementById('metric-revenue').textContent = `$${monthlyRevenue}`;
  document.getElementById('metric-rented').textContent = currentlyRented;
  document.getElementById('metric-available').textContent = availableTools;
  document.getElementById('metric-customers').textContent = totalCustomers;

  // Render recent rentals
  renderRecentRentals();
  renderAlerts();
}

// Render recent rentals
function renderRecentRentals() {
  const container = document.getElementById('recent-rentals-list');
  const recentRentals = rentals.slice(-5).reverse();

  if (recentRentals.length === 0) {
    container.innerHTML = '<p style="color: var(--color-text-secondary);">No recent rentals</p>';
    return;
  }

  container.innerHTML = recentRentals.map(rental => `
    <div class="rental-item">
      <div class="rental-item-header">
        <span class="rental-item-title">${rental.customerName}</span>
        <span class="status status--${rental.status === 'Active' ? 'success' : 'info'}">${rental.status}</span>
      </div>
      <div class="rental-item-details">
        ${rental.toolName} • ${rental.startDate} to ${rental.endDate} • $${rental.cost}
      </div>
    </div>
  `).join('');
}

// Render alerts
function renderAlerts() {
  const container = document.getElementById('alerts-list');
  const today = new Date();
  const alerts = [];

  // Check for overdue rentals
  rentals.filter(r => r.status === 'Active').forEach(rental => {
    const endDate = new Date(rental.endDate);
    if (endDate < today) {
      alerts.push({
        title: '⚠️ Overdue Rental',
        text: `${rental.customerName} - ${rental.toolName} (Due: ${rental.endDate})`
      });
    }
  });

  // Check for low stock
  tools.forEach(tool => {
    if (tool.available === 0 && tool.quantity > 0) {
      alerts.push({
        title: '📦 Out of Stock',
        text: `${tool.name} - All units currently rented`
      });
    }
  });

  if (alerts.length === 0) {
    container.innerHTML = '<div class="alert-item"><div class="alert-item-title">✅ All Good!</div><div class="alert-item-text">No alerts at this time</div></div>';
    return;
  }

  container.innerHTML = alerts.map(alert => `
    <div class="alert-item">
      <div class="alert-item-title">${alert.title}</div>
      <div class="alert-item-text">${alert.text}</div>
    </div>
  `).join('');
}

// Tools Management
function renderToolsTable() {
  const tbody = document.getElementById('tools-table-body');
  
  if (tools.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--color-text-secondary);">No tools found. Click "Add New Tool" to get started.</td></tr>';
    return;
  }

  tbody.innerHTML = tools.map(tool => `
    <tr>
      <td>
        <div class="tool-thumbnail">
          ${tool.image ? `<img src="${tool.image}" alt="${tool.name}">` : `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          `}
        </div>
      </td>
      <td><strong>${tool.name}</strong></td>
      <td>${tool.category}</td>
      <td>$${tool.dailyRate}</td>
      <td>$${tool.weeklyRate}</td>
      <td>$${tool.monthlyRate}</td>
      <td>${tool.available}/${tool.quantity}</td>
      <td><span class="status status--${tool.status === 'Available' ? 'success' : 'warning'}">${tool.status}</span></td>
      <td>
        <div class="action-buttons">
          <button class="action-btn" onclick="editTool(${tool.id})" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete" onclick="deleteTool(${tool.id})" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openToolModal() {
  editingToolId = null;
  currentToolImage = null;
  document.getElementById('tool-modal-title').textContent = 'Add New Tool';
  document.getElementById('tool-form').reset();
  document.getElementById('tool-id').value = '';
  document.getElementById('image-preview').style.display = 'none';
  document.getElementById('image-upload-placeholder').style.display = 'block';
  document.getElementById('tool-modal').classList.add('active');
}

function closeToolModal() {
  document.getElementById('tool-modal').classList.remove('active');
}

function editTool(id) {
  const tool = tools.find(t => t.id === id);
  if (!tool) return;

  editingToolId = id;
  currentToolImage = tool.image;
  
  document.getElementById('tool-modal-title').textContent = 'Edit Tool';
  document.getElementById('tool-id').value = tool.id;
  document.getElementById('tool-name').value = tool.name;
  document.getElementById('tool-category').value = tool.category;
  document.getElementById('tool-description').value = tool.description || '';
  document.getElementById('tool-daily-rate').value = tool.dailyRate;
  document.getElementById('tool-weekly-rate').value = tool.weeklyRate;
  document.getElementById('tool-monthly-rate').value = tool.monthlyRate;
  document.getElementById('tool-quantity').value = tool.quantity;
  document.getElementById('tool-status').value = tool.status;
  document.getElementById('tool-sku').value = tool.sku || '';
  document.getElementById('tool-purchase-cost').value = tool.purchaseCost || '';
  document.getElementById('tool-purchase-date').value = tool.purchaseDate || '';

  if (tool.image) {
    document.getElementById('image-preview').src = tool.image;
    document.getElementById('image-preview').style.display = 'block';
    document.getElementById('image-upload-placeholder').style.display = 'none';
  } else {
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-upload-placeholder').style.display = 'block';
  }

  document.getElementById('tool-modal').classList.add('active');
}

function deleteTool(id) {
  const tool = tools.find(t => t.id === id);
  if (!tool) return;

  if (confirm(`Are you sure you want to delete "${tool.name}"?`)) {
    tools = tools.filter(t => t.id !== id);
    renderToolsTable();
    showToast('Tool deleted successfully', 'success');
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.match('image/(jpeg|jpg|png)')) {
    showToast('Please upload a JPG or PNG image', 'error');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showToast('Image size must be less than 2MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    currentToolImage = e.target.result;
    document.getElementById('image-preview').src = currentToolImage;
    document.getElementById('image-preview').style.display = 'block';
    document.getElementById('image-upload-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function saveTool(event) {
  event.preventDefault();
  
  const toolData = {
    name: document.getElementById('tool-name').value,
    category: document.getElementById('tool-category').value,
    description: document.getElementById('tool-description').value,
    dailyRate: parseFloat(document.getElementById('tool-daily-rate').value),
    weeklyRate: parseFloat(document.getElementById('tool-weekly-rate').value),
    monthlyRate: parseFloat(document.getElementById('tool-monthly-rate').value),
    quantity: parseInt(document.getElementById('tool-quantity').value),
    status: document.getElementById('tool-status').value,
    sku: document.getElementById('tool-sku').value,
    purchaseCost: parseFloat(document.getElementById('tool-purchase-cost').value) || 0,
    purchaseDate: document.getElementById('tool-purchase-date').value,
    image: currentToolImage
  };

  if (editingToolId) {
    const tool = tools.find(t => t.id === editingToolId);
    if (tool) {
      Object.assign(tool, toolData);
      showToast('Tool updated successfully', 'success');
    }
  } else {
    tools.push({
      id: nextToolId++,
      ...toolData,
      available: toolData.quantity
    });
    showToast('Tool added successfully', 'success');
  }

  closeToolModal();
  renderToolsTable();
}

// Rentals Management
function renderRentalsTab() {
  renderActiveRentals();
  renderRentalHistory();
}

function renderActiveRentals() {
  const tbody = document.getElementById('active-rentals-body');
  const activeRentals = rentals.filter(r => r.status === 'Active');

  if (activeRentals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary);">No active rentals</td></tr>';
    return;
  }

  tbody.innerHTML = activeRentals.map(rental => `
    <tr>
      <td>${rental.customerName}</td>
      <td>${rental.toolName}</td>
      <td>${rental.startDate}</td>
      <td>${rental.endDate}</td>
      <td>$${rental.cost}</td>
      <td><span class="status status--success">Active</span></td>
      <td>
        <button class="btn btn--sm btn--outline" onclick="markAsReturned(${rental.id})">Mark Returned</button>
      </td>
    </tr>
  `).join('');
}

function renderRentalHistory() {
  const tbody = document.getElementById('rental-history-body');
  const historyRentals = rentals.filter(r => r.status === 'Returned');

  if (historyRentals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-secondary);">No rental history</td></tr>';
    return;
  }

  tbody.innerHTML = historyRentals.map(rental => `
    <tr>
      <td>${rental.customerName}</td>
      <td>${rental.toolName}</td>
      <td>${rental.startDate}</td>
      <td>${rental.returnDate || rental.endDate}</td>
      <td>$${rental.cost}</td>
      <td><span class="status status--info">Returned</span></td>
    </tr>
  `).join('');
}

function openRentalModal() {
  document.getElementById('rental-form').reset();
  populateCustomerDropdown();
  populateToolDropdown();
  
  // Set today as default start date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rental-start-date').value = today;
  document.getElementById('rental-start-date').min = today;
  
  updateRentalEndDate();
  document.getElementById('rental-modal').classList.add('active');
}

function closeRentalModal() {
  document.getElementById('rental-modal').classList.remove('active');
}

function populateCustomerDropdown() {
  const select = document.getElementById('rental-customer');
  select.innerHTML = '<option value="">Select Customer</option>' +
    customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function populateToolDropdown() {
  const select = document.getElementById('rental-tool');
  const availableTools = tools.filter(t => t.available > 0 && t.status === 'Available');
  select.innerHTML = '<option value="">Select Tool</option>' +
    availableTools.map(t => `<option value="${t.id}" data-daily="${t.dailyRate}" data-weekly="${t.weeklyRate}" data-monthly="${t.monthlyRate}">${t.name} (${t.available} available)</option>`).join('');
}

function updateRentalPrice() {
  const toolSelect = document.getElementById('rental-tool');
  const period = document.getElementById('rental-period').value;
  const selectedOption = toolSelect.options[toolSelect.selectedIndex];
  
  if (!selectedOption || !selectedOption.value) {
    document.getElementById('rental-price-display').textContent = '$0.00';
    return;
  }

  let price = 0;
  if (period === 'daily') price = parseFloat(selectedOption.dataset.daily);
  if (period === 'weekly') price = parseFloat(selectedOption.dataset.weekly);
  if (period === 'monthly') price = parseFloat(selectedOption.dataset.monthly);

  document.getElementById('rental-price-display').textContent = `$${price.toFixed(2)}`;
}

function updateRentalEndDate() {
  const startDate = document.getElementById('rental-start-date').value;
  const period = document.getElementById('rental-period').value;
  
  if (!startDate) return;
  
  const start = new Date(startDate);
  let end = new Date(start);
  
  if (period === 'daily') end.setDate(end.getDate() + 1);
  if (period === 'weekly') end.setDate(end.getDate() + 7);
  if (period === 'monthly') end.setMonth(end.getMonth() + 1);
  
  document.getElementById('rental-end-date').value = end.toISOString().split('T')[0];
  document.getElementById('rental-end-date').min = startDate;
  updateRentalPrice();
}

function saveRental(event) {
  event.preventDefault();
  
  const customerId = parseInt(document.getElementById('rental-customer').value);
  const toolId = parseInt(document.getElementById('rental-tool').value);
  const customer = customers.find(c => c.id === customerId);
  const tool = tools.find(t => t.id === toolId);
  
  if (!customer || !tool) return;
  
  const period = document.getElementById('rental-period').value;
  let cost = tool.dailyRate;
  if (period === 'weekly') cost = tool.weeklyRate;
  if (period === 'monthly') cost = tool.monthlyRate;
  
  const rental = {
    id: nextRentalId++,
    customerId: customer.id,
    customerName: customer.name,
    toolId: tool.id,
    toolName: tool.name,
    startDate: document.getElementById('rental-start-date').value,
    endDate: document.getElementById('rental-end-date').value,
    period: period,
    cost: cost,
    deposit: parseFloat(document.getElementById('rental-deposit').value) || 0,
    payment: document.getElementById('rental-payment').value,
    notes: document.getElementById('rental-notes').value,
    status: 'Active'
  };
  
  rentals.push(rental);
  
  // Update tool availability
  tool.available--;
  
  // Update customer stats
  customer.totalRentals++;
  customer.totalSpent += cost;
  customer.lastRental = rental.startDate;
  
  closeRentalModal();
  renderRentalsTab();
  showToast('Rental created successfully', 'success');
}

function markAsReturned(rentalId) {
  const rental = rentals.find(r => r.id === rentalId);
  if (!rental) return;
  
  if (confirm(`Mark rental as returned for ${rental.customerName}?`)) {
    rental.status = 'Returned';
    rental.returnDate = new Date().toISOString().split('T')[0];
    
    // Update tool availability
    const tool = tools.find(t => t.id === rental.toolId);
    if (tool) tool.available++;
    
    renderRentalsTab();
    showToast('Rental marked as returned', 'success');
  }
}

// Customers Management
function renderCustomersTable() {
  const tbody = document.getElementById('customers-table-body');
  
  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary);">No customers found</td></tr>';
    return;
  }

  tbody.innerHTML = customers.map(customer => `
    <tr>
      <td><strong>${customer.name}</strong></td>
      <td>${customer.email}</td>
      <td>${customer.phone}</td>
      <td>${customer.totalRentals}</td>
      <td>$${customer.totalSpent}</td>
      <td>${customer.lastRental || 'N/A'}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn" onclick="editCustomer(${customer.id})" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete" onclick="deleteCustomer(${customer.id})" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCustomerModal() {
  editingCustomerId = null;
  document.getElementById('customer-modal-title').textContent = 'Add New Customer';
  document.getElementById('customer-form').reset();
  document.getElementById('customer-id').value = '';
  document.getElementById('customer-modal').classList.add('active');
}

function closeCustomerModal() {
  document.getElementById('customer-modal').classList.remove('active');
}

function editCustomer(id) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;

  editingCustomerId = id;
  document.getElementById('customer-modal-title').textContent = 'Edit Customer';
  document.getElementById('customer-id').value = customer.id;
  document.getElementById('customer-name').value = customer.name;
  document.getElementById('customer-email').value = customer.email;
  document.getElementById('customer-phone').value = customer.phone;
  document.getElementById('customer-address').value = customer.address || '';
  document.getElementById('customer-license').value = customer.license || '';
  document.getElementById('customer-emergency').value = customer.emergency || '';
  document.getElementById('customer-notes').value = customer.notes || '';
  document.getElementById('customer-modal').classList.add('active');
}

function deleteCustomer(id) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;

  if (confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
    customers = customers.filter(c => c.id !== id);
    renderCustomersTable();
    showToast('Customer deleted successfully', 'success');
  }
}

function saveCustomer(event) {
  event.preventDefault();
  
  const customerData = {
    name: document.getElementById('customer-name').value,
    email: document.getElementById('customer-email').value,
    phone: document.getElementById('customer-phone').value,
    address: document.getElementById('customer-address').value,
    license: document.getElementById('customer-license').value,
    emergency: document.getElementById('customer-emergency').value,
    notes: document.getElementById('customer-notes').value
  };

  if (editingCustomerId) {
    const customer = customers.find(c => c.id === editingCustomerId);
    if (customer) {
      Object.assign(customer, customerData);
      showToast('Customer updated successfully', 'success');
    }
  } else {
    customers.push({
      id: nextCustomerId++,
      ...customerData,
      totalRentals: 0,
      totalSpent: 0,
      lastRental: null
    });
    showToast('Customer added successfully', 'success');
  }

  closeCustomerModal();
  renderCustomersTable();
}

// Reports
function renderReports() {
  const totalTools = tools.length;
  const totalInvestment = tools.reduce((sum, t) => sum + (t.purchaseCost * t.quantity), 0);
  const totalRevenue = rentals.reduce((sum, r) => sum + r.cost, 0);
  const totalCustomers = customers.length;

  document.getElementById('report-total-tools').textContent = totalTools;
  document.getElementById('report-investment').textContent = `$${totalInvestment}`;
  document.getElementById('report-revenue').textContent = `$${totalRevenue}`;
  document.getElementById('report-customers').textContent = totalCustomers;

  renderPopularTools();
}

function renderPopularTools() {
  const container = document.getElementById('popular-tools-list');
  
  // Count rentals per tool
  const toolRentals = {};
  rentals.forEach(rental => {
    toolRentals[rental.toolName] = (toolRentals[rental.toolName] || 0) + 1;
  });

  const sorted = Object.entries(toolRentals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<p style="color: var(--color-text-secondary);">No rental data yet</p>';
    return;
  }

  container.innerHTML = sorted.map(([name, count]) => `
    <div class="popular-tool-item">
      <span>${name}</span>
      <span><strong>${count}</strong> rentals</span>
    </div>
  `).join('');
}

// Export functions
function exportTools() {
  const csv = convertToCSV(tools, ['id', 'name', 'category', 'dailyRate', 'weeklyRate', 'monthlyRate', 'quantity', 'available', 'status', 'sku']);
  downloadCSV(csv, 'tools-inventory.csv');
  showToast('Tools inventory exported', 'success');
}

function exportCustomers() {
  const csv = convertToCSV(customers, ['id', 'name', 'email', 'phone', 'address', 'license', 'totalRentals', 'totalSpent']);
  downloadCSV(csv, 'customers.csv');
  showToast('Customers exported', 'success');
}

function exportRentals() {
  const csv = convertToCSV(rentals, ['id', 'customerName', 'toolName', 'startDate', 'endDate', 'period', 'cost', 'deposit', 'status']);
  downloadCSV(csv, 'rental-history.csv');
  showToast('Rental history exported', 'success');
}

function convertToCSV(data, fields) {
  const header = fields.join(',');
  const rows = data.map(item => 
    fields.map(field => {
      const value = item[field] || '';
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Hosting guide modal
function showHostingGuide() {
  document.getElementById('hosting-modal').classList.add('active');
}

function closeHostingModal() {
  document.getElementById('hosting-modal').classList.remove('active');
}

// Toast notifications
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show';
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Customer Website Functions
function renderToolsCatalog(category = 'all', search = '') {
  const grid = document.getElementById('tools-grid');
  let filteredTools = tools;
  
  // Apply category filter
  if (category !== 'all') {
    filteredTools = filteredTools.filter(t => t.category === category);
  }
  
  // Apply search filter
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    filteredTools = filteredTools.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.category.toLowerCase().includes(searchLower) ||
      (t.description && t.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Update search results count
  const resultsCount = document.getElementById('search-results-count');
  if (search.trim()) {
    resultsCount.style.display = 'block';
    if (filteredTools.length === 0) {
      resultsCount.innerHTML = `No tools found matching "<strong>${search}</strong>"`;
    } else {
      resultsCount.innerHTML = `Found <strong>${filteredTools.length}</strong> tool${filteredTools.length !== 1 ? 's' : ''} matching "<strong>${search}</strong>"`;
    }
  } else {
    resultsCount.style.display = 'none';
  }
  
  if (filteredTools.length === 0) {
    const message = search.trim() 
      ? `<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-secondary); padding: 40px;">No tools found matching "${search}". Try a different search term.</p>`
      : '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-secondary); padding: 40px;">No tools available in this category</p>';
    grid.innerHTML = message;
    return;
  }
  
  grid.innerHTML = filteredTools.map(tool => `
    <div class="tool-card" data-category="${tool.category}">
      <div class="tool-card-image">
        ${tool.image ? `<img src="${tool.image}" alt="${tool.name}">` : `
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
        `}
      </div>
      <div class="tool-card-category">${tool.category}</div>
      <h3 class="tool-card-title">${tool.name}</h3>
      <p class="tool-card-description">${tool.description}</p>
      <div class="tool-card-pricing">
        <div class="price-option">
          <span class="price-label">Daily</span>
          <span class="price-value">$${tool.dailyRate}</span>
        </div>
        <div class="price-option">
          <span class="price-label">Weekly</span>
          <span class="price-value">$${tool.weeklyRate}</span>
        </div>
        <div class="price-option">
          <span class="price-label">Monthly</span>
          <span class="price-value">$${tool.monthlyRate}</span>
        </div>
      </div>
      <div class="tool-card-footer">
        <div class="tool-availability">
          ${tool.available > 0 ? 
            `<span class="status status--success">Available (${tool.available})</span>` : 
            `<span class="status status--error">Unavailable</span>`
          }
        </div>
        <button class="btn btn--primary btn--sm" 
          onclick="addToCart(${tool.id})" 
          ${tool.available === 0 ? 'disabled' : ''}>
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

function filterByCategory(category) {
  currentCategory = category;
  
  // Update active tab
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.category === category) {
      tab.classList.add('active');
    }
  });
  
  renderToolsCatalog(category, searchQuery);
}

// Search functionality
function handleSearch(query) {
  searchQuery = query;
  
  // Show/hide clear button
  const clearBtn = document.getElementById('search-clear');
  if (query.trim()) {
    clearBtn.style.display = 'flex';
  } else {
    clearBtn.style.display = 'none';
  }
  
  // Debounce search for performance
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    renderToolsCatalog(currentCategory, query);
  }, 300);
}

function clearSearch() {
  searchQuery = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear').style.display = 'none';
  document.getElementById('search-results-count').style.display = 'none';
  renderToolsCatalog(currentCategory, '');
}

function scrollToCatalog() {
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
}

function showAdminLogin() {
  showPage('login');
}

// Shopping Cart Functions
function addToCart(toolId) {
  const tool = tools.find(t => t.id === toolId);
  if (!tool || tool.available === 0) return;
  
  // Check if already in cart
  const existingItem = shoppingCart.find(item => item.toolId === toolId);
  if (existingItem) {
    showToast('This tool is already in your cart', 'info');
    toggleCart();
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  shoppingCart.push({
    toolId: tool.id,
    toolName: tool.name,
    period: 'daily',
    dailyRate: tool.dailyRate,
    weeklyRate: tool.weeklyRate,
    monthlyRate: tool.monthlyRate,
    startDate: today,
    endDate: tomorrow.toISOString().split('T')[0],
    price: tool.dailyRate,
    deposit: tool.weeklyRate * 0.5
  });
  
  updateCartDisplay();
  showToast(`${tool.name} added to cart!`, 'success');
  toggleCart();
}

function removeFromCart(toolId) {
  shoppingCart = shoppingCart.filter(item => item.toolId !== toolId);
  updateCartDisplay();
  showToast('Item removed from cart', 'info');
}

function clearCart() {
  if (shoppingCart.length === 0) return;
  
  if (confirm('Clear all items from cart?')) {
    shoppingCart = [];
    updateCartDisplay();
    showToast('Cart cleared', 'info');
  }
}

function updateCartPeriod(toolId, period) {
  const item = shoppingCart.find(i => i.toolId === toolId);
  if (!item) return;
  
  item.period = period;
  
  // Update price based on period
  if (period === 'daily') item.price = item.dailyRate;
  if (period === 'weekly') item.price = item.weeklyRate;
  if (period === 'monthly') item.price = item.monthlyRate;
  
  // Update end date
  const start = new Date(item.startDate);
  let end = new Date(start);
  if (period === 'daily') end.setDate(end.getDate() + 1);
  if (period === 'weekly') end.setDate(end.getDate() + 7);
  if (period === 'monthly') end.setMonth(end.getMonth() + 1);
  item.endDate = end.toISOString().split('T')[0];
  
  updateCartDisplay();
}

function updateCartStartDate(toolId, date) {
  const item = shoppingCart.find(i => i.toolId === toolId);
  if (!item) return;
  
  item.startDate = date;
  
  // Update end date
  const start = new Date(date);
  let end = new Date(start);
  if (item.period === 'daily') end.setDate(end.getDate() + 1);
  if (item.period === 'weekly') end.setDate(end.getDate() + 7);
  if (item.period === 'monthly') end.setMonth(end.getMonth() + 1);
  item.endDate = end.toISOString().split('T')[0];
  
  updateCartDisplay();
}

function updateCartDisplay() {
  const cartItemsDiv = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const checkoutBtn = document.getElementById('checkout-btn');
  
  cartCount.textContent = shoppingCart.length;
  
  if (shoppingCart.length === 0) {
    cartItemsDiv.innerHTML = '<div class="cart-empty"><p>Your cart is empty</p><p style="font-size: 12px; margin-top: 8px;">Browse our catalog and add tools to get started!</p></div>';
    checkoutBtn.disabled = true;
    document.getElementById('cart-subtotal').textContent = '$0.00';
    document.getElementById('cart-deposits').textContent = '$0.00';
    document.getElementById('cart-gst').textContent = '$0.00';
    document.getElementById('cart-total').textContent = '$0.00';
    return;
  }
  
  checkoutBtn.disabled = false;
  
  const today = new Date().toISOString().split('T')[0];
  
  cartItemsDiv.innerHTML = shoppingCart.map(item => `
    <div class="cart-item">
      <div class="cart-item-header">
        <div class="cart-item-title">${item.toolName}</div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.toolId})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="cart-item-body">
        <div class="cart-item-row">
          <label style="font-size: 12px; color: var(--color-text-secondary);">Rental Period</label>
          <select class="form-control" style="padding: 4px 8px; font-size: 12px; width: auto;" onchange="updateCartPeriod(${item.toolId}, this.value)">
            <option value="daily" ${item.period === 'daily' ? 'selected' : ''}>Daily - $${item.dailyRate}</option>
            <option value="weekly" ${item.period === 'weekly' ? 'selected' : ''}>Weekly - $${item.weeklyRate}</option>
            <option value="monthly" ${item.period === 'monthly' ? 'selected' : ''}>Monthly - $${item.monthlyRate}</option>
          </select>
        </div>
        <div class="cart-item-row">
          <label style="font-size: 12px; color: var(--color-text-secondary);">Start Date</label>
          <input type="date" class="form-control" style="padding: 4px 8px; font-size: 12px; width: auto;" value="${item.startDate}" min="${today}" onchange="updateCartStartDate(${item.toolId}, this.value)">
        </div>
        <div class="cart-item-row">
          <span style="font-size: 12px; color: var(--color-text-secondary);">Return Date:</span>
          <span style="font-size: 12px;">${item.endDate}</span>
        </div>
        <div class="cart-item-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border);">
          <span style="font-weight: 600;">Rental:</span>
          <span style="font-weight: 600;">$${item.price.toFixed(2)}</span>
        </div>
        <div class="cart-item-row">
          <span style="font-size: 12px; color: var(--color-text-secondary);">Deposit (50%):</span>
          <span style="font-size: 12px;">$${item.deposit.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  // Calculate totals
  const subtotal = shoppingCart.reduce((sum, item) => sum + item.price, 0);
  const deposits = shoppingCart.reduce((sum, item) => sum + item.deposit, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + deposits + gst;
  
  document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('cart-deposits').textContent = `$${deposits.toFixed(2)}`;
  document.getElementById('cart-gst').textContent = `$${gst.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  sidebar.classList.toggle('open');
}

// Coming Soon Modal
function showComingSoonModal() {
  if (shoppingCart.length === 0) return;
  document.getElementById('coming-soon-modal').classList.add('active');
  toggleCart();
}

function closeComingSoonModal() {
  document.getElementById('coming-soon-modal').classList.remove('active');
}

function requestQuote() {
  const items = shoppingCart.map(item => 
    `${item.toolName} (${item.period} rental: ${item.startDate} to ${item.endDate}) - $${item.price.toFixed(2)}`
  ).join('%0D%0A');
  
  const subtotal = shoppingCart.reduce((sum, item) => sum + item.price, 0);
  const deposits = shoppingCart.reduce((sum, item) => sum + item.deposit, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + deposits + gst;
  
  const subject = 'Rental Quote Request - Lytton Tool Rentals';
  const body = `Hello,%0D%0A%0D%0AI would like to request a quote for the following rental:%0D%0A%0D%0A${items}%0D%0A%0D%0ASubtotal: $${subtotal.toFixed(2)}%0D%0ADeposits: $${deposits.toFixed(2)}%0D%0AGST (5%%): $${gst.toFixed(2)}%0D%0ATotal: $${total.toFixed(2)}%0D%0A%0D%0APlease contact me to complete this rental.%0D%0A%0D%0AThank you!`;
  
  window.open(`mailto:rentals@lyttontoolrentals.ca?subject=${subject}&body=${body}`, '_blank');
  closeComingSoonModal();
}

// Checkout Functions
function proceedToCheckout() {
  if (shoppingCart.length === 0) return;
  
  // Populate checkout summary
  const checkoutItems = document.getElementById('checkout-items');
  checkoutItems.innerHTML = shoppingCart.map(item => `
    <div class="checkout-item">
      <strong>${item.toolName}</strong><br>
      ${item.period.charAt(0).toUpperCase() + item.period.slice(1)} rental: ${item.startDate} to ${item.endDate}<br>
      Rental: $${item.price.toFixed(2)} | Deposit: $${item.deposit.toFixed(2)}
    </div>
  `).join('');
  
  const subtotal = shoppingCart.reduce((sum, item) => sum + item.price, 0);
  const deposits = shoppingCart.reduce((sum, item) => sum + item.deposit, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + deposits + gst;
  
  document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('checkout-deposits').textContent = `$${deposits.toFixed(2)}`;
  document.getElementById('checkout-gst').textContent = `$${gst.toFixed(2)}`;
  document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
  
  document.getElementById('checkout-modal').classList.add('active');
  toggleCart();
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('active');
  document.getElementById('payment-form').reset();
}

function processPayment(event) {
  event.preventDefault();
  
  const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
  const payButton = document.getElementById('pay-button');
  
  // Validate demo card
  if (cardNumber !== '4242424242424242') {
    showToast('Please use demo card: 4242 4242 4242 4242', 'error');
    return;
  }
  
  payButton.textContent = 'Processing...';
  payButton.disabled = true;
  
  // Simulate payment processing
  setTimeout(() => {
    // Generate transaction ID
    const transactionId = 'ch_' + Math.random().toString(36).substring(2, 15).toUpperCase();
    
    // Get customer info
    const customerName = document.getElementById('checkout-name').value;
    const customerEmail = document.getElementById('checkout-email').value;
    const customerPhone = document.getElementById('checkout-phone').value;
    
    // Find or create customer
    let customer = customers.find(c => c.email === customerEmail);
    if (!customer) {
      customer = {
        id: nextCustomerId++,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: '',
        license: '',
        emergency: '',
        notes: 'Online customer',
        totalRentals: 0,
        totalSpent: 0,
        lastRental: null
      };
      customers.push(customer);
    }
    
    // Create rentals for each cart item
    shoppingCart.forEach(item => {
      const rental = {
        id: nextRentalId++,
        customerId: customer.id,
        customerName: customer.name,
        toolId: item.toolId,
        toolName: item.toolName,
        startDate: item.startDate,
        endDate: item.endDate,
        period: item.period,
        cost: item.price,
        deposit: item.deposit,
        payment: 'Credit Card',
        notes: 'Online booking',
        status: 'Active',
        transactionId: transactionId
      };
      
      rentals.push(rental);
      
      // Update tool availability
      const tool = tools.find(t => t.id === item.toolId);
      if (tool) tool.available--;
      
      // Update customer stats
      customer.totalRentals++;
      customer.totalSpent += item.price;
      customer.lastRental = item.startDate;
    });
    
    const bookingRef = 'LTR' + Date.now().toString().slice(-8);
    
    closeCheckout();
    shoppingCart = [];
    updateCartDisplay();
    
    // Show success message
    showToast('Payment successful! Booking confirmed.', 'success');
    
    // Show confirmation
    alert(`🎉 Booking Confirmed!\n\nBooking Reference: ${bookingRef}\nTransaction ID: ${transactionId}\n\nA confirmation email has been sent to ${customerEmail}.\n\nThank you for choosing Lytton Tool Rentals!`);
    
    payButton.textContent = 'Process Payment';
    payButton.disabled = false;
    
  }, 2000);
}

// Format card number input
document.addEventListener('DOMContentLoaded', () => {
  const cardNumberInput = document.getElementById('card-number');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\s/g, '');
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formattedValue;
    });
  }
  
  const cardExpiryInput = document.getElementById('card-expiry');
  if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      e.target.value = value;
    });
  }
});

// Initialize app
function initApp() {
  initializeSampleData();
  showPage('customer');
  renderToolsCatalog(currentCategory, searchQuery);
  updateCartDisplay();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}