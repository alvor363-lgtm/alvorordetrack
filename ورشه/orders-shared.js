// سكربت الطلبات المشترك — يستخدمه المدير والموظف (نفس الجدول ونوافذ الإضافة والتعديل)
var _cachedOrdersList = [];
var _cachedCompletedOrdersList = [];

function normalizeDigitsToAscii(input) {
    if (input == null) return '';
    var str = String(input);
    // Arabic-Indic (٠١٢٣٤٥٦٧٨٩) + Eastern Arabic-Indic (۰۱۲۳۴۵۶۷۸۹)
    return str.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function(c) {
        var m = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
        return m[c] || c;
    });
}

function normalizeOrderNumberInput(input) {
    return normalizeDigitsToAscii(input).replace(/\D/g, '');
}

function loadOrders(forceFromServer) {
    var tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    function formatOrderDate(lastUpdated) {
        if (!lastUpdated) return 'N/A';
        if (lastUpdated.toDate) return formatDate(lastUpdated);
        if (typeof lastUpdated === 'string') return new Date(lastUpdated).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        if (lastUpdated.seconds) return new Date(lastUpdated.seconds * 1000).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return 'N/A';
    }

    function renderRow(item) {
        var orderNumber = item.id;
        var order = item.data || item;
        var status = order.status || 'in-progress';
        var statusName = (window.ORDER_STAGES && window.ORDER_STAGES[status]) ? window.ORDER_STAGES[status].name : status;
        var dateStr = formatOrderDate(order.lastUpdated);
        return '<tr><td><strong>' + orderNumber + '</strong></td><td><span class="status-badge status-' + status + '">' + statusName + '</span></td><td>' + dateStr + '</td><td><button onclick="editOrder(\'' + orderNumber + '\')" class="btn btn-secondary btn-small"><i class="fas fa-edit"></i> تعديل</button> <button onclick="confirmDeleteOrder(\'' + orderNumber + '\')" class="btn btn-secondary btn-small" style="color:#e74c3c;"><i class="fas fa-trash-alt"></i> حذف</button></td></tr>';
    }

    function getSearchTerm() {
        var el = document.getElementById('orderSearchInput');
        return el ? normalizeOrderNumberInput((el.value || '').trim()) : '';
    }
    function renderFromList(ordersList) {
        var inProgress = [];
        if (ordersList && ordersList.length > 0) {
            ordersList.forEach(function(item) {
                var status = (item.data || item).status || 'in-progress';
                if (status !== 'delivered') inProgress.push(item);
            });
        }
        _cachedOrdersList = inProgress;
        var q = getSearchTerm();
        if (q) {
            inProgress = inProgress.filter(function(item) { return String(item.id).indexOf(q) >= 0; });
        }
        if (inProgress.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="loading-row">' + (q ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات قيد التنفيذ') + '</td></tr>';
        } else {
            tableBody.innerHTML = inProgress.map(renderRow).join('');
        }
    }

    if (typeof db !== 'undefined' && db) {
        var promise = db.collection('orders').get(forceFromServer ? { source: 'server' } : undefined);
        promise.then(function(snapshot) {
            if (snapshot.empty) {
                var local = getAllLocalOrders();
                var arr = Object.keys(local).map(function(k) { return { id: k, data: local[k] }; });
                renderFromList(arr);
            } else {
                renderFromList(snapshot.docs.map(function(d) { return { id: d.id, data: d.data() }; }));
            }
        }).catch(function(error) {
            console.warn('Firestore failed, using local:', error);
            var local = getAllLocalOrders();
            renderFromList(Object.keys(local).map(function(k) { return { id: k, data: local[k] }; }));
        });
    } else {
        var local = getAllLocalOrders();
        renderFromList(Object.keys(local).map(function(k) { return { id: k, data: local[k] }; }));
    }
}

