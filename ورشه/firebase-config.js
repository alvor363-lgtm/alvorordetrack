// Firebase Configuration — يقرأ من firebase-config.local.js إن وُجد
(function() {
    if (window.__firebaseConfigLoaded) return;
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK غير محمّل.');
        window.db = null;
        window.storage = null;
        window.ORDER_STAGES = {};
        window.generateOrderNumber = function() { return String(Math.floor(Math.random() * 900000) + 100000); };
        window.formatDate = function() { return 'N/A'; };
        window.getStatusIndex = function() { return -1; };
        window.isStageCompleted = function() { return false; };
        return;
    }
    window.__firebaseConfigLoaded = true;
    var cfg = window.__FIREBASE_CONFIG || {
        apiKey: "your-api-key-here",
        authDomain: "your-project-id.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project-id.appspot.com",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id"
    };
    if (cfg.projectId === "your-project-id" || cfg.apiKey === "your-api-key-here") {
        window.db = null;
        window.storage = null;
        window.firebaseConfig = cfg;
    } else {
        firebase.initializeApp(cfg);
        window.firebaseConfig = cfg;
        window.db = firebase.firestore();
        try { 
            window.storage = (window.__NO_FIREBASE_STORAGE ? null : firebase.storage()); 
        } catch (e) { window.storage = null; }
    }

    window.ORDER_STAGES = {
    'in-progress': {
        name: 'بدينا نشتغل على طلبك',
        icon: 'fa-cogs',
        description: 'بدينا نشتغل على طلبك.'
    },
    'finishing': {
        name: 'قاعدين نضبطه',
        icon: 'fa-spray-can',
        description: 'قاعدين نضبطه ونصلحه.'
    },
    'ready': {
        name: 'خلص طلبك',
        icon: 'fa-box-open',
        description: 'خلص طلبك وجاهز.'
    },
    'wrapping': {
        name: 'تم تغليف الطلب',
        icon: 'fa-box',
        description: 'تم تغليف الطلب.'
    },
    'delivered': {
        name: 'طلع لك',
        icon: 'fa-truck',
        description: 'طلع لك ووصل.'
    }
};
    window.generateOrderNumber = function() {
    const number = Math.floor(Math.random() * 900000) + 100000;
    return String(number);
};
    window.formatDate = function(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
    window.getStatusIndex = function(status) {
    const statusOrder = ['in-progress', 'finishing', 'ready', 'wrapping', 'delivered'];
    var idx = statusOrder.indexOf(status);
    return idx >= 0 ? idx : 0;
};
    window.isStageCompleted = function(currentStatus, stageStatus) {
    return window.getStatusIndex(currentStatus) >= window.getStatusIndex(stageStatus);
};
})();
