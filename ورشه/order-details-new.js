// تتبع الطلب — تصميم جديد (نفس البيانات، واجهة مختلفة)
function openImageLightbox(src) {
    var overlay = document.getElementById('imageLightboxOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'imageLightboxOverlay';
        overlay.className = 'image-lightbox-overlay';
        overlay.innerHTML = '<div class="image-lightbox-content"><img src="" alt="تكبير"><button type="button" class="image-lightbox-close" aria-label="إغلاق">&times;</button></div>';
        overlay.onclick = function(e) { if (e.target === overlay) closeImageLightbox(); };
        overlay.querySelector('.image-lightbox-close').onclick = closeImageLightbox;
        document.body.appendChild(overlay);
    }
    overlay.querySelector('img').src = src;
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeImageLightboxOnEsc);
}
function closeImageLightboxOnEsc(e) {
    if (e.key === 'Escape') {
        closeImageLightbox();
        document.removeEventListener('keydown', closeImageLightboxOnEsc);
    }
}
function closeImageLightbox() {
    var overlay = document.getElementById('imageLightboxOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', closeImageLightboxOnEsc);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var urlParams = new URLSearchParams(window.location.search);
    var orderNumber = urlParams.get('order');
    var orderContent = document.getElementById('orderContent');

    if (!orderNumber) {
        showError('لم يتم توفير رقم الطلب');
        return;
    }

    loadOrderDetails(orderNumber);

    function loadOrderDetails(num) {
        function display(data) {
            if (data) renderNewDesign(num, data);
            else showError('الطلب ' + num + ' غير موجود');
        }
        if (typeof db !== 'undefined' && db) {
            db.collection('orders').doc(num).get({ source: 'server' })
                .then(function(doc) {
                    if (doc.exists) display(doc.data());
                    else display(typeof getLocalOrder === 'function' ? getLocalOrder(num) : null);
                })
                .catch(function() {
                    display(typeof getLocalOrder === 'function' ? getLocalOrder(num) : null);
                });
        } else {
            display(typeof getLocalOrder === 'function' ? getLocalOrder(num) : null);
        }
    }

    function renderNewDesign(orderNumber, orderData) {
        var currentStatus = orderData.status || 'in-progress';
        var lastUpdated = orderData.lastUpdated;
        var lastUpdatedStr = '—';
        if (lastUpdated) {
            if (lastUpdated.toDate) lastUpdatedStr = formatDate(lastUpdated);
            else if (typeof lastUpdated === 'string') lastUpdatedStr = new Date(lastUpdated).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        var stages = orderData.stages || {};
        var localImages = (typeof localImageStorage !== 'undefined' && localImageStorage) ? localImageStorage.getOrderImages(orderNumber) : {};
        var allStages = Object.assign({}, stages, localImages);
        var statusName = (window.ORDER_STAGES && window.ORDER_STAGES[currentStatus]) ? window.ORDER_STAGES[currentStatus].name : currentStatus;

        var cardsHTML = '';
        var statusOrder = ['in-progress', 'finishing', 'ready', 'wrapping', 'delivered'];
        statusOrder.forEach(function(stageKey) {
            var stage = window.ORDER_STAGES && window.ORDER_STAGES[stageKey];
            if (!stage) return;
            var isCurrent = stageKey === currentStatus;
            var stageImages = allStages[stageKey];
            var imgArr = Array.isArray(stageImages) ? stageImages.filter(Boolean) : (stageImages ? [stageImages] : []);

            var imgs = '';
            if (imgArr.length) {
            imgArr.forEach(function(src) {
                var q = (src || '').replace(/"/g, '&quot;');
                imgs += '<div class="stage-img-wrap" data-image-src="' + q + '" role="button" tabindex="0"><img src="' + q + '" alt="' + (stage.name || '') + '"></div>';
            });
            } else {
                imgs = '<div class="no-img-msg"><i class="fas fa-image"></i> لا توجد صورة</div>';
            }

            cardsHTML += '<div class="stage-card-new' + (isCurrent ? ' is-current' : '') + '">' +
                '<div class="stage-card-header">' +
                '<i class="fas ' + (stage.icon || 'fa-circle') + '"></i>' +
                '<h3>' + (stage.name || stageKey) + '</h3>' +
                (isCurrent ? '<span class="current-tag">المرحلة الحالية</span>' : '') +
                '</div>' +
                '<p class="stage-desc">' + (stage.description || '') + '</p>' +
                '<div class="stage-imgs-new">' + imgs + '</div>' +
                '</div>';
        });

        orderContent.innerHTML =
            '<div class="order-summary-new">' +
                '<div class="summary-item"><span class="label">رقم الطلب</span><strong>' + orderNumber + '</strong></div>' +
                '<div class="summary-item"><span class="label">الحالة</span><span class="status-badge status-' + currentStatus + '">' + statusName + '</span></div>' +
                '<div class="summary-item"><span class="label">آخر تحديث</span><span>' + lastUpdatedStr + '</span></div>' +
            '</div>' +
            '<h3 class="stages-title">مراحل الطلب</h3>' +
            '<div class="stages-list-new">' + cardsHTML + '</div>';

        orderContent.addEventListener('click', function(e) {
            var wrap = e.target.closest('.stage-img-wrap');
            if (!wrap) return;
            var src = wrap.getAttribute('data-image-src') || (wrap.querySelector('img') && wrap.querySelector('img').src);
            if (src) openImageLightbox(src);
        });
        orderContent.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.closest('.stage-img-wrap')) {
                var wrap = e.target.closest('.stage-img-wrap');
                var src = wrap.getAttribute('data-image-src') || (wrap.querySelector('img') && wrap.querySelector('img').src);
                if (src) openImageLightbox(src);
            }
        });
    }

    function showError(message) {
        orderContent.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> <span>' + message + '</span></div>';
    }
});
