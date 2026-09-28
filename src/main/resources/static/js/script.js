/**
 * ComplaintBox — Frontend Controller
 * Vanilla JS with full API integration for Complaints, Residents, Staff, Categories
 */

// Global State
let complaints = [];
let residents = [];
let staffMembers = [];
let categories = [];
let activeComplaintFilter = 'ALL';
let deleteAction = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDate();
    initModalHandlers();
    initFilterPills();
    initSearchHandlers();
    initFormSubmissions();
    fetchAllData();
});

/* ---------------- NAVIGATION ---------------- */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const targetTab = item.dataset.tab;
            tabPanes.forEach(pane => pane.classList.remove('active'));

            if (targetTab === 'complaints-tab') {
                document.getElementById('dashboard-tab').classList.add('active');
                pageTitle.textContent = 'Complaints Directory';
                pageSubtitle.textContent = 'Comprehensive log of all submitted maintenance tickets';
            } else {
                const activePane = document.getElementById(targetTab);
                if (activePane) activePane.classList.add('active');

                switch (targetTab) {
                    case 'dashboard-tab':
                        pageTitle.textContent = 'Maintenance Dashboard';
                        pageSubtitle.textContent = 'Track, assign, and resolve student hostel complaints';
                        break;
                    case 'residents-tab':
                        pageTitle.textContent = 'Hostel Residents';
                        pageSubtitle.textContent = 'Manage student room allocations and contact details';
                        break;
                    case 'staff-tab':
                        pageTitle.textContent = 'Maintenance Staff';
                        pageSubtitle.textContent = 'Duty roster and specialized technicians for repairs';
                        break;
                    case 'categories-tab':
                        pageTitle.textContent = 'Issue Categories';
                        pageSubtitle.textContent = 'Manage categorization for plumbing, electrical, and facility requests';
                        break;
                }
            }

            if (window.innerWidth <= 900) {
                sidebar.classList.remove('open');
            }
        });
    });
}

function initDate() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

/* ---------------- DATA FETCHING ---------------- */
async function fetchAllData() {
    await Promise.all([
        fetchResidents(),
        fetchStaff(),
        fetchCategories()
    ]);
    await fetchComplaints();
}

async function fetchResidents() {
    try {
        const res = await fetch('/api/residents');
        if (!res.ok) throw new Error('Failed to load residents');
        residents = await res.json();
        renderResidentsTable(residents);
        populateResidentDropdown();
    } catch (err) {
        showToast('Error loading residents: ' + err.message, 'error');
    }
}

async function fetchStaff() {
    try {
        const res = await fetch('/api/staff');
        if (!res.ok) throw new Error('Failed to load staff');
        staffMembers = await res.json();
        renderStaffTable(staffMembers);
        populateStaffDropdown();
    } catch (err) {
        showToast('Error loading staff: ' + err.message, 'error');
    }
}

async function fetchCategories() {
    try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to load categories');
        categories = await res.json();
        renderCategoriesTable(categories);
        populateCategoryDropdown();
    } catch (err) {
        showToast('Error loading categories: ' + err.message, 'error');
    }
}

async function fetchComplaints() {
    try {
        const res = await fetch('/api/complaints');
        if (!res.ok) throw new Error('Failed to load complaints');
        complaints = await res.json();
        updateDashboardStats(complaints);
        applyComplaintFilter();
    } catch (err) {
        showToast('Error loading complaints: ' + err.message, 'error');
    }
}

/* ---------------- DASHBOARD STATS ---------------- */
function updateDashboardStats(data) {
    const total = data.length;
    let openCount = 0;
    let progressCount = 0;
    let resolvedCount = 0;
    let overdueCount = 0;

    const now = new Date();

    data.forEach(c => {
        const st = (c.status || '').toUpperCase();
        if (st === 'OPEN') openCount++;
        else if (st === 'IN_PROGRESS') progressCount++;
        else if (st === 'RESOLVED') resolvedCount++;

        if (st !== 'RESOLVED' && isComplaintOverdue(c.createdAt, now)) {
            overdueCount++;
        }
    });

    document.getElementById('stat-total-complaints').textContent = total;
    document.getElementById('stat-open-complaints').textContent = openCount;
    document.getElementById('stat-progress-complaints').textContent = progressCount;
    document.getElementById('stat-resolved-complaints').textContent = resolvedCount;
    document.getElementById('stat-overdue-complaints').textContent = overdueCount;
    document.getElementById('open-count-badge').textContent = openCount + progressCount;
}

