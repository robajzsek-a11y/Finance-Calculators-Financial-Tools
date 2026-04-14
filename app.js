/*------------2026 Pomerancee. All rights reserved.-----------------*/
/*------------Licensed under CC BY-NC-SA 4.0------------------------*/

// ── Tile border SVG path initialisation ───────────────────────────────
// Each tile has an SVG overlay with 3 <path> elements that trace the
// tile rectangle perimeter. We set a rounded-rect path using the actual
// pixel dimensions so vector-effect:non-scaling-stroke keeps lines crisp.
function initTileBorders() {
    document.querySelectorAll('.calc-tile').forEach((tile) => {
        const svg = tile.querySelector('.tile-border');
        if (!svg) return;

        const paths = svg.querySelectorAll('path');
        if (!paths.length) return;

        // Use the SVG viewBox (0 0 100 100) with a rectangle path.
        // preserveAspectRatio="none" on the SVG makes it stretch to fill the tile.
        // pathLength="100" keeps stroke-dasharray percentages consistent.
        const r = 8;  // corner radius in viewBox units
        const d = `M ${r},0 L ${100 - r},0 Q 100,0 100,${r} L 100,${100 - r} Q 100,100 ${100 - r},100 L ${r},100 Q 0,100 0,${100 - r} L 0,${r} Q 0,0 ${r},0 Z`;
        paths.forEach((path) => path.setAttribute('d', d));
    });
}

initTileBorders();

// ── Click ripple effect ────────────────────────────────────────────────
document.addEventListener('click', (e) => {
    const ripple = document.createElement('div');
    ripple.classList.add('bg-click-ripple');
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top  = `${e.clientY}px`;
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
});

// ── Parallax orbs on mouse move ────────────────────────────────────────
const orb1 = document.querySelector('.orb-1');
const orb2 = document.querySelector('.orb-2');

document.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    if (orb1) {
        orb1.style.transform = `translate(${dx * 18}px, ${dy * 18}px) scale(1)`;
    }
    if (orb2) {
        orb2.style.transform = `translate(${-dx * 14}px, ${-dy * 14}px) scale(1)`;
    }
});

// ── Tile tilt effect on hover ──────────────────────────────────────────
const tiles = document.querySelectorAll('.calc-tile');

tiles.forEach((tile) => {
    tile.addEventListener('mousemove', (e) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const rect = tile.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width  / 2;
        const cy = rect.height / 2;

        const rotateX = ((y - cy) / cy) * -5;  // max ±5deg
        const rotateY = ((x - cx) / cx) *  5;

        tile.style.transform = `
            translateY(-6px) scale(1.018)
            perspective(800px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
        `;
    });

    tile.addEventListener('mouseleave', () => {
        tile.style.transform = '';
    });
});

// ── Intersection Observer — animate tiles in on scroll ─────────────────
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 }
    );

    tiles.forEach((tile) => {
        tile.style.animationPlayState = 'paused';
        observer.observe(tile);
    });
}


