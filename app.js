// Admin credentials (SECURE - change after first login)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'LyttonTools2025!';

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
let currentCustomerUser = null;
let customerAccounts = [];
let nextCustomerAccountId = 1;
let currentTheme = 'classic';
let chatbotOpen = false;
let chatMessages = [];
let soundEnabled = true;

// Gamification Data
const TIERS = [
  { name: 'Bronze', icon: '🥉', minRentals: 0, maxRentals: 5, discount: 10 },
  { name: 'Silver', icon: '🥈', minRentals: 6, maxRentals: 15, discount: 15 },
  { name: 'Gold', icon: '🥇', minRentals: 16, maxRentals: 30, discount: 20 },
  { name: 'Platinum', icon: '💎', minRentals: 31, maxRentals: 50, discount: 25 },
  { name: 'Legend', icon: '👑', minRentals: 51, maxRentals: Infinity, discount: 30 }
];

const ACHIEVEMENTS = [
  { id: 'first_timer', name: 'First Timer', desc: 'Complete your first rental', icon: '🏆', points: 100, condition: (user) => user.totalRentals >= 1 },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Same-day pickup', icon: '⚡', points: 250, condition: (user) => user.achievements?.includes('speed_demon') },
  { id: 'power_user', name: 'Power User', desc: 'Rent 3+ tools at once', icon: '🌟', points: 300, condition: (user) => false },
  { id: 'early_bird', name: 'Early Bird', desc: 'Return before due date 5x', icon: '📅', points: 200, condition: (user) => false },
  { id: 'reviewer', name: 'Reviewer', desc: 'Leave 10 reviews', icon: '💬', points: 500, condition: (user) => false },
  { id: 'sharpshooter', name: 'Sharpshooter', desc: 'Perfect account', icon: '🎯', points: 1000, condition: (user) => user.totalRentals >= 10 },
  { id: 'builder', name: 'Builder', desc: 'Complete 10 weekend projects', icon: '🏗️', points: 400, condition: (user) => false },
  { id: 'lumberjack', name: 'Lumberjack', desc: 'Rent chainsaw 5 times', icon: '🌲', points: 350, condition: (user) => false },
  { id: 'heavy_lifter', name: 'Heavy Lifter', desc: 'Rent equipment >$100/day 10x', icon: '💪', points: 600, condition: (user) => false },
  { id: 'perfectionist', name: 'Perfectionist', desc: 'Always return tools clean', icon: '🎨', points: 800, condition: (user) => false }
];