function isComplaintOverdue(createdAtStr, referenceDate) {
    if (!createdAtStr) return false;
    const createdDate = new Date(createdAtStr);
    const diffTime = Math.abs((referenceDate || new Date()) - createdDate);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 5;
}

function formatRelativeAge(createdAtStr) {
    if (!createdAtStr) return 'Just now';
    const createdDate = new Date(createdAtStr);
    const now = new Date();
    const diffMs = now - createdDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays >= 1) {
        return `${diffDays}d ago`;
    } else if (diffHours >= 1) {
        return `${diffHours}h ago`;
    } else {
        return 'Recent';
    }
}

/* ---------------- COMPLAINTS RENDERING & FILTERING ---------------- */
function initFilterPills() {
    const pills = document.querySelectorAll('#complaint-status-filters .filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeComplaintFilter = pill.dataset.filter;
            applyComplaintFilter();
        });
    });
}

function applyComplaintFilter() {
    let filtered = complaints;
    const now = new Date();

    if (activeComplaintFilter === 'OPEN') {
        filtered = complaints.filter(c => (c.status || '').toUpperCase() === 'OPEN');
    } else if (activeComplaintFilter === 'IN_PROGRESS') {
        filtered = complaints.filter(c => (c.status || '').toUpperCase() === 'IN_PROGRESS');
    } else if (activeComplaintFilter === 'RESOLVED') {
        filtered = complaints.filter(c => (c.status || '').toUpperCase() === 'RESOLVED');
    } else if (activeComplaintFilter === 'OVERDUE') {
        filtered = complaints.filter(c => (c.status || '').toUpperCase() !== 'RESOLVED' && isComplaintOverdue(c.createdAt, now));
    }

    renderComplaintsTable(filtered);
}

