// Main page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    var trackingForm = document.getElementById('trackingForm');
    var errorMessage = document.getElementById('errorMessage');
    var errorText = document.getElementById('errorText');
    var orderNumberInput = document.getElementById('orderNumber');

    if (!trackingForm || !errorMessage || !errorText || !orderNumberInput) return;

    var oldBtn = document.getElementById('trackNewDesignBtn');
    if (oldBtn) oldBtn.remove();

    // تحويل الأرقام العربية (٠-٩) إلى إنجليزية + قبول أرقام فقط
    function normalizeOrderNumber(str) {
        var arabicToEnglish = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
        var s = (str || '').trim();
        var out = '';
        for (var i = 0; i < s.length; i++) {
            out += arabicToEnglish[s[i]] || (s[i] >= '0' && s[i] <= '9' ? s[i] : '');
        }
        return out;
    }

    orderNumberInput.addEventListener('input', function() {
        this.value = normalizeOrderNumber(this.value);
        errorMessage.style.display = 'none';
    });

    trackingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var orderNumber = normalizeOrderNumber(orderNumberInput.value);

        if (!orderNumber) {
            showError('الرجاء إدخال رقم الطلب');
            return;
        }
        if (!/^[0-9]+$/.test(orderNumber)) {
            showError('رقم الطلب غير صحيح. أدخل أرقاماً فقط (مثال: 12345)');
            return;
        }
        if (typeof db === 'undefined' && typeof orderExistsLocally !== 'function') {
            showError('جاري التحقق من الاتصال... حدّث الصفحة وحاول مرة أخرى.');
            return;
        }

        checkOrderExists(orderNumber);
    });

    function checkOrderExists(orderNumber) {
        function goToDetails() {
            window.location.href = 'order-details.html?order=' + encodeURIComponent(orderNumber);
        }
        if (typeof orderExistsLocally === 'function' && orderExistsLocally(orderNumber)) {
            goToDetails();
            return;
        }
        if (typeof db === 'undefined' || !db) {
            showError('لم يتم ربط Firebase — الطلبات تُحفظ على نفس الجهاز فقط. ربط Firebase في firebase-config.js لظهور الطلبات على الجوال واللابتوب.');
            return;
        }
        var ref = db.collection('orders').doc(orderNumber);
        // استخدام السيرفر دائماً لضمان ظهور الطلب على الجوال (تجنب الكاش القديم)
        var getPromise = ref.get({ source: 'server' }).catch(function(serverErr) {
            if (serverErr && (serverErr.code === 'unavailable' || serverErr.message && serverErr.message.indexOf('offline') !== -1)) {
                return ref.get();
            }
            throw serverErr;
        });
        getPromise
            .then(function(doc) {
                if (doc.exists) {
                    goToDetails();
                } else if (typeof orderExistsLocally === 'function' && orderExistsLocally(orderNumber)) {
                    goToDetails();
                } else {
                    showError('الطلب ' + orderNumber + ' غير موجود. تحقق من الرقم (قد يأخذ لحظات لظهور الطلب الجديد — حدّث الصفحة وحاول مجدداً).');
                }
            })
            .catch(function(error) {
                if (typeof orderExistsLocally === 'function' && orderExistsLocally(orderNumber)) {
                    goToDetails();
                } else {
                    console.error('Error checking order:', error);
                    var code = error && error.code;
                    var msg = error && (error.message || error.code);
                    if (code === 'unavailable' || (msg && msg.toString().indexOf('offline') !== -1)) {
                        showError('لا يوجد اتصال بالإنترنت أو أن الخدمة غير متاحة الآن. تحقق من الاتصال وحاول مرة أخرى.');
                    } else {
                        showError('حدث خطأ أثناء التحقق. تأكد من الاتصال بالإنترنت وقواعد Firestore (السماح بالقراءة على orders). ' + (msg ? msg : ''));
                    }
                }
            });
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        setTimeout(function() {
            errorMessage.style.display = 'none';
        }, 7000);
    }
});
