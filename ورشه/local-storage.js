// Local storage fallback for testing without Firebase
// Orders + images stored in localStorage - no subscription needed

const LOCAL_ORDERS_KEY = 'localOrders';

// --- Local Orders ---
function getLocalOrder(orderNumber) {
    try {
        const data = localStorage.getItem(LOCAL_ORDERS_KEY) || '{}';
        const orders = JSON.parse(data);
        return orders[orderNumber] || null;
    } catch (e) {
        return null;
    }
}

function getAllLocalOrders() {
    try {
        const data = localStorage.getItem(LOCAL_ORDERS_KEY) || '{}';
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

function saveLocalOrder(orderNumber, orderData) {
    const orders = getAllLocalOrders();
    orders[orderNumber] = {
        ...orderData,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

function addLocalOrder(orderNumber, orderData) {
    saveLocalOrder(orderNumber, { ...orderData, status: 'in-progress', stages: {} });
}

function updateLocalOrder(orderNumber, updates) {
    const existing = getLocalOrder(orderNumber) || {};
    saveLocalOrder(orderNumber, { ...existing, ...updates });
}

function orderExistsLocally(orderNumber) {
    return getLocalOrder(orderNumber) !== null;
}

function removeLocalOrder(orderNumber) {
    try {
        const orders = getAllLocalOrders();
        delete orders[orderNumber];
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
        return true;
    } catch (e) {
        return false;
    }
}

// Expose
window.getLocalOrder = getLocalOrder;
window.getAllLocalOrders = getAllLocalOrders;
window.saveLocalOrder = saveLocalOrder;
window.addLocalOrder = addLocalOrder;
window.updateLocalOrder = updateLocalOrder;
window.orderExistsLocally = orderExistsLocally;
window.removeLocalOrder = removeLocalOrder;

// --- الموظفون (Staff) ---
const LOCAL_STAFF_KEY = 'localStaff';

function getAllLocalStaff() {
    try {
        const data = localStorage.getItem(LOCAL_STAFF_KEY) || '[]';
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveAllLocalStaff(arr) {
    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(arr || []));
}

function addLocalStaff(staff) {
    var list = getAllLocalStaff();
    staff.id = 'staff-' + Date.now();
    staff.createdAt = new Date().toISOString();
    list.push(staff);
    saveAllLocalStaff(list);
    return staff.id;
}

function updateLocalStaff(id, updates) {
    var list = getAllLocalStaff();
    var i = list.findIndex(function(s) { return s.id === id; });
    if (i === -1) return false;
    list[i] = Object.assign({}, list[i], updates);
    saveAllLocalStaff(list);
    return true;
}

function removeLocalStaff(id) {
    var list = getAllLocalStaff().filter(function(s) { return s.id !== id; });
    saveAllLocalStaff(list);
}

window.getAllLocalStaff = getAllLocalStaff;
window.saveAllLocalStaff = saveAllLocalStaff;
window.addLocalStaff = addLocalStaff;
window.updateLocalStaff = updateLocalStaff;
window.removeLocalStaff = removeLocalStaff;

class LocalImageStorage {
    constructor() {
        this.storageKey = 'orderImages';
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Store image for a specific order and stage
    async storeImage(orderNumber, stageKey, file) {
        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('الرجاء اختيار ملف صورة صالح');
            }
            
            if (file.size > this.maxImageSize) {
                throw new Error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
            }

            // Convert to base64
            const base64 = await this.fileToBase64(file);
            
            // Get existing images
            const existingData = localStorage.getItem(this.storageKey);
            const images = existingData ? JSON.parse(existingData) : {};
            
            // Store new image
            if (!images[orderNumber]) {
                images[orderNumber] = {};
            }
            images[orderNumber][stageKey] = base64;
            
            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(images));
            
            return base64;
        } catch (error) {
            console.error('Error storing image locally:', error);
            throw error;
        }
    }

    // Get image for a specific order and stage
    getImage(orderNumber, stageKey) {
        try {
            const existingData = localStorage.getItem(this.storageKey);
            const images = existingData ? JSON.parse(existingData) : {};
            
            return images[orderNumber] && images[orderNumber][stageKey] 
                ? images[orderNumber][stageKey] 
                : null;
        } catch (error) {
            console.error('Error getting image locally:', error);
            return null;
        }
    }

    // Get all images for an order
    getOrderImages(orderNumber) {
        try {
            const existingData = localStorage.getItem(this.storageKey);
            const images = existingData ? JSON.parse(existingData) : {};
            
            return images[orderNumber] || {};
        } catch (error) {
            console.error('Error getting order images locally:', error);
            return {};
        }
    }

    // Clear all images
    clearImages() {
        localStorage.removeItem(this.storageKey);
    }

    // Clear images for a specific order
    clearOrderImages(orderNumber) {
        try {
            const existingData = localStorage.getItem(this.storageKey);
            const images = existingData ? JSON.parse(existingData) : {};
            
            if (images[orderNumber]) {
                delete images[orderNumber];
                localStorage.setItem(this.storageKey, JSON.stringify(images));
            }
        } catch (error) {
            console.error('Error clearing order images locally:', error);
        }
    }
}

// Create global instance
const localImageStorage = new LocalImageStorage();

// Enhanced upload function for local testing
async function handleLocalImageUpload(stageKey, input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const orderNumber = document.getElementById('editOrderNumber').value;
        
        try {
            // Show loading indicator
            const uploadBtn = input.nextElementSibling;
            const originalText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
            uploadBtn.disabled = true;
            
            // Store image locally
            const imageUrl = await localImageStorage.storeImage(orderNumber, stageKey, file);
            
            // Store the URL in a data attribute
            input.setAttribute('data-url', imageUrl);
            console.log(`${stageKey} image uploaded locally:`, imageUrl);
            
            // Update preview
            generateStageUploads({});
            
            // Show success message
            uploadBtn.innerHTML = '<i class="fas fa-check"></i> تم الرفع (محلي)';
            setTimeout(() => {
                uploadBtn.innerHTML = originalText;
                uploadBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error uploading image locally:', error);
            alert('خطأ في رفع الصورة: ' + error.message);
            
            // Reset button
            const uploadBtn = input.nextElementSibling;
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
        }
    }
}

// Check if Firebase is configured
function isFirebaseConfigured() {
    var cfg = window.firebaseConfig || (typeof firebaseConfig !== 'undefined' ? firebaseConfig : null);
    return cfg && cfg.apiKey && cfg.apiKey !== "your-api-key-here";
}

// handleImageUploadWithFallback من orders-shared.js

// Make functions globally available
window.localImageStorage = localImageStorage;
window.handleLocalImageUpload = handleLocalImageUpload;
window.isFirebaseConfigured = isFirebaseConfigured;

console.log('🔧 Local storage image system loaded');
console.log('📝 Firebase configured:', isFirebaseConfigured() ? 'Yes' : 'No (using local storage)');