function renderComplaintsTable(items) {
    const tbody = document.getElementById('complaints-table-body');
    const emptyState = document.getElementById('complaints-empty');
    tbody.innerHTML = '';

    if (!items || items.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    // Sort: open/in-progress first, then by creation date descending
    const sorted = [...items].sort((a, b) => {
        if (a.status === 'RESOLVED' && b.status !== 'RESOLVED') return 1;
        if (a.status !== 'RESOLVED' && b.status === 'RESOLVED') return -1;
        return (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0));
    });

    sorted.forEach(c => {
        const resident = residents.find(r => r.id === c.residentId);
        const staff = staffMembers.find(s => s.id === c.staffId);
        const category = categories.find(cat => cat.id === c.categoryId);

        const residentDisplay = resident ? `${resident.name} (${resident.roomNumber})` : `Resident #${c.residentId}`;
        const staffDisplay = staff ? `${staff.name} (${staff.role})` : `<span class="text-muted-cell">Unassigned</span>`;
        const categoryDisplay = category ? category.name : `Cat #${c.categoryId}`;

        const isOverdue = (c.status || '').toUpperCase() !== 'RESOLVED' && isComplaintOverdue(c.createdAt);
        const ageText = formatRelativeAge(c.createdAt);

        let statusBadge = '';
        const st = (c.status || 'OPEN').toUpperCase();
        if (st === 'OPEN') statusBadge = `<span class="badge badge-open"><i class="ti ti-clock"></i> Open</span>`;
        else if (st === 'IN_PROGRESS') statusBadge = `<span class="badge badge-progress"><i class="ti ti-refresh"></i> In Progress</span>`;
        else if (st === 'RESOLVED') statusBadge = `<span class="badge badge-resolved"><i class="ti ti-check"></i> Resolved</span>`;

        let ageBadge = `<span class="badge-age">${ageText}</span>`;
        if (isOverdue) {
            ageBadge = `<span class="badge badge-overdue" title="Open for more than 5 days!"><i class="ti ti-alert-circle"></i> Overdue (${ageText})</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${c.id}</strong></td>
            <td><strong>${escapeHtml(c.roomNumber || '')}</strong></td>
            <td><span class="chip-category">${escapeHtml(categoryDisplay)}</span></td>
            <td>${escapeHtml(c.description || '')}</td>
            <td>${residentDisplay}</td>
            <td>${staffDisplay}</td>
            <td>${statusBadge}</td>
            <td>${ageBadge}</td>
            <td>${c.remark ? `<small>${escapeHtml(c.remark)}</small>` : '<span class="text-muted-cell">—</span>'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" title="Edit Complaint" onclick="openEditComplaint(${c.id})">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn-icon delete" title="Delete Complaint" onclick="confirmDelete('complaint', ${c.id})">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* ---------------- RESIDENTS RENDERING ---------------- */
function renderResidentsTable(items) {
    const tbody = document.getElementById('residents-table-body');
    const emptyState = document.getElementById('residents-empty');
    const countText = document.getElementById('resident-count-text');
    tbody.innerHTML = '';

    countText.textContent = `Total ${items.length} residents`;

    if (!items || items.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    items.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${r.id}</td>
            <td><strong>${escapeHtml(r.name)}</strong></td>
            <td>${escapeHtml(r.email)}</td>
            <td><span class="chip-category">${escapeHtml(r.roomNumber)}</span></td>
            <td>${escapeHtml(r.phone || '—')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" title="Edit Resident" onclick="openEditResident(${r.id})">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn-icon delete" title="Delete Resident" onclick="confirmDelete('resident', ${r.id})">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* ---------------- STAFF RENDERING ---------------- */
function renderStaffTable(items) {
    const tbody = document.getElementById('staff-table-body');
    const emptyState = document.getElementById('staff-empty');
    const countText = document.getElementById('staff-count-text');
    tbody.innerHTML = '';

    countText.textContent = `Total ${items.length} staff`;

    if (!items || items.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    items.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${s.id}</td>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td>${escapeHtml(s.email)}</td>
            <td><span class="chip-category">${escapeHtml(s.role)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" title="Edit Staff" onclick="openEditStaff(${s.id})">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn-icon delete" title="Delete Staff" onclick="confirmDelete('staff', ${s.id})">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* ---------------- CATEGORIES RENDERING ---------------- */
function renderCategoriesTable(items) {
    const tbody = document.getElementById('categories-table-body');
    const emptyState = document.getElementById('categories-empty');
    const countText = document.getElementById('category-count-text');
    tbody.innerHTML = '';

    countText.textContent = `Total ${items.length} categories`;

    if (!items || items.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    items.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${c.id}</td>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td>${escapeHtml(c.description || '—')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" title="Edit Category" onclick="openEditCategory(${c.id})">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn-icon delete" title="Delete Category" onclick="confirmDelete('category', ${c.id})">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* ---------------- DROPDOWN POPULATION ---------------- */
function populateResidentDropdown() {
    const select = document.getElementById('complaint-residentId');
    select.innerHTML = '<option value="">Select Resident</option>';
    residents.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.name} (Room ${r.roomNumber})`;
        select.appendChild(opt);
    });

    // Auto-fill room number when resident is chosen
    select.onchange = () => {
        const selectedId = parseInt(select.value);
        const found = residents.find(r => r.id === selectedId);
        if (found) {
            document.getElementById('complaint-roomNumber').value = found.roomNumber;
        }
    };
}

function populateStaffDropdown() {
    const select = document.getElementById('complaint-staffId');
    select.innerHTML = '<option value="">Unassigned</option>';
    staffMembers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.role})`;
        select.appendChild(opt);
    });
}

function populateCategoryDropdown() {
    const select = document.getElementById('complaint-categoryId');
    select.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

/* ---------------- SEARCH HANDLERS ---------------- */
function initSearchHandlers() {
    // Complaints Search
    const cInput = document.getElementById('complaint-search-input');
    const cSearchBtn = document.getElementById('complaint-search-btn');
    const cClearBtn = document.getElementById('complaint-clear-btn');

    cSearchBtn.addEventListener('click', async () => {
        const kw = cInput.value.trim();
        try {
            const res = await fetch(`/api/complaints/search?keyword=${encodeURIComponent(kw)}`);
            if (res.ok) {
                const results = await res.json();
                renderComplaintsTable(results);
            }
        } catch (err) {
            showToast('Search failed: ' + err.message, 'error');
        }
    });

    cClearBtn.addEventListener('click', () => {
        cInput.value = '';
        applyComplaintFilter();
    });

    // Residents Search
    const rInput = document.getElementById('resident-search-input');
    const rSearchBtn = document.getElementById('resident-search-btn');
    const rClearBtn = document.getElementById('resident-clear-btn');

    rSearchBtn.addEventListener('click', async () => {
        const kw = rInput.value.trim();
        try {
            const res = await fetch(`/api/residents/search?keyword=${encodeURIComponent(kw)}`);
            if (res.ok) {
                const results = await res.json();
                renderResidentsTable(results);
            }
        } catch (err) {
            showToast('Search failed: ' + err.message, 'error');
        }
    });

    rClearBtn.addEventListener('click', () => {
        rInput.value = '';
        renderResidentsTable(residents);
    });

    // Staff Search
    const sInput = document.getElementById('staff-search-input');
    const sSearchBtn = document.getElementById('staff-search-btn');
    const sClearBtn = document.getElementById('staff-clear-btn');

    sSearchBtn.addEventListener('click', async () => {
        const kw = sInput.value.trim();
        try {
            const res = await fetch(`/api/staff/search?keyword=${encodeURIComponent(kw)}`);
            if (res.ok) {
                const results = await res.json();
                renderStaffTable(results);
            }
        } catch (err) {
            showToast('Search failed: ' + err.message, 'error');
        }
    });

    sClearBtn.addEventListener('click', () => {
        sInput.value = '';
        renderStaffTable(staffMembers);
    });

    // Category Search
    const catInput = document.getElementById('category-search-input');
    const catSearchBtn = document.getElementById('category-search-btn');
    const catClearBtn = document.getElementById('category-clear-btn');

    catSearchBtn.addEventListener('click', async () => {
        const kw = catInput.value.trim();
        try {
            const res = await fetch(`/api/categories/search?keyword=${encodeURIComponent(kw)}`);
            if (res.ok) {
                const results = await res.json();
                renderCategoriesTable(results);
            }
        } catch (err) {
            showToast('Search failed: ' + err.message, 'error');
        }
    });

    catClearBtn.addEventListener('click', () => {
        catInput.value = '';
        renderCategoriesTable(categories);
    });
}

/* ---------------- MODALS & FORMS ---------------- */
function initModalHandlers() {
    // Open modal buttons
    document.getElementById('btn-add-complaint').addEventListener('click', () => openAddComplaint());
    document.getElementById('btn-quick-new-complaint').addEventListener('click', () => openAddComplaint());
    document.getElementById('btn-add-resident').addEventListener('click', () => openAddResident());
    document.getElementById('btn-add-staff').addEventListener('click', () => openAddStaff());
    document.getElementById('btn-add-category').addEventListener('click', () => openAddCategory());

    // Close modal triggers
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            closeModal(modalId);
        });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    clearValidationErrors(id);
}

function clearValidationErrors(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelectorAll('.field-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
    modal.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
}

function displayInlineErrors(modalId, errorMap) {
    clearValidationErrors(modalId);
    for (const [field, msg] of Object.entries(errorMap)) {
        if (field === 'error') {
            showToast(msg, 'error');
            continue;
        }
        const errEl = document.getElementById(`err-${modalId.replace('-modal', '')}-${field}`);
        const inputEl = document.getElementById(`${modalId.replace('-modal', '')}-${field}`);
        if (errEl) {
            errEl.textContent = msg;
            errEl.classList.add('visible');
        }
        if (inputEl) {
            inputEl.classList.add('is-invalid');
        }
    }
}

/* --- Complaint Modal Actions --- */
function openAddComplaint() {
    document.getElementById('complaint-form').reset();
    document.getElementById('complaint-id').value = '';
    document.getElementById('complaint-modal-title').textContent = 'Log New Complaint';
    document.getElementById('complaint-status').value = 'OPEN';
    clearValidationErrors('complaint-modal');
    openModal('complaint-modal');
}

function openEditComplaint(id) {
    const c = complaints.find(item => item.id === id);
    if (!c) return;
    document.getElementById('complaint-id').value = c.id;
    document.getElementById('complaint-modal-title').textContent = `Edit Complaint #${c.id}`;
    document.getElementById('complaint-residentId').value = c.residentId || '';
    document.getElementById('complaint-roomNumber').value = c.roomNumber || '';
    document.getElementById('complaint-categoryId').value = c.categoryId || '';
    document.getElementById('complaint-staffId').value = c.staffId || '';
    document.getElementById('complaint-description').value = c.description || '';
    document.getElementById('complaint-status').value = c.status || 'OPEN';
    document.getElementById('complaint-remark').value = c.remark || '';
    clearValidationErrors('complaint-modal');
    openModal('complaint-modal');
}