// AI Chatbot Responses
const CHATBOT_RESPONSES = {
  greeting: [
    "Hi! I'm ToolBot, your AI rental assistant! 🤖 What are you building today?",
    "Hey there! Need help finding the perfect tool? I'm here to help!",
    "Welcome! I can suggest tools, answer questions, or help you book. What do you need?"
  ],
  deck: [
    "Building a deck? Awesome! You'll need:\n\n🔨 Circular Saw - for cutting boards\n🔩 Drill Set - for screws\n📏 Power Sander - for smooth finish\n\nWant me to add the 'Deck Builder Bundle' to your cart?"
  ],
  lawn: [
    "Lawn care time! Here's what I recommend:\n\n🌿 Lawn Mower - for cutting\n✂️ String Trimmer - for edges\n🍃 Leaf Blower - for cleanup\n\nShall I show you our Garden Tools category?"
  ],
  paint: [
    "Painting project! You'll want:\n\n🎨 Paint Sprayer - professional finish\n📐 Ladder - reach high spots\n🧽 Pressure Washer - prep surfaces\n\nLet me know if you need any of these!"
  ],
  default: [
    "I'm here to help! Try asking me about:\n\n• 'I need to build a deck'\n• 'Show me power tools'\n• 'What's available today?'\n• 'How does rental work?'",
    "Great question! I can help you find tools, check availability, or explain our rental process. What would you like to know?"
  ]
};

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

  // Sample customer accounts (for demo)
  customerAccounts = [
    { 
      id: 1, 
      name: 'John Thompson', 
      email: 'john@email.com', 
      password: 'Test123!',
      phone: '250-555-0123',
      address: '123 Main St, Lytton BC',
      license: 'BC123456',
      joinDate: '2025-09-15',
      favorites: [],
      authMethod: 'email'
    },
    { 
      id: 2, 
      name: 'Sarah Martinez', 
      email: 'sarah@contractor.ca', 
      password: 'Build456!',
      phone: '250-555-0456',
      address: '456 Fraser Ave, Lytton BC',
      license: 'BC789012',
      joinDate: '2025-08-01',
      favorites: [1, 2],
      authMethod: 'email'
    }
  ];
  nextCustomerAccountId = 3;
  
  // Initialize gamification for sample accounts
  customerAccounts.forEach(account => {
    account.points = account.id === 1 ? 500 : 1200;
    account.achievements = account.id === 1 ? ['first_timer'] : ['first_timer', 'power_user'];
    account.totalRentals = account.id === 1 ? 5 : 12;
    account.co2Saved = account.totalRentals * 9.5;
    account.treesEquivalent = Math.floor(account.co2Saved / 48);
  });
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
  `;
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
        text: rental.customerName + ' - ' + rental.toolName + ' (Due: ' + rental.endDate + ')'
      });
    }
  });

  // Check for low stock
  tools.forEach(tool => {
    if (tool.available === 0 && tool.quantity > 0) {
      alerts.push({
        title: '📦 Out of Stock',
        text: tool.name + ' - All units currently rented'
      });
    }
  });

  if (alerts.length === 0) {
    container.innerHTML = '<div class="alert-item"><div class="alert-item-title">✅ All Good!</div><div class="alert-item-text">No alerts at this time</div></div>';
    return;
  }

  container.innerHTML = alerts.map(alert => 
    '<div class="alert-item">' +
      '<div class="alert-item-title">' + alert.title + '</div>' +
      '<div class="alert-item-text">' + alert.text + '</div>' +
    '</div>'
  ).join('');
}

// Tools Management
function renderToolsTable() {
  const tbody = document.getElementById('tools-table-body');
  
  if (tools.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--color-text-secondary);">No tools found. Click "Add New Tool" to get started.</td></tr>';
    return;
  }

  tbody.innerHTML = tools.map(tool => {
    const imageHtml = tool.image ? '<img src="' + tool.image + '" alt="' + tool.name + '">' : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>';
    const statusClass = tool.status === 'Available' ? 'success' : 'warning';
    
    return '<tr>' +
      '<td><div class="tool-thumbnail">' + imageHtml + '</div></td>' +
      '<td><strong>' + tool.name + '</strong></td>' +
      '<td>' + tool.category + '</td>' +
      '<td>$' + tool.dailyRate + '</td>' +
      '<td>$' + tool.weeklyRate + '</td>' +
      '<td>$' + tool.monthlyRate + '</td>' +
      '<td>' + tool.available + '/' + tool.quantity + '</td>' +
      '<td><span class="status status--' + statusClass + '">' + tool.status + '</span></td>' +
      '<td>' +
        '<div class="action-buttons">' +
          '<button class="action-btn" onclick="editTool(' + tool.id + ')" title="Edit">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
              '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
            '</svg>' +
          '</button>' +
          '<button class="action-btn delete" onclick="deleteTool(' + tool.id + ')" title="Delete">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<polyline points="3 6 5 6 21 6"></polyline>' +
              '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
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

  if (confirm('Are you sure you want to delete "' + tool.name + '"?')) {
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

  tbody.innerHTML = activeRentals.map(rental => 
    '<tr>' +
      '<td>' + rental.customerName + '</td>' +
      '<td>' + rental.toolName + '</td>' +
      '<td>' + rental.startDate + '</td>' +
      '<td>' + rental.endDate + '</td>' +
      '<td>$' + rental.cost + '</td>' +
      '<td><span class="status status--success">Active</span></td>' +
      '<td>' +
        '<button class="btn btn--sm btn--outline" onclick="markAsReturned(' + rental.id + ')">Mark Returned</button>' +
      '</td>' +
    '</tr>'
  ).join('');
}

function renderRentalHistory() {
  const tbody = document.getElementById('rental-history-body');
  const historyRentals = rentals.filter(r => r.status === 'Returned');

  if (historyRentals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-secondary);">No rental history</td></tr>';
    return;
  }

  tbody.innerHTML = historyRentals.map(rental => 
    '<tr>' +
      '<td>' + rental.customerName + '</td>' +
      '<td>' + rental.toolName + '</td>' +
      '<td>' + rental.startDate + '</td>' +
      '<td>' + (rental.returnDate || rental.endDate) + '</td>' +
      '<td>$' + rental.cost + '</td>' +
      '<td><span class="status status--info">Returned</span></td>' +
    '</tr>'
  ).join('');
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
    customers.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
}

function populateToolDropdown() {
  const select = document.getElementById('rental-tool');
  const availableTools = tools.filter(t => t.available > 0 && t.status === 'Available');
  select.innerHTML = '<option value="">Select Tool</option>' +
    availableTools.map(t => '<option value="' + t.id + '" data-daily="' + t.dailyRate + '" data-weekly="' + t.weeklyRate + '" data-monthly="' + t.monthlyRate + '">' + t.name + ' (' + t.available + ' available)</option>').join('');
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
  
  if (confirm('Mark rental as returned for ' + rental.customerName + '?')) {
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

  tbody.innerHTML = customers.map(customer => '<tr>' +
      '<td><strong>' + customer.name + '</strong></td>' +
      '<td>' + customer.email + '</td>' +
      '<td>' + customer.phone + '</td>' +
      '<td>' + customer.totalRentals + '</td>' +
      '<td>$' + customer.totalSpent + '</td>' +
      '<td>' + (customer.lastRental || 'N/A') + '</td>' +
      '<td>' +
        '<div class="action-buttons">' +
          '<button class="action-btn" onclick="editCustomer(' + customer.id + ')" title="Edit">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
              '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
            '</svg>' +
          '</button>' +
          '<button class="action-btn delete" onclick="deleteCustomer(' + customer.id + ')" title="Delete">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<polyline points="3 6 5 6 21 6"></polyline>' +
              '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</td>' +
    '</tr>').join('');
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
  
  // Mark some tools as trending
  const trendingIds = [1, 2, 5];
  
  // Apply category filter
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
  
  grid.innerHTML = filteredTools.map(tool => {
    const isFavorite = currentCustomerUser && currentCustomerUser.favorites.includes(tool.id);
    const isTrending = trendingIds.includes(tool.id);
    const trendingBadge = isTrending ? '<div style="position: absolute; top: 12px; left: 12px; background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%); color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; z-index: 10; box-shadow: 0 2px 8px rgba(255,75,87,0.4);">🔥 TRENDING</div>' : '';
    
    const heartButton = currentCustomerUser ? `
      <button onclick="toggleFavorite(${tool.id})" style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); border: none; color: ${isFavorite ? '#FFD700' : '#fff'}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite ? '#FFD700' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    ` : '';
    
    const imageHtml = tool.image ? `<img src="${tool.image}" alt="${tool.name}">` : `
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
    `;
    
    const availabilityHtml = tool.available > 0 ? 
      '<span class="status status--success">Available (' + tool.available + ')</span>' : 
      '<span class="status status--error">Unavailable</span>';
    const disabledAttr = tool.available === 0 ? ' disabled' : '';
    
    return '<div class="tool-card" data-category="' + tool.category + '" style="position: relative; animation: fadeIn 0.5s ease;">' +
      trendingBadge +
      heartButton +
      '<div class="tool-card-image">' + imageHtml + '</div>' +
      '<div class="tool-card-category">' + tool.category + '</div>' +
      '<h3 class="tool-card-title">' + tool.name + '</h3>' +
      '<p class="tool-card-description">' + tool.description + '</p>' +
      '<div class="tool-card-pricing">' +
        '<div class="price-option">' +
          '<span class="price-label">Daily</span>' +
          '<span class="price-value">$' + tool.dailyRate + '</span>' +
        '</div>' +
        '<div class="price-option">' +
          '<span class="price-label">Weekly</span>' +
          '<span class="price-value">$' + tool.weeklyRate + '</span>' +
        '</div>' +
        '<div class="price-option">' +
          '<span class="price-label">Monthly</span>' +
          '<span class="price-value">$' + tool.monthlyRate + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="tool-card-footer">' +
        '<div class="tool-availability">' + availabilityHtml + '</div>' +
        '<button class="btn btn--primary btn--sm" onclick="addToCart(' + tool.id + ')"' + disabledAttr + '>' +
          'Add to Cart' +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');
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
  // Check if current URL contains /admin or #admin
  window.location.hash = 'admin';
  showPage('login');
}

// Customer Authentication Functions
function showAuthModal(defaultTab = 'signin') {
  document.getElementById('auth-modal').classList.add('active');
  switchAuthTab(defaultTab);
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('active');
  document.getElementById('signin-form').reset();
  document.getElementById('signup-form').reset();
}

function switchAuthTab(tab) {
  // Update tabs
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-auth-tab="${tab}"]`).classList.add('active');
  
  // Update content
  document.querySelectorAll('.auth-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`${tab}-content`).classList.add('active');
}

