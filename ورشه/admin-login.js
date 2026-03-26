// Admin login JavaScript — يدعم تغيير كلمة المرور من الإعدادات
document.addEventListener('DOMContentLoaded', function() {
    var loginForm = document.getElementById('loginForm');
    var loginError = document.getElementById('loginError');
    var loginErrorText = document.getElementById('loginErrorText');

    function getAdminUsername() {
        return (localStorage.getItem('alvor-admin-username') || 'admin').trim();
    }
    function getAdminPassword() {
        return localStorage.getItem('alvor-admin-password') || 'admin123';
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value;

        if (username === getAdminUsername() && password === getAdminPassword()) {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('loginTime', new Date().toISOString());
            window.location.href = 'admin-dashboard.html';
        } else {
            showLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    });

    function showLoginError(message) {
        loginErrorText.textContent = message;
        loginError.style.display = 'flex';
        setTimeout(function() {
            loginError.style.display = 'none';
        }, 5000);
    }

    ['username', 'password'].forEach(function(id) {
        document.getElementById(id).addEventListener('input', function() {
            loginError.style.display = 'none';
        });
    });
});