function loadCompletedOrders(forceFromServer) {
    var completedBody = document.getElementById('completedOrdersTableBody');
    if (!completedBody) return;

    function formatOrderDate(lastUpdated) {
        if (!lastUpdated) return 'N/A';
        if (lastUpdated.toDate) return formatDate(lastUpdated);
        if (typeof lastUpdated === 'string') return new Date(lastUpdated).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        if (lastUpdated.seconds) return new Date(lastUpdated.seconds * 1000).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return 'N/A';
    }

    function renderRow(item) {
        var orderNumber = item.id;
        var order = item.data || item;
        var status = order.status || 'in-progress';
        var statusName = (window.ORDER_STAGES && window.ORDER_STAGES[status]) ? window.ORDER_STAGES[status].name : status;
        var dateStr = formatOrderDate(order.lastUpdated);
        return '<tr><td><strong>' + orderNumber + '</strong></td><td><span class="status-badge status-' + status + '">' + statusName + '</span></td><td>' + dateStr + '</td><td><button onclick="editOrder(\'' + orderNumber + '\')" class="btn btn-secondary btn-small"><i class="fas fa-edit"></i> تعديل</button> <button onclick="confirmDeleteOrder(\'' + orderNumber + '\')" class="btn btn-secondary btn-small" style="color:#e74c3c;"><i class="fas fa-trash-alt"></i> حذف</button></td></tr>';
    }

    function getCompletedSearchTerm() {
        var el = document.getElementById('completedOrderSearchInput');
        return el ? normalizeOrderNumberInput((el.value || '').trim()) : '';
    }
    function renderFromList(ordersList) {
        var completed = [];
        if (ordersList && ordersList.length > 0) {
            ordersList.forEach(function(item) {
                var status = (item.data || item).status || 'in-progress';
                if (status === 'delivered') completed.push(item);
            });
        }
        _cachedCompletedOrdersList = completed;
        var q = getCompletedSearchTerm();
        if (q) {
            completed = completed.filter(function(item) { return String(item.id).indexOf(q) >= 0; });
        }
        if (completed.length === 0) {
            completedBody.innerHTML = '<tr><td colspan="4" class="loading-row">' + (q ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات في تم الإنجاز بعد. عندما تضع الحالة «طلع لك» يظهر الطلب هنا.') + '</td></tr>';
        } else {
            completedBody.innerHTML = completed.map(renderRow).join('');
        }
    }

    if (typeof db !== 'undefined' && db) {
        var promise = db.collection('orders').get(forceFromServer ? { source: 'server' } : undefined);
        promise.then(function(snapshot) {
            if (snapshot.empty) {
                var local = getAllLocalOrders();
                var arr = Object.keys(local).map(function(k) { return { id: k, data: local[k] }; });
                renderFromList(arr);
            } else {
                renderFromList(snapshot.docs.map(function(d) { return { id: d.id, data: d.data() }; }));
            }
        }).catch(function(error) {
            console.warn('Firestore failed, using local:', error);
            var local = getAllLocalOrders();
            renderFromList(Object.keys(local).map(function(k) { return { id: k, data: local[k] }; }));
        });
    } else {
        var local = getAllLocalOrders();
        renderFromList(Object.keys(local).map(function(k) { return { id: k, data: local[k] }; }));
    }
}

function showAddOrderModal() {
    var modal = document.getElementById('addOrderModal');
    var numEl = document.getElementById('newOrderNumber');
    if (numEl) numEl.value = '';
    if (modal) modal.classList.add('show');
}

function closeAddOrderModal() {
    var modal = document.getElementById('addOrderModal');
    var form = document.getElementById('addOrderForm');
    if (modal) modal.classList.remove('show');
    if (form) form.reset();
}

function addNewOrder() {
    var orderNumberEl = document.getElementById('newOrderNumber');
    var orderNumber = normalizeOrderNumberInput(orderNumberEl ? orderNumberEl.value : '');

    if (!orderNumber || !/^[0-9]+$/.test(orderNumber)) {
        alert('رقم الطلب غير صالح. أدخل أرقاماً فقط (مثال: 12345)');
        return;
    }
    var orderData = {
        status: 'in-progress',
        stages: {}
    };

    if (typeof db !== 'undefined' && db && typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
        orderData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        orderData.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('orders').doc(orderNumber).set(orderData)
            .then(function() {
                addLocalOrder(orderNumber, orderData);
                closeAddOrderModal();
                loadOrders(true);
                alert('تم إضافة الطلب بنجاح! يظهر الآن على اللابتوب والجوال.');
            })
            .catch(function(err) {
                addLocalOrder(orderNumber, orderData);
                closeAddOrderModal();
                loadOrders(true);
                console.error('Firestore error:', err);
                alert('تم حفظ الطلب محلياً. لن يظهر على الجوال — تأكد من إنشاء Firestore وتفعيله في Firebase Console.');
            });
    } else {
        addLocalOrder(orderNumber, orderData);
        closeAddOrderModal();
        loadOrders(true);
        alert('تم إضافة الطلب بنجاح!');
    }
}

function confirmDeleteOrder(orderNumber) {
    if (!orderNumber) return;
    if (!confirm('هل تريد حذف الطلب ' + orderNumber + '؟ لا يمكن التراجع عن الحذف.')) return;
    if (typeof db !== 'undefined' && db) {
        db.collection('orders').doc(orderNumber).delete()
            .then(function() {
                if (typeof removeLocalOrder === 'function') removeLocalOrder(orderNumber);
                if (typeof localImageStorage !== 'undefined' && localImageStorage && typeof localImageStorage.clearOrderImages === 'function') localImageStorage.clearOrderImages(orderNumber);
                loadOrders(true);
                if (typeof loadCompletedOrders === 'function') loadCompletedOrders(true);
                alert('تم حذف الطلب.');
            })
            .catch(function() {
                if (typeof removeLocalOrder === 'function') removeLocalOrder(orderNumber);
                if (typeof localImageStorage !== 'undefined' && localImageStorage && typeof localImageStorage.clearOrderImages === 'function') localImageStorage.clearOrderImages(orderNumber);
                loadOrders(true);
                if (typeof loadCompletedOrders === 'function') loadCompletedOrders(true);
                alert('تم حذف الطلب محلياً.');
            });
    } else {
        if (typeof removeLocalOrder === 'function') removeLocalOrder(orderNumber);
        if (typeof localImageStorage !== 'undefined' && localImageStorage && typeof localImageStorage.clearOrderImages === 'function') localImageStorage.clearOrderImages(orderNumber);
        loadOrders(true);
        if (typeof loadCompletedOrders === 'function') loadCompletedOrders(true);
        alert('تم حذف الطلب.');
    }
}

function editOrder(orderNumber) {
    function showOrder(order) {
        if (order) showEditOrderModal(orderNumber, order);
        else alert('الطلب غير موجود');
    }
    if (typeof db !== 'undefined' && db) {
        db.collection('orders').doc(orderNumber).get()
            .then(function(doc) {
                if (doc.exists) showOrder(doc.data());
                else showOrder(getLocalOrder(orderNumber));
            })
            .catch(function() { showOrder(getLocalOrder(orderNumber)); });
    } else {
        showOrder(getLocalOrder(orderNumber));
    }
}

function showEditOrderModal(orderNumber, order) {
    document.getElementById('editOrderNumber').value = orderNumber;
    document.getElementById('orderStatus').value = order.status || 'in-progress';
    var orderStages = order.stages || {};
    var localImages = (typeof localImageStorage !== 'undefined' && localImageStorage) ? localImageStorage.getOrderImages(orderNumber) : {};
    var allStages = {};
    for (var k in orderStages) allStages[k] = orderStages[k];
    for (var k in localImages) allStages[k] = localImages[k];
    generateStageUploads(allStages);
    document.getElementById('editOrderModal').classList.add('show');
}

var MAX_IMAGES_PER_STAGE = 4;

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

document.addEventListener('click', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('btn-show-image')) {
        var wrap = e.target.closest('.current-image');
        if (wrap) {
            var img = wrap.querySelector('img');
            if (img && img.src) {
                e.preventDefault();
                openImageLightbox(img.src);
            }
        }
    }
});

function toImageArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    return [val];
}

function isImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith('image/')) return true;
    var ext = (file.name || '').split('.').pop().toLowerCase();
    return ['jpg','jpeg','png','gif','webp','heic','heif','bmp'].indexOf(ext) >= 0;
}

function generateStageUploads(stages) {
    var container = document.getElementById('stageUploads');
    if (!container || !window.ORDER_STAGES) return;
    var orderNumber = (document.getElementById('editOrderNumber') && document.getElementById('editOrderNumber').value) || '';
    var html = '';
    for (var stageKey in window.ORDER_STAGES) {
        var stage = window.ORDER_STAGES[stageKey];
        var currentImages = toImageArray(stages[stageKey]);
        if (currentImages.length === 0 && orderNumber) {
            try {
                var data = localStorage.getItem('orderImages') || '{}';
                var images = JSON.parse(data);
                if (images[orderNumber] && images[orderNumber][stageKey]) currentImages = toImageArray(images[orderNumber][stageKey]);
            } catch (e) {}
        }
        html += '<div class="stage-upload-item"><label>' + stage.name + ' (حد أقصى 4 صور)</label><div class="stage-upload-grid">';
        for (var i = 0; i < MAX_IMAGES_PER_STAGE; i++) {
            var imgId = 'upload-' + stageKey + '-' + i;
            var imgIdCam = imgId + '-cam';
            var imgIdAlbum = imgId + '-album';
            var imgUrl = currentImages[i] || '';
            html += '<div class="stage-image-slot">';
            html += '<input type="file" id="' + imgIdCam + '" accept="image/*" capture="environment" style="display:none" onchange="handleImageUploadWithFallback(\'' + stageKey + '\', ' + i + ', this)">';
            html += '<input type="file" id="' + imgIdAlbum + '" accept="image/*" style="display:none" onchange="handleImageUploadWithFallback(\'' + stageKey + '\', ' + i + ', this)">';
            html += '<div class="upload-source-btns">';
            html += '<button type="button" class="btn btn-secondary btn-small" onclick="document.getElementById(\'' + imgIdCam + '\').click()"><i class="fas fa-camera"></i> تصوير</button>';
            html += '<button type="button" class="btn btn-secondary btn-small" onclick="document.getElementById(\'' + imgIdAlbum + '\').click()"><i class="fas fa-images"></i> الألبوم</button>';
            html += '</div>';
            if (imgUrl) {
                html += '<div class="current-image"><img src="' + imgUrl + '" alt="' + stage.name + '" class="preview-img"><button type="button" class="btn btn-secondary btn-small btn-show-image">عرض</button></div>';
            }
            html += '</div>';
        }
        html += '</div></div>';
    }
    container.innerHTML = html;
}