function handleGoogleSignIn() {
  // Simulate Google OAuth
  showToast('Connecting to Google...', 'info');
  
  setTimeout(() => {
    // Simulate successful Google sign-in
    const googleUser = {
      id: nextCustomerAccountId++,
      name: 'Demo User (Google)',
      email: 'demo@gmail.com',
      phone: '',
      address: '',
      license: '',
      joinDate: new Date().toISOString().split('T')[0],
      favorites: [],
      authMethod: 'google'
    };
    
    // Check if user exists
    let existingUser = customerAccounts.find(u => u.email === googleUser.email);
    if (!existingUser) {
      customerAccounts.push(googleUser);
      existingUser = googleUser;
    }
    
    currentCustomerUser = existingUser;
    closeAuthModal();
    updateCustomerNav();
    showToast(`Welcome, ${currentCustomerUser.name}!`, 'success');
  }, 1500);
}

function handleSignIn(event) {
  event.preventDefault();
  
  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;
  const errorDiv = document.getElementById('signin-error');
  
  const user = customerAccounts.find(u => u.email === email && u.password === password);
  
  if (user) {
    currentCustomerUser = user;
    closeAuthModal();
    updateCustomerNav();
    showToast(`Welcome back, ${user.name}!`, 'success');
    errorDiv.style.display = 'none';
  } else {
    errorDiv.textContent = 'Invalid email or password';
    errorDiv.style.display = 'block';
  }
}