/* --- Resident Modal Actions --- */
function openAddResident() {
    document.getElementById('resident-form').reset();
    document.getElementById('resident-id').value = '';
    document.getElementById('resident-modal-title').textContent = 'Add Hostel Resident';
    clearValidationErrors('resident-modal');
    openModal('resident-modal');
}

function openEditResident(id) {
    const r = residents.find(item => item.id === id);
    if (!r) return;
    document.getElementById('resident-id').value = r.id;
    document.getElementById('resident-modal-title').textContent = `Edit Resident #${r.id}`;
    document.getElementById('resident-name').value = r.name || '';
    document.getElementById('resident-email').value = r.email || '';
    document.getElementById('resident-roomNumber').value = r.roomNumber || '';
    document.getElementById('resident-phone').value = r.phone || '';
    clearValidationErrors('resident-modal');
    openModal('resident-modal');
}

/* --- Staff Modal Actions --- */
function openAddStaff() {
    document.getElementById('staff-form').reset();
    document.getElementById('staff-id').value = '';
    document.getElementById('staff-modal-title').textContent = 'Add Maintenance Staff';
    clearValidationErrors('staff-modal');
    openModal('staff-modal');
}

function openEditStaff(id) {
    const s = staffMembers.find(item => item.id === id);
    if (!s) return;
    document.getElementById('staff-id').value = s.id;
    document.getElementById('staff-modal-title').textContent = `Edit Staff #${s.id}`;
    document.getElementById('staff-name').value = s.name || '';
    document.getElementById('staff-email').value = s.email || '';
    document.getElementById('staff-role').value = s.role || '';
    clearValidationErrors('staff-modal');
    openModal('staff-modal');
}

