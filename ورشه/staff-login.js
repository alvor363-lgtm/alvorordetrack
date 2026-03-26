// دخول الموظفين — التحقق من اسم المستخدم وكلمة المرور
document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('staffLoginForm');
    if (!form) return;
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var username = (document.getElementById('staffUsername') && document.getElementById('staffUsername').value) ? document.getElementById('staffUsername').value.trim().toLowerCase() : '';
        var password = (document.getElementById('staffPassword') && document.getElementById('staffPassword').value) ? document.getElementById('staffPassword').value : '';
        var errEl = document.getElementById('staffLoginError');
        var errText = document.getElementById('staffLoginErrorText');
        if (!username || !password) {
            if (errEl && errText) { errText.textContent = 'أدخل اسم المستخدم وكلمة المرور'; errEl.style.display = 'flex'; }
            return;
        }
        var list = typeof getAllLocalStaff === 'function' ? getAllLocalStaff() : [];
        var staff = list.find(function(s) {
            return (s.username || '').toLowerCase() === username && s.password === password && s.active !== false;
        });
        if (!staff) {
            if (errEl && errText) { errText.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب غير نشط.'; errEl.style.display = 'flex'; }
            return;
        }
        localStorage.setItem('staffLoggedIn', 'true');
        localStorage.setItem('staffId', staff.id);
        localStorage.setItem('staffName', staff.name || '');
        localStorage.setItem('staffLoginTime', new Date().toISOString());
        window.location.href = 'staff-dashboard.html';
    });
});