function compressImageForFirestore(file, maxBytes, done) {
    if (!file || !isImageFile(file)) { done(null); return; }
    if (file.size <= maxBytes) { done(file); return; }
    var img = new Image();
    var canvas = document.createElement('canvas');
    img.onload = function() {
        URL.revokeObjectURL(img.src);
        var w = img.width, h = img.height;
        var maxDim = 1200;
        if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; } else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var quality = 0.75;
        canvas.toBlob(function(blob) {
            done(blob && blob.size > 0 ? blob : file);
        }, 'image/jpeg', quality);
    };
    img.onerror = function() { if (img.src) URL.revokeObjectURL(img.src); done(file); };
    img.src = URL.createObjectURL(file);
}

function handleImageUploadWithFallback(stageKey, imageIndex, input) {
    if (!input || !input.files || !input.files[0]) return;
    if (typeof storage !== 'undefined' && storage != null) {
        handleImageUpload(stageKey, imageIndex, input);
    } else if (typeof db !== 'undefined' && db) {
        handleImageUploadToFirestore(stageKey, imageIndex, input);
    } else {
        handleLocalImageUpload(stageKey, imageIndex, input);
    }
}

function handleImageUploadToFirestore(stageKey, imageIndex, input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (!isImageFile(file)) { alert('الرجاء اختيار ملف صورة صالح (jpg, png, gif)'); input.value = ''; return; }
    var orderNumber = document.getElementById('editOrderNumber').value;
    var slot = input.parentElement;
    var originalSlot = slot ? slot.innerHTML : '';
    if (slot) slot.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
    var maxBytes = 1000 * 1024;
    compressImageForFirestore(file, maxBytes, function(blobOrFile) {
        if (!blobOrFile) { if (slot) slot.innerHTML = originalSlot; input.value = ''; return; }
        var reader = new FileReader();
        reader.onload = function(ev) {
        var base64 = ev.target.result;
        db.collection('orders').doc(orderNumber).get().then(function(doc) {
            var ex = (doc.exists ? doc.data() : {}).stages || {};
            var arr = toImageArray(ex[stageKey]);
            while (arr.length <= imageIndex) arr.push('');
            arr[imageIndex] = base64;
            ex[stageKey] = arr;
            var updateData = { status: stageKey, stages: ex };
            if (typeof firebase !== 'undefined' && firebase.firestore) updateData.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('orders').doc(orderNumber).set(updateData, { merge: true }).then(function() { return ex; });
        }).then(function(updatedStages) {
            input.setAttribute('data-url', base64);
            if (typeof updateLocalOrder === 'function') {
                var o = getLocalOrder(orderNumber) || {};
                var s = o.stages || {};
                var a = toImageArray(s[stageKey]);
                while (a.length <= imageIndex) a.push('');
                a[imageIndex] = base64;
                s[stageKey] = a;
                updateLocalOrder(orderNumber, { status: stageKey, stages: s });
            }
            var statusEl = document.getElementById('orderStatus');
            if (statusEl) statusEl.value = stageKey;
            generateStageUploads(updatedStages || {});
            if (stageKey === 'delivered') { loadOrders(); if (typeof loadCompletedOrders === 'function') loadCompletedOrders(); }
        }).catch(function(err) {
            if (slot) slot.innerHTML = originalSlot;
            console.error('صورة:', err);
            alert('فشل رفع الصورة. تأكد من تفعيل Firestore وقواعد القراءة/الكتابة.');
        });
    };
    reader.onerror = function() {
        if (slot) slot.innerHTML = originalSlot;
        alert('لم نتمكن من معالجة الصورة.');
        input.value = '';
    };
    reader.readAsDataURL(blobOrFile);
    });
}