/* --- Category Modal Actions --- */
function openAddCategory() {
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.getElementById('category-modal-title').textContent = 'Add Issue Category';
    clearValidationErrors('category-modal');
    openModal('category-modal');
}

function openEditCategory(id) {
    const cat = categories.find(item => item.id === id);
    if (!cat) return;
    document.getElementById('category-id').value = cat.id;
    document.getElementById('category-modal-title').textContent = `Edit Category #${cat.id}`;
    document.getElementById('category-name').value = cat.name || '';
    document.getElementById('category-description').value = cat.description || '';
    clearValidationErrors('category-modal');
    openModal('category-modal');
}

/* ---------------- FORM SUBMISSIONS ---------------- */
function initFormSubmissions() {
    // Complaint Submit
    document.getElementById('complaint-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('complaint-id').value;
        const residentIdVal = document.getElementById('complaint-residentId').value;
        const categoryIdVal = document.getElementById('complaint-categoryId').value;
        const staffIdVal = document.getElementById('complaint-staffId').value;

        const payload = {
            residentId: residentIdVal ? parseInt(residentIdVal) : null,
            categoryId: categoryIdVal ? parseInt(categoryIdVal) : null,
            staffId: staffIdVal ? parseInt(staffIdVal) : null,
            roomNumber: document.getElementById('complaint-roomNumber').value.trim(),
            description: document.getElementById('complaint-description').value.trim(),
            status: document.getElementById('complaint-status').value,
            remark: document.getElementById('complaint-remark').value.trim()
        };

        const isUpdate = Boolean(id);
        const url = isUpdate ? `/api/complaints/${id}` : '/api/complaints';
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 400) {
                const errMap = await res.json();
                displayInlineErrors('complaint-modal', errMap);
                return;
            }

            if (!res.ok) throw new Error('Action failed with status: ' + res.status);

            closeModal('complaint-modal');
            showToast(isUpdate ? 'Complaint updated successfully' : 'Complaint logged successfully', 'success');
            await fetchComplaints();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Resident Submit
    document.getElementById('resident-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('resident-id').value;
        const payload = {
            name: document.getElementById('resident-name').value.trim(),
            email: document.getElementById('resident-email').value.trim(),
            roomNumber: document.getElementById('resident-roomNumber').value.trim(),
            phone: document.getElementById('resident-phone').value.trim()
        };

        const isUpdate = Boolean(id);
        const url = isUpdate ? `/api/residents/${id}` : '/api/residents';
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 400) {
                const errMap = await res.json();
                displayInlineErrors('resident-modal', errMap);
                return;
            }

            if (!res.ok) throw new Error('Action failed with status: ' + res.status);

            closeModal('resident-modal');
            showToast(isUpdate ? 'Resident updated successfully' : 'Resident added successfully', 'success');
            await fetchResidents();
            if (isUpdate) await fetchComplaints();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Staff Submit
    document.getElementById('staff-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('staff-id').value;
        const payload = {
            name: document.getElementById('staff-name').value.trim(),
            email: document.getElementById('staff-email').value.trim(),
            role: document.getElementById('staff-role').value
        };

        const isUpdate = Boolean(id);
        const url = isUpdate ? `/api/staff/${id}` : '/api/staff';
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 400) {
                const errMap = await res.json();
                displayInlineErrors('staff-modal', errMap);
                return;
            }

            if (!res.ok) throw new Error('Action failed with status: ' + res.status);

            closeModal('staff-modal');
            showToast(isUpdate ? 'Staff member updated successfully' : 'Staff member added successfully', 'success');
            await fetchStaff();
            if (isUpdate) await fetchComplaints();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Category Submit
    document.getElementById('category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('category-id').value;
        const payload = {
            name: document.getElementById('category-name').value.trim(),
            description: document.getElementById('category-description').value.trim()
        };

        const isUpdate = Boolean(id);
        const url = isUpdate ? `/api/categories/${id}` : '/api/categories';
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 400) {
                const errMap = await res.json();
                displayInlineErrors('category-modal', errMap);
                return;
            }

            if (!res.ok) throw new Error('Action failed with status: ' + res.status);

            closeModal('category-modal');
            showToast(isUpdate ? 'Category updated successfully' : 'Category added successfully', 'success');
            await fetchCategories();
            if (isUpdate) await fetchComplaints();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

/* ---------------- DELETE HANDLING ---------------- */
function confirmDelete(type, id) {
    const modalText = document.getElementById('delete-modal-text');
    modalText.textContent = `Are you sure you want to delete ${type} #${id}? This action cannot be reversed.`;

    deleteAction = async () => {
        try {
            let endpoint = '';
            if (type === 'complaint') endpoint = `/api/complaints/${id}`;
            else if (type === 'resident') endpoint = `/api/residents/${id}`;
            else if (type === 'staff') endpoint = `/api/staff/${id}`;
            else if (type === 'category') endpoint = `/api/categories/${id}`;

            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok && res.status !== 204) throw new Error('Delete failed with status: ' + res.status);

            closeModal('delete-modal');
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');

            if (type === 'complaint') await fetchComplaints();
            else if (type === 'resident') { await fetchResidents(); await fetchComplaints(); }
            else if (type === 'staff') { await fetchStaff(); await fetchComplaints(); }
            else if (type === 'category') { await fetchCategories(); await fetchComplaints(); }
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    openModal('delete-modal');
}

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    if (typeof deleteAction === 'function') {
        deleteAction();
    }
});

/* ---------------- TOAST NOTIFICATIONS ---------------- */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ti ti-info-circle';
    if (type === 'success') icon = 'ti ti-circle-check';
    if (type === 'error') icon = 'ti ti-alert-triangle';

    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* ---------------- UTILITY ---------------- */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