function handleSignUp(event) {
  event.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  const errorDiv = document.getElementById('signup-error');
  
  // Validation
  if (password !== confirmPassword) {
    errorDiv.textContent = 'Passwords do not match';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (password.length < 8) {
    errorDiv.textContent = 'Password must be at least 8 characters';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (!/\d/.test(password) || !/[!@#$%^&*]/.test(password)) {
    errorDiv.textContent = 'Password must contain a number and special character';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Check if email exists
  if (customerAccounts.find(u => u.email === email)) {
    errorDiv.textContent = 'Email already registered';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Create new account
  const newUser = {
    id: nextCustomerAccountId++,
    name: name,
    email: email,
    password: password,
    phone: '',
    address: '',
    license: '',
    joinDate: new Date().toISOString().split('T')[0],
    favorites: [],
    authMethod: 'email'
  };
  
  customerAccounts.push(newUser);
  currentCustomerUser = newUser;
  
  closeAuthModal();
  updateCustomerNav();
  showToast('Account created successfully!', 'success');
  
  // Show onboarding message
  setTimeout(() => {
    if (confirm('Complete your profile now? (Add phone, address, license info)')) {
      showCustomerDashboard('profile');
    }
  }, 500);
}

function updateCustomerNav() {
  const nav = document.querySelector('.customer-nav');
  const signInBtn = document.getElementById('customer-signin-btn');
  const accountMenu = document.getElementById('customer-account-menu');
  
  if (currentCustomerUser) {
    signInBtn.style.display = 'none';
    accountMenu.style.display = 'block';
    const firstName = currentCustomerUser.name.split(' ')[0];
    document.getElementById('customer-account-name').textContent = firstName;
    const accountName2 = document.getElementById('customer-account-name2');
    if (accountName2) accountName2.textContent = firstName;
  } else {
    signInBtn.style.display = 'block';
    accountMenu.style.display = 'none';
  }
}

function toggleAccountDropdown() {
  const dropdown = document.getElementById('account-dropdown');
  dropdown.classList.toggle('active');
}

function handleCustomerLogout() {
  if (confirm('Are you sure you want to sign out?')) {
    currentCustomerUser = null;
    updateCustomerNav();
    showToast('Signed out successfully', 'info');
    
    // Hide dropdown
    document.getElementById('account-dropdown').classList.remove('active');
    
    // If on dashboard, go back to catalog
    if (document.getElementById('customer-dashboard-page').classList.contains('active')) {
      showPage('customer');
    }
  }
}

function showCustomerDashboard(tab = 'overview') {
  if (!currentCustomerUser) {
    showAuthModal('signin');
    return;
  }
  
  showPage('customer-dashboard');
  switchCustomerDashboardTab(tab);
  renderCustomerDashboard();
  
  // Hide account dropdown
  document.getElementById('account-dropdown').classList.remove('active');
}

function switchCustomerDashboardTab(tab) {
  document.querySelectorAll('.customer-dashboard-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-dashboard-tab="${tab}"]`)?.classList.add('active');
  
  document.querySelectorAll('.customer-dashboard-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`customer-${tab}-content`)?.classList.add('active');
  
  // Render specific content
  if (tab === 'rentals') renderCustomerRentals();
  if (tab === 'favorites') renderCustomerFavorites();
  if (tab === 'profile') renderCustomerProfile();
}

function renderCustomerDashboard() {
  updateDashboardGamification();
  const userRentals = rentals.filter(r => {
    const customer = customers.find(c => c.email === currentCustomerUser.email);
    return customer && r.customerId === customer.id;
  });
  
  const activeRentals = userRentals.filter(r => r.status === 'Active').length;
  const totalRentals = userRentals.length;
  const totalSpent = userRentals.reduce((sum, r) => sum + r.cost, 0);
  
  document.getElementById('customer-welcome-name').textContent = currentCustomerUser.name;
  document.getElementById('customer-stat-active').textContent = activeRentals;
  document.getElementById('customer-stat-total').textContent = totalRentals;
  document.getElementById('customer-stat-spent').textContent = `$${totalSpent.toFixed(2)}`;
  document.getElementById('customer-stat-favorites').textContent = currentCustomerUser.favorites.length;
}

function renderCustomerRentals() {
  const container = document.getElementById('customer-rentals-list');
  const customer = customers.find(c => c.email === currentCustomerUser.email);
  
  if (!customer) {
    container.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 40px;">No customer record found.</p>';
    return;
  }
  
  const userRentals = rentals.filter(r => r.customerId === customer.id);
  
  if (userRentals.length === 0) {
    container.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 40px;">You haven\'t made any rentals yet. <a href="#" onclick="showPage(\'customer\'); return false;" style="color: #FFD700;">Browse our catalog</a> to get started!</p>';
    return;
  }
  
  container.innerHTML = userRentals.reverse().map(rental => `
    <div class="rental-card">
      <div class="rental-card-header">
        <div>
          <h4>${rental.toolName}</h4>
          <p style="font-size: 12px; color: var(--color-text-secondary); margin: 4px 0 0 0;">Rental #${rental.id}</p>
        </div>
        <span class="status status--${rental.status === 'Active' ? 'success' : 'info'}">${rental.status}</span>
      </div>
      <div class="rental-card-body">
        <div class="rental-detail"><strong>Period:</strong><span>${rental.period.charAt(0).toUpperCase() + rental.period.slice(1)}</span></div>
        <div class="rental-detail"><strong>Start Date:</strong><span>${rental.startDate}</span></div>
        <div class="rental-detail"><strong>Return Date:</strong><span>${rental.endDate}</span></div>
        <div class="rental-detail"><strong>Cost:</strong><span>$${rental.cost}</span></div>
        <div class="rental-detail"><strong>Deposit:</strong><span>$${rental.deposit}</span></div>
        <div class="rental-detail"><strong>Payment:</strong><span>${rental.payment}</span></div>
      </div>
    </div>
  `).join('');
}

function renderCustomerFavorites() {
  const container = document.getElementById('customer-favorites-list');
  
  if (currentCustomerUser.favorites.length === 0) {
    container.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 40px;">No favorites yet. <a href="#" onclick="showPage(\'customer\'); return false;" style="color: #FFD700;">Browse tools</a> and click the heart icon to save your favorites!</p>';
    return;
  }
  
  const favoriteTools = tools.filter(t => currentCustomerUser.favorites.includes(t.id));
  
  container.innerHTML = favoriteTools.map(tool => {
    const imageHtml = tool.image ? `<img src="${tool.image}" alt="${tool.name}">` : `
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
    `;
    
    return `
    <div class="tool-card" style="position: relative;">
      <button onclick="toggleFavorite(${tool.id})" style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); border: none; color: #FFD700; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
      <div class="tool-card-image">
        ${imageHtml}
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
      </div>
      <button class="btn btn--primary btn--sm btn--full-width" onclick="addToCart(${tool.id})" ${tool.available === 0 ? 'disabled' : ''}>
        ${tool.available > 0 ? 'Add to Cart' : 'Unavailable'}
      </button>
    </div>
    `;
  }).join('');
}

function renderCustomerProfile() {
  document.getElementById('profile-name').value = currentCustomerUser.name || '';
  document.getElementById('profile-email').value = currentCustomerUser.email || '';
  document.getElementById('profile-phone').value = currentCustomerUser.phone || '';
  document.getElementById('profile-address').value = currentCustomerUser.address || '';
  document.getElementById('profile-license').value = currentCustomerUser.license || '';
}

function saveCustomerProfile(event) {
  event.preventDefault();
  
  currentCustomerUser.name = document.getElementById('profile-name').value;
  currentCustomerUser.phone = document.getElementById('profile-phone').value;
  currentCustomerUser.address = document.getElementById('profile-address').value;
  currentCustomerUser.license = document.getElementById('profile-license').value;
  
  // Update in customer accounts
  const idx = customerAccounts.findIndex(u => u.id === currentCustomerUser.id);
  if (idx !== -1) {
    customerAccounts[idx] = currentCustomerUser;
  }
  
  // Also update in customers if exists
  const customer = customers.find(c => c.email === currentCustomerUser.email);
  if (customer) {
    customer.name = currentCustomerUser.name;
    customer.phone = currentCustomerUser.phone;
    customer.address = currentCustomerUser.address;
    customer.license = currentCustomerUser.license;
  }
  
  updateCustomerNav();
  showToast('Profile updated successfully!', 'success');
}

function toggleFavorite(toolId) {
  if (!currentCustomerUser) {
    showAuthModal('signin');
    return;
  }
  
  const idx = currentCustomerUser.favorites.indexOf(toolId);
  if (idx > -1) {
    currentCustomerUser.favorites.splice(idx, 1);
    showToast('Removed from favorites', 'info');
  } else {
    currentCustomerUser.favorites.push(toolId);
    showToast('Added to favorites!', 'success');
  }
  
  // Update in customerAccounts
  const userIdx = customerAccounts.findIndex(u => u.id === currentCustomerUser.id);
  if (userIdx !== -1) {
    customerAccounts[userIdx] = currentCustomerUser;
  }
  
  // Re-render if on favorites page
  if (document.getElementById('customer-favorites-content').classList.contains('active')) {
    renderCustomerFavorites();
  }
  
  renderCustomerDashboard();
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

// Check for admin URL
function checkAdminAccess() {
  if (window.location.hash === '#admin' || window.location.pathname.includes('/admin')) {
    showPage('login');
    return true;
  }
  return false;
}

// Theme Switching
function toggleThemeMenu() {
  document.getElementById('theme-menu').classList.toggle('active');
}

function setTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  document.getElementById('theme-menu').classList.remove('active');
  playSound('click');
  showToast(`Theme changed to ${theme}!`, 'success');
}

// AI Chatbot Functions
function toggleChatbot() {
  chatbotOpen = !chatbotOpen;
  const container = document.getElementById('chatbot-container');
  const bubble = document.getElementById('chatbot-bubble');
  
  if (chatbotOpen) {
    container.classList.add('active');
    bubble.style.display = 'none';
    if (chatMessages.length === 0) {
      setTimeout(() => {
        addBotMessage(CHATBOT_RESPONSES.greeting[Math.floor(Math.random() * CHATBOT_RESPONSES.greeting.length)]);
      }, 500);
    }
  } else {
    container.classList.remove('active');
    bubble.style.display = 'flex';
  }
}

function addBotMessage(text) {
  const messagesDiv = document.getElementById('chatbot-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message bot';
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  playSound('message');
}

function addUserMessage(text) {
  const messagesDiv = document.getElementById('chatbot-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message user';
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chatbot-input');
  const message = input.value.trim();
  if (!message) return;
  
  addUserMessage(message);
  input.value = '';
  
  // Show typing indicator
  const messagesDiv = document.getElementById('chatbot-messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-typing';
  typingDiv.innerHTML = '<span></span><span></span><span></span>';
  messagesDiv.appendChild(typingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  setTimeout(() => {
    typingDiv.remove();
    const response = getChatbotResponse(message.toLowerCase());
    addBotMessage(response);
  }, 1000);
}

function getChatbotResponse(message) {
  if (message.includes('deck') || message.includes('building')) {
    return CHATBOT_RESPONSES.deck[0];
  } else if (message.includes('lawn') || message.includes('grass') || message.includes('garden')) {
    return CHATBOT_RESPONSES.lawn[0];
  } else if (message.includes('paint')) {
    return CHATBOT_RESPONSES.paint[0];
  } else if (message.includes('hello') || message.includes('hi')) {
    return CHATBOT_RESPONSES.greeting[Math.floor(Math.random() * CHATBOT_RESPONSES.greeting.length)];
  } else if (message.includes('available') || message.includes('rent')) {
    const available = tools.filter(t => t.available > 0).length;
    return `We currently have ${available} different tools available! Browse our catalog or tell me what you're working on.`;
  } else if (message.includes('price') || message.includes('cost')) {
    return "Our rental rates start at just $15/day! We offer daily, weekly, and monthly rates with great discounts. Check out any tool for detailed pricing.";
  } else if (message.includes('help') || message.includes('how')) {
    return "Renting is easy!\n\n1. Browse our catalog\n2. Add tools to cart\n3. Select dates\n4. Complete booking\n5. Pick up your tools!\n\nNeed help with anything specific?";
  }
  return CHATBOT_RESPONSES.default[Math.floor(Math.random() * CHATBOT_RESPONSES.default.length)];
}

// Gamification Functions
function getUserTier(rentals) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (rentals >= TIERS[i].minRentals) {
      return TIERS[i];
    }
  }
  return TIERS[0];
}

function updateGamificationDisplay() {
  if (!currentCustomerUser) return;
  
  const header = document.getElementById('gamification-header');
  header.style.display = 'flex';
  
  const tier = getUserTier(currentCustomerUser.totalRentals || 0);
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  
  document.getElementById('level-badge').textContent = tier.icon;
  document.getElementById('level-name').textContent = tier.name;
  document.getElementById('points-count').textContent = currentCustomerUser.points || 0;
  
  // Progress to next tier
  if (nextTier) {
    const current = currentCustomerUser.totalRentals || 0;
    const progress = ((current - tier.minRentals) / (nextTier.minRentals - tier.minRentals)) * 100;
    document.getElementById('level-progress').style.width = `${Math.min(progress, 100)}%`;
  } else {
    document.getElementById('level-progress').style.width = '100%';
  }
}

function updateDashboardGamification() {
  if (!currentCustomerUser) return;
  
  const tier = getUserTier(currentCustomerUser.totalRentals || 0);
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  
  document.getElementById('tier-icon').textContent = tier.icon;
  document.getElementById('tier-name').textContent = `${tier.name} Tier`;
  document.getElementById('total-points').textContent = currentCustomerUser.points || 0;
  
  if (nextTier) {
    const current = currentCustomerUser.totalRentals || 0;
    const remaining = nextTier.minRentals - current;
    const progress = ((current - tier.minRentals) / (nextTier.minRentals - tier.minRentals)) * 100;
    document.getElementById('tier-progress-fill').style.width = `${Math.min(progress, 100)}%`;
    document.getElementById('tier-progress-text').textContent = `${current} / ${nextTier.minRentals} rentals to ${nextTier.name}`;
  } else {
    document.getElementById('tier-progress-fill').style.width = '100%';
    document.getElementById('tier-progress-text').textContent = 'Maximum tier reached! 🎉';
  }
  
  // Environmental impact
  document.getElementById('co2-saved').textContent = `${currentCustomerUser.co2Saved || 0} lbs`;
  document.getElementById('trees-equivalent').textContent = currentCustomerUser.treesEquivalent || 0;
  
  // Daily challenge timer
  updateChallengeTimer();
  
  // Achievements
  renderAchievements();
}

function updateChallengeTimer() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  document.getElementById('challenge-timer').textContent = `Resets in ${hours}h ${minutes}m`;
}

function renderAchievements() {
  const container = document.getElementById('achievements-preview');
  const userAchievements = currentCustomerUser?.achievements || [];
  
  const html = ACHIEVEMENTS.slice(0, 6).map(achievement => {
    const unlocked = userAchievements.includes(achievement.id) || achievement.condition(currentCustomerUser);
    return `
      <div class="achievement-item ${unlocked ? '' : 'locked'}" title="${achievement.desc}">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-progress">${unlocked ? '✓ Unlocked' : '🔒 Locked'}</div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

function showAllAchievements() {
  alert('Achievement gallery coming soon! 🏆');
}

function unlockAchievement(achievementId) {
  if (!currentCustomerUser) return;
  if (currentCustomerUser.achievements?.includes(achievementId)) return;
  
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return;
  
  if (!currentCustomerUser.achievements) currentCustomerUser.achievements = [];
  currentCustomerUser.achievements.push(achievementId);
  currentCustomerUser.points = (currentCustomerUser.points || 0) + achievement.points;
  
  // Show achievement modal
  const modal = document.getElementById('achievement-modal');
  document.querySelector('.achievement-icon-large').textContent = achievement.icon;
  document.querySelector('.achievement-title').textContent = achievement.name;
  document.querySelector('.achievement-desc').textContent = achievement.desc;
  document.querySelector('.achievement-points').textContent = `+${achievement.points} points!`;
  modal.classList.add('active');
  
  playSound('achievement');
  
  setTimeout(() => {
    modal.classList.remove('active');
  }, 4000);
  
  updateGamificationDisplay();
}

function checkLevelUp(oldRentals, newRentals) {
  const oldTier = getUserTier(oldRentals);
  const newTier = getUserTier(newRentals);
  
  if (oldTier.name !== newTier.name) {
    showLevelUp(newTier);
  }
}

function showLevelUp(tier) {
  const modal = document.getElementById('level-up-modal');
  document.querySelector('.level-up-text').textContent = `You've reached ${tier.name} tier! Enjoy ${tier.discount}% off all rentals!`;
  modal.classList.add('active');
  
  playSound('levelup');
  
  // Confetti effect (simulated)
  createConfetti();
}

function closeLevelUp() {
  document.getElementById('level-up-modal').classList.remove('active');
}

function createConfetti() {
  // Simple confetti simulation
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.background = ['#FFD700', '#FFC107', '#FF6B6B', '#4ECDC4'][Math.floor(Math.random() * 4)];
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '-10px';
      confetti.style.zIndex = '9999';
      confetti.style.borderRadius = '50%';
      document.body.appendChild(confetti);
      
      let pos = -10;
      const interval = setInterval(() => {
        pos += 5;
        confetti.style.top = pos + 'px';
        confetti.style.opacity = 1 - (pos / window.innerHeight);
        if (pos > window.innerHeight) {
          clearInterval(interval);
          confetti.remove();
        }
      }, 20);
    }, i * 20);
  }
}

// Sound Effects (simulated)
function playSound(type) {
  if (!soundEnabled) return;
  // In a real app, this would play actual sound files
  console.log(`🔊 Playing sound: ${type}`);
}

// Particle.js initialization
function initParticles() {
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#FFD700' },
        shape: { type: 'circle' },
        opacity: { value: 0.3, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: '#FFD700', opacity: 0.2, width: 1 },
        move: { enable: true, speed: 2, direction: 'none', random: true, out_mode: 'out' }
      },
      interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' } },
        modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
      }
    });
  }
}

// Update live stats
function updateLiveStats() {
  document.getElementById('trending-today').textContent = Math.floor(Math.random() * 20) + 40;
  document.getElementById('trees-planted').textContent = 1284 + Math.floor(Math.random() * 10);
  document.getElementById('hero-tools-count').textContent = tools.length + '+';
}

// Initialize app
function initApp() {
  initializeSampleData();
  
  // Check if admin access
  if (!checkAdminAccess()) {
    showPage('customer');
  }
  
  renderToolsCatalog(currentCategory, searchQuery);
  updateCartDisplay();
  updateCustomerNav();
  updateGamificationDisplay();
  initParticles();
  updateLiveStats();
  
  // Update live stats every 5 seconds
  setInterval(updateLiveStats, 5000);
  
  // Update challenge timer every minute
  setInterval(updateChallengeTimer, 60000);
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-account-menu')) {
      document.getElementById('account-dropdown')?.classList.remove('active');
    }
    if (!e.target.closest('.auth-modal') && !e.target.closest('[onclick*="showAuthModal"]')) {
      // Don't auto-close auth modal
    }
  });
}

// Handle hash changes for admin
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#admin') {
    showPage('login');
  }
});

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}