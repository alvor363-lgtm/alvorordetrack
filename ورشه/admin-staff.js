// الموظفون — إضافة ومتابعة
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) {
        window.location.href = 'admin-login.html';
        return;
    }
    loadStaff();
    document.getElementById('addStaffForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewStaff();
    });
    document.getElementById('editStaffForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateStaff();
    });
    document.getElementById('resetStaffPasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitResetStaffPassword();
    });
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

function loadStaff() {
    var tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    var list = typeof getAllLocalStaff === 'function' ? getAllLocalStaff() : [];
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-row">لا يوجد موظفون مسجلون. أضف موظفاً من الزر أعلاه.</td></tr>';
        return;
    }
    var html = '';
    list.forEach(function(s) {
        var statusClass = s.active !== false ? 'status-active' : 'status-inactive';
        var statusText = s.active !== false ? 'نشط' : 'غير نشط';
        html += '<tr>' +
            '<td><strong>' + escapeHtml(s.name || '') + '</strong></td>' +
            '<td>' + escapeHtml(s.username || '—') + '</td>' +
            '<td>' + escapeHtml(s.role || '') + '</td>' +
            '<td>' + escapeHtml(s.phone || '—') + '</td>' +
            '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
            '<td>' +
            '<button type="button" onclick="editStaff(\'' + s.id + '\')" class="btn btn-secondary btn-small"><i class="fas fa-edit"></i> تعديل</button> ' +
            '<button type="button" onclick="showResetStaffPasswordModal(\'' + s.id + '\')" class="btn btn-secondary btn-small" title="إعادة تعيين كلمة المرور"><i class="fas fa-key"></i> إعادة كلمة المرور</button> ' +
            '<button type="button" onclick="confirmRemoveStaff(\'' + s.id + '\')" class="btn btn-secondary btn-small" style="color:#e74c3c;"><i class="fas fa-trash-alt"></i> حذف</button>' +
            '</td></tr>';
    });
    tbody.innerHTML = html;
}

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showAddStaffModal() {
    document.getElementById('addStaffModal').classList.add('show');
    document.getElementById('addStaffForm').reset();
}

function closeAddStaffModal() {
    document.getElementById('addStaffModal').classList.remove('show');
}