function handleLocalImageUpload(stageKey, imageIndex, input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var orderNumberEl = document.getElementById('editOrderNumber');
    var orderNumber = orderNumberEl ? orderNumberEl.value : '';
    if (!isImageFile(file)) { alert('الرجاء اختيار ملف صورة صالح'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت'); return; }
    var slot = input.parentElement;
    var originalSlot = slot ? slot.innerHTML : '';
    if (slot) { slot.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...'; }
    var reader = new FileReader();
    reader.onload = function(e) {
        var base64 = e.target.result;
        try {
            var existingData = localStorage.getItem('orderImages') || '{}';
            var images = JSON.parse(existingData);
            if (!images[orderNumber]) images[orderNumber] = {};
            var arr = toImageArray(images[orderNumber][stageKey]);
            while (arr.length <= imageIndex) arr.push('');
            arr[imageIndex] = base64;
            images[orderNumber][stageKey] = arr;
            localStorage.setItem('orderImages', JSON.stringify(images));
            input.setAttribute('data-url', base64);
            if (typeof updateLocalOrder === 'function') {
                var existingOrder = getLocalOrder(orderNumber) || {};
                var existingStages = existingOrder.stages || {};
                for (var k in images[orderNumber]) existingStages[k] = images[orderNumber][k];
                updateLocalOrder(orderNumber, { status: stageKey, stages: existingStages });
            }
            var statusEl = document.getElementById('orderStatus');
            if (statusEl) statusEl.value = stageKey;
            generateStageUploads(images[orderNumber] || {});
        } catch (err) {
            if (slot) slot.innerHTML = originalSlot;
            console.error('خطأ حفظ الصورة:', err);
            alert('فشل حفظ الصورة. قد يكون تخزين الجهاز ممتلئاً.');
        }
        if (stageKey === 'delivered') { loadOrders(); if (typeof loadCompletedOrders === 'function') loadCompletedOrders(); }
    };
    reader.onerror = function() {
        if (slot) slot.innerHTML = originalSlot;
        alert('لم نتمكن من قراءة الصورة. جرّب صيغة أخرى أو صوّر من جديد.');
    };
    reader.readAsDataURL(file);
}

function handleImageUpload(stageKey, imageIndex, input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (!isImageFile(file)) { alert('الرجاء اختيار ملف صورة صالح'); input.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت'); input.value = ''; return; }
    var orderNumber = document.getElementById('editOrderNumber').value;
    var slot = input.parentElement;
    var originalSlot = slot ? slot.innerHTML : '';
    if (slot) slot.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';

    function onStorageSuccess(downloadURL) {
            input.setAttribute('data-url', downloadURL);
            if (typeof db !== 'undefined' && db && typeof firebase !== 'undefined' && firebase.firestore) {
                db.collection('orders').doc(orderNumber).get().then(function(doc) {
                    var ex = (doc.exists ? doc.data() : {}).stages || {};
                    var arr = toImageArray(ex[stageKey]);
                    while (arr.length <= imageIndex) arr.push('');
                    arr[imageIndex] = downloadURL;
                    ex[stageKey] = arr;
                    return db.collection('orders').doc(orderNumber).update({
                        status: stageKey,
                        stages: ex,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }).catch(function() {});
            }
            var mergedStages = {};
            try {
                var localImgs = JSON.parse(localStorage.getItem('orderImages') || '{}');
                if (localImgs[orderNumber]) for (var k in localImgs[orderNumber]) mergedStages[k] = localImgs[orderNumber][k];
            } catch (e) {}
            var arr = toImageArray(mergedStages[stageKey]);
            while (arr.length <= imageIndex) arr.push('');
            arr[imageIndex] = downloadURL;
            mergedStages[stageKey] = arr;
            if (typeof updateLocalOrder === 'function') {
                var existingOrder = getLocalOrder(orderNumber) || {};
                var existingStages = existingOrder.stages || {};
                existingStages[stageKey] = mergedStages[stageKey];
                updateLocalOrder(orderNumber, { status: stageKey, stages: existingStages });
            }
            var statusEl = document.getElementById('orderStatus');
            if (statusEl) statusEl.value = stageKey;
            generateStageUploads(mergedStages);
            if (stageKey === 'delivered') { loadOrders(); if (typeof loadCompletedOrders === 'function') loadCompletedOrders(); }
    }

    function onUploadFail() {
        if (slot) slot.innerHTML = originalSlot;
        // إذا فشل Storage، حفظ الصورة مباشرة في Firestore (تعمل بدون تفعيل Storage)
        if (file.size <= 1200 * 1024 && typeof db !== 'undefined' && db) {
            var reader = new FileReader();
            reader.onload = function(ev) {
                var base64 = ev.target.result;
                db.collection('orders').doc(orderNumber).get().then(function(doc) {
                    var ex = (doc.exists ? doc.data() : {}).stages || {};
                    var arr = toImageArray(ex[stageKey]);
                    while (arr.length <= imageIndex) arr.push('');
                    arr[imageIndex] = base64;
                    ex[stageKey] = arr;
                    return db.collection('orders').doc(orderNumber).set({ status: stageKey, stages: ex, lastUpdated: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date() }, { merge: true });
                }).then(function() {
                    input.setAttribute('data-url', base64);
                    if (typeof updateLocalOrder === 'function') {
                        var o = getLocalOrder(orderNumber) || {};
                        var s = o.stages || {};
                        var a = toImageArray(s[stageKey]);
                        while (a.length <= imageIndex) a.push('');
                        a[imageIndex] = base64;
                        s[stageKey] = a;
                        updateLocalOrder(orderNumber, { status: stageKey, stages: s });
                    }
                    var statusEl = document.getElementById('orderStatus');
                    if (statusEl) statusEl.value = stageKey;
                    generateStageUploads({});
                    if (slot) slot.innerHTML = originalSlot;
                }).catch(function() {
                    handleLocalImageUpload(stageKey, imageIndex, input);
                });
            };
            reader.readAsDataURL(file);
        } else {
            handleLocalImageUpload(stageKey, imageIndex, input);
        }
    }

    try {
        var storageRef = storage.ref();
        var imageRef = storageRef.child('orders/' + orderNumber + '/' + stageKey + '-' + imageIndex + '.jpg');
        imageRef.put(file).then(function(snapshot) { return snapshot.ref.getDownloadURL(); })
            .then(onStorageSuccess)
            .catch(onUploadFail);
    } catch (e) {
        onUploadFail();
    }
}

function closeEditOrderModal() {
    var modal = document.getElementById('editOrderModal');
    var form = document.getElementById('editOrderForm');
    if (modal) modal.classList.remove('show');
    if (form) form.reset();
}

function updateOrder() {
    var orderNumber = document.getElementById('editOrderNumber').value;
    var newStatus = document.getElementById('orderStatus').value;
    var ORDER_STAGES = window.ORDER_STAGES || {};
    var stages = {};
    for (var stageKey in ORDER_STAGES) {
        var arr = [];
        for (var i = 0; i < MAX_IMAGES_PER_STAGE; i++) {
            var inputCam = document.getElementById('upload-' + stageKey + '-' + i + '-cam');
            var inputAlbum = document.getElementById('upload-' + stageKey + '-' + i + '-album');
            var url = (inputCam && inputCam.getAttribute('data-url')) || (inputAlbum && inputAlbum.getAttribute('data-url'));
            if (url) arr.push(url);
        }
        if (arr.length) stages[stageKey] = arr;
    }
    try {
        var existingData = localStorage.getItem('orderImages') || '{}';
        var localImages = JSON.parse(existingData);
        if (localImages[orderNumber]) { for (var k in localImages[orderNumber]) stages[k] = localImages[orderNumber][k]; }
    } catch (e) {}
    var existingOrder = getLocalOrder(orderNumber) || {};
    var existingStages = existingOrder.stages || {};
    var mergedStages = {};
    for (var k in existingStages) mergedStages[k] = existingStages[k];
    for (var k in stages) mergedStages[k] = stages[k];

    function doLocalUpdate() {
        updateLocalOrder(orderNumber, { status: newStatus, stages: mergedStages });
        closeEditOrderModal();
        loadOrders(true);
        if (typeof loadCompletedOrders === 'function') loadCompletedOrders(true);
        alert('تم تحديث الطلب بنجاح!');
    }
    if (typeof db !== 'undefined' && db && typeof firebase !== 'undefined' && firebase.firestore) {
        db.collection('orders').doc(orderNumber).get()
            .then(function(doc) {
                var ex = (doc.exists ? doc.data() : {}).stages || {};
                var stages2 = {}; for (var k in ex) stages2[k] = ex[k];
                for (var sk in stages) { var sarr = toImageArray(stages[sk]); if (sarr.length) stages2[sk] = sarr; }
                return db.collection('orders').doc(orderNumber).update({ status: newStatus, stages: stages2, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() });
            })
            .then(function() {
                updateLocalOrder(orderNumber, { status: newStatus, stages: mergedStages });
                closeEditOrderModal();
                loadOrders(true);
                if (typeof loadCompletedOrders === 'function') loadCompletedOrders(true);
                alert('تم تحديث الطلب بنجاح!');
            })
            .catch(doLocalUpdate);
    } else {
        doLocalUpdate();
    }
}

function previewImage(stageKey, imageIndex) {
    var idx = imageIndex != null ? imageIndex : 0;
    var input = document.getElementById('upload-' + stageKey + '-' + idx);
    var url = input && input.getAttribute('data-url');
    if (url) { window.open(url, '_blank'); return; }
    var orderNumber = document.getElementById('editOrderNumber').value;
    if (orderNumber) {
        try {
            var data = localStorage.getItem('orderImages') || '{}';
            var images = JSON.parse(data);
            var arr = toImageArray(images[orderNumber] && images[orderNumber][stageKey]);
            if (arr[idx]) { window.open(arr[idx], '_blank'); return; }
        } catch (e) {}
    }
    alert('لم يتم رفع صورة لهذه المرحلة بعد');
}

function filterOrdersBySearch() {
    var tableBody = document.getElementById('ordersTableBody');
    if (!tableBody || !_cachedOrdersList) return;
    var el = document.getElementById('orderSearchInput');
    var q = el ? normalizeOrderNumberInput((el.value || '').trim()) : '';
    var list = q ? _cachedOrdersList.filter(function(item) { return String(item.id).indexOf(q) >= 0; }) : _cachedOrdersList;
    function fmt(d) {
        if (!d) return 'N/A';
        if (d.toDate) return (typeof formatDate === 'function' ? formatDate(d) : d.toDate().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        if (typeof d === 'string') return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        if (d.seconds) return new Date(d.seconds * 1000).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return 'N/A';
    }
    function renderRow(item) {
        var orderNumber = item.id;
        var order = item.data || item;
        var status = order.status || 'in-progress';
        var statusName = (window.ORDER_STAGES && window.ORDER_STAGES[status]) ? window.ORDER_STAGES[status].name : status;
        var dateStr = fmt(order.lastUpdated);
        return '<tr><td><strong>' + orderNumber + '</strong></td><td><span class="status-badge status-' + status + '">' + statusName + '</span></td><td>' + dateStr + '</td><td><button onclick="editOrder(\'' + orderNumber + '\')" class="btn btn-secondary btn-small"><i class="fas fa-edit"></i> تعديل</button> <button onclick="confirmDeleteOrder(\'' + orderNumber + '\')" class="btn btn-secondary btn-small" style="color:#e74c3c;"><i class="fas fa-trash-alt"></i> حذف</button></td></tr>';
    }
    if (list.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading-row">' + (q ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات قيد التنفيذ') + '</td></tr>';
    } else {
        tableBody.innerHTML = list.map(renderRow).join('');
    }
}

function filterCompletedOrdersBySearch() {
    var tableBody = document.getElementById('completedOrdersTableBody');
    if (!tableBody || !_cachedCompletedOrdersList) return;
    var el = document.getElementById('completedOrderSearchInput');
    var q = el ? normalizeOrderNumberInput((el.value || '').trim()) : '';
    var list = q ? _cachedCompletedOrdersList.filter(function(item) { return String(item.id).indexOf(q) >= 0; }) : _cachedCompletedOrdersList;
    function fmt(d) {
        if (!d) return 'N/A';
        if (d.toDate) return (typeof formatDate === 'function' ? formatDate(d) : d.toDate().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        if (typeof d === 'string') return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        if (d.seconds) return new Date(d.seconds * 1000).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return 'N/A';
    }
    function renderRow(item) {
        var orderNumber = item.id;
        var order = item.data || item;
        var status = order.status || 'in-progress';
        var statusName = (window.ORDER_STAGES && window.ORDER_STAGES[status]) ? window.ORDER_STAGES[status].name : status;
        var dateStr = fmt(order.lastUpdated);
        return '<tr><td><strong>' + orderNumber + '</strong></td><td><span class="status-badge status-' + status + '">' + statusName + '</span></td><td>' + dateStr + '</td><td><button onclick="editOrder(\'' + orderNumber + '\')" class="btn btn-secondary btn-small"><i class="fas fa-edit"></i> تعديل</button> <button onclick="confirmDeleteOrder(\'' + orderNumber + '\')" class="btn btn-secondary btn-small" style="color:#e74c3c;"><i class="fas fa-trash-alt"></i> حذف</button></td></tr>';
    }
    if (list.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading-row">' + (q ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات في تم الإنجاز بعد.') + '</td></tr>';
    } else {
        tableBody.innerHTML = list.map(renderRow).join('');
    }
}

window.loadOrders = loadOrders;
window.filterOrdersBySearch = filterOrdersBySearch;
window.filterCompletedOrdersBySearch = filterCompletedOrdersBySearch;
window.loadCompletedOrders = loadCompletedOrders;
window.showAddOrderModal = showAddOrderModal;
window.closeAddOrderModal = closeAddOrderModal;
window.addNewOrder = addNewOrder;
window.confirmDeleteOrder = confirmDeleteOrder;
window.editOrder = editOrder;
window.closeEditOrderModal = closeEditOrderModal;
window.handleImageUploadWithFallback = handleImageUploadWithFallback;
window.handleImageUpload = handleImageUpload;
window.previewImage = previewImage;
window.openImageLightbox = openImageLightbox;
window.closeImageLightbox = closeImageLightbox;
window.normalizeDigitsToAscii = normalizeDigitsToAscii;
window.normalizeOrderNumberInput = normalizeOrderNumberInput;
