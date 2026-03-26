// لوحة الموظف — نفس حقوق الطلبات كالمدير (نفس السكربت المشترك)
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('staffLoggedIn') !== 'true' || !localStorage.getItem('staffId')) {
        window.location.href = 'staff-login.html';
        return;
    }
    var nameEl = document.getElementById('staffWelcomeName');
    if (nameEl) nameEl.textContent = localStorage.getItem('staffName') || 'موظف';
    setupEventListeners();
    loadOrders();
});

function setupEventListeners() {
    var addForm = document.getElementById('addOrderForm');
    var editForm = document.getElementById('editOrderForm');
    if (addForm) addForm.addEventListener('submit', function(e) { e.preventDefault(); addNewOrder(); });
    if (editForm) editForm.addEventListener('submit', function(e) { e.preventDefault(); updateOrder(); });
    var newOrderNumberEl = document.getElementById('newOrderNumber');
    if (newOrderNumberEl) newOrderNumberEl.addEventListener('input', function() {
        if (typeof normalizeOrderNumberInput === 'function') this.value = normalizeOrderNumberInput(this.value);
        else this.value = this.value.replace(/[^0-9]/g, '');
    });
    var searchEl = document.getElementById('orderSearchInput');
    if (searchEl && typeof filterOrdersBySearch === 'function') {
        searchEl.addEventListener('input', filterOrdersBySearch);
        searchEl.addEventListener('keyup', filterOrdersBySearch);
    }
}

function staffLogout() {
    localStorage.removeItem('staffLoggedIn');
    localStorage.removeItem('staffId');
    localStorage.removeItem('staffName');
    localStorage.removeItem('staffLoginTime');
    window.location.href = 'staff-login.html';
}
window.staffLogout = staffLogout;
