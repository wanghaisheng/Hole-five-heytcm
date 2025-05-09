document.addEventListener('DOMContentLoaded', () => {
    const langSelector = document.getElementById('lang-selector');
    let currentLang = localStorage.getItem('preferredLang') || navigator.language.split('-')[0] || 'en';
    
    const translations = {};

    async function fetchTranslations(lang) {
        try {
            const response = await fetch(`locale/${lang}.json`);
            if (!response.ok) {
                console.error(`Could not load ${lang}.json. Status: ${response.status}`);
                // Fallback to English if current lang file fails
                if (lang !== 'en') {
                    return fetchTranslations('en');
                }
                return null; // If English also fails
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${lang}.json:`, error);
             if (lang !== 'en') {
                return fetchTranslations('en');
            }
            return null;
        }
    }

    function applyTranslations(langData) {
        if (!langData) {
            console.warn("No translation data to apply.");
            return;
        }

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (langData[key]) {
                element.textContent = langData[key];
            }
        });

        document.querySelectorAll('[data-i18n-attr]').forEach(element => {
            const attrConfig = element.getAttribute('data-i18n-attr');
            // Example: "alt:image_alt_key;title:image_title_key;aria-label:label_key"
            attrConfig.split(';').forEach(pair => {
                const [attr, key] = pair.split(':');
                if (langData[key]) {
                    element.setAttribute(attr, langData[key]);
                }
            });
        });
        
        // Update HTML lang attribute
        document.documentElement.lang = currentLang;

        // Update specific Schema.org properties that are language-dependent
        const schemaElement = document.getElementById('videoGameSchema');
        if (schemaElement && langData.meta_title && langData.meta_description) {
            try {
                const schemaData = JSON.parse(schemaElement.textContent);
                schemaData.name = langData.game_title_main || "Hole Wuxing";
                schemaData.description = langData.meta_description;
                if (schemaData.publisher && langData.publisher_name) {
                    schemaData.publisher.name = langData.publisher_name;
                }
                // Potentially update other fields like alternateName if available in JSON
                // Example: if (langData.game_alternate_name) schemaData.alternateName = langData.game_alternate_name;
                schemaElement.textContent = JSON.stringify(schemaData, null, 2);
            } catch(e) {
                console.error("Error updating Schema.org JSON-LD:", e);
            }
        }
    }

    async function loadAndApplyTranslations(lang) {
        currentLang = lang;
        if (!translations[lang]) {
            translations[lang] = await fetchTranslations(lang);
        }
        if (translations[lang]) {
            applyTranslations(translations[lang]);
            localStorage.setItem('preferredLang', lang);
            if (langSelector) langSelector.value = lang;
        } else {
            console.error("Failed to load translations for:", lang);
            // If chosen lang fails, try to default to English if not already English
            if (lang !== 'en' && translations['en']) {
                 applyTranslations(translations['en']);
                 localStorage.setItem('preferredLang', 'en');
                 if (langSelector) langSelector.value = 'en';
            }
        }
    }

    if (langSelector) {
        langSelector.value = currentLang; // Set dropdown to current/detected lang
        langSelector.addEventListener('change', (event) => {
            loadAndApplyTranslations(event.target.value);
        });
    }

    // Initial load
    loadAndApplyTranslations(currentLang);

    // Intersection Observer for animations
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const intersectionObserverSupported = 'IntersectionObserver' in window &&
                                        'IntersectionObserverEntry' in window &&
                                        'intersectionRatio' in window.IntersectionObserverEntry.prototype;

    if (animatedElements.length > 0 && intersectionObserverSupported) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Optional: stop observing after it's visible if animation is one-time
                    // obs.unobserve(entry.target); 
                } else {
                    // Optional: remove class if you want animation to replay on scroll out and back in
                    // entry.target.classList.remove('is-visible');
                }
            });
        }, { 
            threshold: 0.1, // Trigger when 10% of the element is visible
        });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    } else { 
        // Fallback for browsers without IntersectionObserver or if no elements to animate
        animatedElements.forEach(el => el.classList.add('is-visible'));
    }
});