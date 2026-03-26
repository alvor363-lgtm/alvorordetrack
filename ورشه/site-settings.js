/**
 * تطبيق اسم الموقع والشعار على جميع الصفحات من إعدادات المدير
 */
(function() {
    var DEFAULT_LOGO = 'KEQ5y0IEb8P1M8Bn1yKjqayvzrDv9Qt6Km7Doa1S.avif';

    function applySiteSettings() {
        var name = (localStorage.getItem('alvor-site-name') || 'Alvor').trim() || 'Alvor';
        var logoUrl = (localStorage.getItem('alvor-logo-url') || '').trim();

        document.querySelectorAll('.site-name').forEach(function(el) {
            el.textContent = name;
        });
        document.querySelectorAll('.site-logo').forEach(function(img) {
            img.src = logoUrl || DEFAULT_LOGO;
            img.alt = name;
        });

        var prefix = document.body.getAttribute('data-page-title-prefix');
        var suffix = document.body.getAttribute('data-page-title-suffix');
        if (prefix) document.title = prefix + ' - ' + name;
        else if (suffix) document.title = name + ' - ' + suffix;

        var heroBanner = document.getElementById('heroBannerImg');
        if (heroBanner) heroBanner.alt = 'جودة أحسن - ' + name;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applySiteSettings);
    } else {
        applySiteSettings();
    }
    window.applySiteSettings = applySiteSettings;
})();
