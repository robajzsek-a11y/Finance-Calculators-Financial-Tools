window.LanguageAlgorithm = window.LanguageAlgorithm || {};

window.LanguageAlgorithm.normalizeLanguageCode = function normalizeLanguageCode(langCode) {
    if (!langCode || typeof langCode !== 'string') return 'en';
    return langCode.toLowerCase().split('-')[0];
};

window.LanguageAlgorithm.detectBestLanguage = function detectBestLanguage(supportedLanguages, fallbackLanguage = 'en') {
    const supported = Array.isArray(supportedLanguages) ? supportedLanguages : [];
    if (supported.length === 0) return fallbackLanguage;

    const primary = window.LanguageAlgorithm.normalizeLanguageCode(navigator.language || navigator.userLanguage || '');
    if (supported.includes(primary)) return primary;

    const allBrowserLanguages = (navigator.languages || [])
        .map(window.LanguageAlgorithm.normalizeLanguageCode)
        .filter(Boolean);

    for (const code of allBrowserLanguages) {
        if (supported.includes(code)) return code;
    }

    return supported.includes(fallbackLanguage) ? fallbackLanguage : supported[0];
};