function addNewStaff() {
    var name = (document.getElementById('staffName') && document.getElementById('staffName').value) ? document.getElementById('staffName').value.trim() : '';
    var username = (document.getElementById('staffUsername') && document.getElementById('staffUsername').value) ? document.getElementById('staffUsername').value.trim().toLowerCase() : '';
    var password = (document.getElementById('staffPassword') && document.getElementById('staffPassword').value) ? document.getElementById('staffPassword').value : '';
    var role = (document.getElementById('staffRole') && document.getElementById('staffRole').value) ? document.getElementById('staffRole').value.trim() : '';
    var phone = (document.getElementById('staffPhone') && document.getElementById('staffPhone').value) ? document.getElementById('staffPhone').value.trim() : '';
    var notes = (document.getElementById('staffNotes') && document.getElementById('staffNotes').value) ? document.getElementById('staffNotes').value.trim() : '';
    if (!name || !role) {
        alert('الرجاء إدخال الاسم والدور');
        return;
    }
    if (!username) {
        alert('الرجاء إدخال اسم المستخدم');
        return;
    }
    if (!password || password.length < 4) {
        alert('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
        return;
    }
    var list = typeof getAllLocalStaff === 'function' ? getAllLocalStaff() : [];
    if (list.some(function(s) { return (s.username || '').toLowerCase() === username; })) {
        alert('اسم المستخدم «' + username + '» مستخدم مسبقاً. اختر اسماً آخر.');
        return;
    }
    if (typeof addLocalStaff !== 'function') {
        alert('نظام التخزين غير جاهز');
        return;
    }
    addLocalStaff({ name: name, username: username, password: password, role: role, phone: phone || '', notes: notes || '', active: true });
    closeAddStaffModal();
    loadStaff();
    alert('تم إضافة الموظف. يمكنه الدخول من صفحة «دخول الموظفين» باسم المستخدم وكلمة المرور.');
}

function editStaff(id) {
    var list = typeof getAllLocalStaff === 'function' ? getAllLocalStaff() : [];
    var s = list.find(function(x) { return x.id === id; });
    if (!s) return;
    document.getElementById('editStaffId').value = s.id;
    document.getElementById('editStaffName').value = s.name || '';
    document.getElementById('editStaffUsername').value = s.username || '';
    document.getElementById('editStaffPassword').value = '';
    document.getElementById('editStaffRole').value = s.role || '';
    document.getElementById('editStaffPhone').value = s.phone || '';
    document.getElementById('editStaffNotes').value = s.notes || '';
    document.getElementById('editStaffActive').checked = s.active !== false;
    document.getElementById('editStaffModal').classList.add('show');
}

function closeEditStaffModal() {
    document.getElementById('editStaffModal').classList.remove('show');
}

function updateStaff() {
    var id = document.getElementById('editStaffId').value;
    var name = (document.getElementById('editStaffName') && document.getElementById('editStaffName').value) ? document.getElementById('editStaffName').value.trim() : '';
    var username = (document.getElementById('editStaffUsername') && document.getElementById('editStaffUsername').value) ? document.getElementById('editStaffUsername').value.trim().toLowerCase() : '';
    var newPassword = (document.getElementById('editStaffPassword') && document.getElementById('editStaffPassword').value) ? document.getElementById('editStaffPassword').value : '';
    var role = (document.getElementById('editStaffRole') && document.getElementById('editStaffRole').value) ? document.getElementById('editStaffRole').value.trim() : '';
    var phone = (document.getElementById('editStaffPhone') && document.getElementById('editStaffPhone').value) ? document.getElementById('editStaffPhone').value.trim() : '';
    var notes = (document.getElementById('editStaffNotes') && document.getElementById('editStaffNotes').value) ? document.getElementById('editStaffNotes').value.trim() : '';
    var active = document.getElementById('editStaffActive').checked;
    if (!name || !role) {
        alert('الرجاء إدخال الاسم والدور');
        return;
    }
    if (!username) {
        alert('الرجاء إدخال اسم المستخدم');
        return;
    }
    var list = typeof getAllLocalStaff === 'function' ? getAllLocalStaff() : [];
    var other = list.find(function(x) { return x.id !== id && (x.username || '').toLowerCase() === username; });
    if (other) {
        alert('اسم المستخدم «' + username + '» مستخدم من موظف آخر. اختر اسماً آخر.');
        return;
    }
    if (newPassword.length > 0 && newPassword.length < 4) {
        alert('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل');
        return;
    }
    if (typeof updateLocalStaff !== 'function') return;
    var updates = { name: name, username: username, role: role, phone: phone, notes: notes, active: active };
    if (newPassword.length >= 4) updates.password = newPassword;
    updateLocalStaff(id, updates);
    closeEditStaffModal();
    loadStaff();
    alert('تم حفظ التعديلات');
}

function confirmRemoveStaff(id) {
    var list = typeof getAllLocalStaff === 'function' ? getAllLocalStaff() : [];
    var s = list.find(function(x) { return x.id === id; });
    var name = (s && s.name) ? s.name : 'هذا الموظف';
    if (!confirm('حذف الموظف «' + name + '»؟ لا يمكن التراجع.')) return;
    if (typeof removeLocalStaff !== 'function') return;
    removeLocalStaff(id);
    loadStaff();
    alert('تم حذف الموظف');
}

function showResetStaffPasswordModal(id) {
    var list = typeof getAllLocalStaff === 'function' ? getAllLocalStaff() : [];
    var s = list.find(function(x) { return x.id === id; });
    if (!s) return;
    document.getElementById('resetStaffId').value = s.id;
    document.getElementById('resetStaffNameDisplay').textContent = 'الموظف: ' + (s.name || s.username || '—');
    document.getElementById('resetStaffNewPassword').value = '';
    document.getElementById('resetStaffConfirmPassword').value = '';
    document.getElementById('resetStaffPasswordFeedback').textContent = '';
    document.getElementById('resetStaffPasswordModal').classList.add('show');
}

function closeResetStaffPasswordModal() {
    document.getElementById('resetStaffPasswordModal').classList.remove('show');
}

function submitResetStaffPassword() {
    var id = document.getElementById('resetStaffId').value;
    var newP = (document.getElementById('resetStaffNewPassword') && document.getElementById('resetStaffNewPassword').value) ? document.getElementById('resetStaffNewPassword').value : '';
    var confirmP = (document.getElementById('resetStaffConfirmPassword') && document.getElementById('resetStaffConfirmPassword').value) ? document.getElementById('resetStaffConfirmPassword').value : '';
    var feedback = document.getElementById('resetStaffPasswordFeedback');
    if (newP.length < 4) {
        feedback.textContent = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل.';
        return;
    }
    if (newP !== confirmP) {
        feedback.textContent = 'كلمة المرور وتأكيدها غير متطابقتين.';
        return;
    }
    if (typeof updateLocalStaff !== 'function') return;
    updateLocalStaff(id, { password: newP });
    closeResetStaffPasswordModal();
    loadStaff();
    alert('تم إعادة تعيين كلمة مرور الموظف. يمكنه الدخول بالكلمة الجديدة.');
}

window.showResetStaffPasswordModal = showResetStaffPasswordModal;
window.closeResetStaffPasswordModal = closeResetStaffPasswordModal;

window.showAddStaffModal = showAddStaffModal;
window.closeAddStaffModal = closeAddStaffModal;
window.closeEditStaffModal = closeEditStaffModal;
window.editStaff = editStaff;
window.confirmRemoveStaff = confirmRemoveStaff;
window.logout = logout;
