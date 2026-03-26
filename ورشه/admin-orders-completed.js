// صفحة تم الإنجاز — المدير: التحقق من الدخول وتحميل الطلبات المكتملة فقط
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) {
        window.location.href = 'admin-login.html';
        return;
    }
    var editForm = document.getElementById('editOrderForm');
    if (editForm) editForm.addEventListener('submit', function(e) { e.preventDefault(); updateOrder(); });
    var searchInput = document.getElementById('completedOrderSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() { if (typeof filterCompletedOrdersBySearch === 'function') filterCompletedOrdersBySearch(); });
        searchInput.addEventListener('keyup', function() { if (typeof filterCompletedOrdersBySearch === 'function') filterCompletedOrdersBySearch(); });
    }
    loadCompletedOrders();
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
window.logout = logout;
