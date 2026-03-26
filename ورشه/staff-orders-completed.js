// صفحة تم الإنجاز — الموظف: التحقق من الدخول وتحميل الطلبات المكتملة فقط
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('staffLoggedIn') !== 'true' || !localStorage.getItem('staffId')) {
        window.location.href = 'staff-login.html';
        return;
    }
    var nameEl = document.getElementById('staffWelcomeName');
    if (nameEl) nameEl.textContent = localStorage.getItem('staffName') || 'موظف';
    var editForm = document.getElementById('editOrderForm');
    if (editForm) editForm.addEventListener('submit', function(e) { e.preventDefault(); updateOrder(); });
    var searchInput = document.getElementById('completedOrderSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() { if (typeof filterCompletedOrdersBySearch === 'function') filterCompletedOrdersBySearch(); });
        searchInput.addEventListener('keyup', function() { if (typeof filterCompletedOrdersBySearch === 'function') filterCompletedOrdersBySearch(); });
    }
    loadCompletedOrders();
});