// ── Language System ────────────────────────────────────────────────────
(function initLanguageSystem() {
    const customSelectWrapper = document.getElementById('custom-language-select');
    const selectedOption = document.getElementById('selected-language');
    const optionsContainer = document.getElementById('language-options');
    const hiddenSelect = document.getElementById('language-select');

    if (!customSelectWrapper || !selectedOption || !optionsContainer || !hiddenSelect) {
        console.warn('Language selector elements not found');
        return;
    }

    // Language options matching the select element
    const languages = [
        { code: 'en', name: 'English (US/UK)' },
        { code: 'cs', name: 'Čeština (Czech)' },
        { code: 'de', name: 'Deutsch (German)' },
        { code: 'fr', name: 'Français (French)' },
        { code: 'es', name: 'Español (Spanish)' },
        { code: 'it', name: 'Italiano (Italian)' },
        { code: 'sv', name: 'Svenska (Swedish)' },
        { code: 'no', name: 'Norsk (Norwegian)' },
        { code: 'da', name: 'Dansk (Danish)' },
        { code: 'pl', name: 'Polski (Polish)' },
        { code: 'hu', name: 'Magyar (Hungarian)' },
        { code: 'ro', name: 'Română (Romanian)' },
        { code: 'bg', name: 'Български (Bulgarian)' },
        { code: 'ru', name: 'Русский (Russian)' },
        { code: 'tr', name: 'Türkçe (Turkish)' },
        { code: 'ja', name: '日本語 (Japanese)' }
    ];

    // Detect best language using the Language Algorithm
    const supportedLanguages = languages.map(l => l.code);
    let currentLanguage = 'en';

    if (window.LanguageAlgorithm && window.LanguageAlgorithm.detectBestLanguage) {
        currentLanguage = window.LanguageAlgorithm.detectBestLanguage(supportedLanguages, 'en');
    }

    // Check localStorage for saved preference
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
        currentLanguage = savedLanguage;
    }

    // Populate custom dropdown
    languages.forEach((lang, index) => {
        const option = document.createElement('div');
        option.className = 'custom-option';
        option.textContent = lang.name;
        option.dataset.value = lang.code;
        option.style.setProperty('--stagger-index', index);
        option.setAttribute('role', 'option');
        option.setAttribute('tabindex', '0');
        
        if (lang.code === currentLanguage) {
            option.classList.add('selected');
        }

        option.addEventListener('click', () => selectLanguage(lang.code, lang.name));
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectLanguage(lang.code, lang.name);
            }
        });

        optionsContainer.appendChild(option);
    });

    // Toggle dropdown
    selectedOption.addEventListener('click', toggleDropdown);
    selectedOption.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
        }
    });

    function toggleDropdown() {
        const isOpen = customSelectWrapper.classList.toggle('open');
        selectedOption.setAttribute('aria-expanded', isOpen);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!customSelectWrapper.contains(e.target)) {
            customSelectWrapper.classList.remove('open');
            selectedOption.setAttribute('aria-expanded', 'false');
        }
    });

    // Select language function
    function selectLanguage(code, name) {
        currentLanguage = code;
        localStorage.setItem('selectedLanguage', code);

        // Update UI
        selectedOption.querySelector('.option-text').textContent = name;
        hiddenSelect.value = code;

        // Update selected state
        optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === code);
        });

        // Close dropdown
        customSelectWrapper.classList.remove('open');
        selectedOption.setAttribute('aria-expanded', 'false');

        // Apply translations
        applyTranslations(code);
    }

    // Apply translations to the page
    function applyTranslations(langCode) {
        if (!window.App || !window.App.translations || !window.App.translations[langCode]) {
            console.warn(`Translations for language "${langCode}" not found`);
            return;
        }

        const translations = window.App.translations[langCode];

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });

        // Update elements with data-i18n-alt attribute (for alt text)
        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            if (translations[key]) {
                element.setAttribute('alt', translations[key]);
            }
        });

        // Update elements with data-i18n-aria-label attribute
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            if (translations[key]) {
                element.setAttribute('aria-label', translations[key]);
            }
        });

        // Update elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (translations[key]) {
                element.setAttribute('title', translations[key]);
            }
        });

        // Update meta tags with data-i18n-content attribute
        document.querySelectorAll('meta[data-i18n-content]').forEach(element => {
            const key = element.getAttribute('data-i18n-content');
            if (translations[key]) {
                element.setAttribute('content', translations[key]);
            }
        });

        // Update page title
        const titleElement = document.getElementById('page-title');
        if (titleElement && translations.metaTitle) {
            titleElement.textContent = translations.metaTitle;
            document.title = translations.metaTitle;
        }

        // Update HTML lang attribute
        document.documentElement.setAttribute('lang', langCode);
    }

    // Initialize with current language
    const currentLang = languages.find(l => l.code === currentLanguage);
    if (currentLang) {
        selectedOption.querySelector('.option-text').textContent = currentLang.name;
        hiddenSelect.value = currentLanguage;
        applyTranslations(currentLanguage);
    }
})();
