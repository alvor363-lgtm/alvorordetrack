// لوحة المدير — التحقق + ربط النماذج وتحميل الطلبات
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) {
        window.location.href = 'admin-login.html';
        return;
    }
    setupEventListeners();
    loadOrders();
});

function checkAuth() {
    var isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    var loginTime = localStorage.getItem('loginTime');
    if (!isLoggedIn || !loginTime) return false;
    var hoursDiff = (new Date() - new Date(loginTime)) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
        logout();
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('loginTime');
    window.location.href = 'admin-login.html';
}

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

window.logout = logout;
