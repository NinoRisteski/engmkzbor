// Configuration
const LIBRETRANSLATE_API = 'https://libretranslate.com/translate';
const TARGET_LANG = 'mk'; // Macedonian

class YouTubeTranslator {
    constructor() {
        this.subtitleContainer = null;
        this.currentSubtitle = null;
        this.enabled = true;
        this.setupSubtitleContainer();
        this.startCaptionObserver();
        this.loadState();
        this.setupMessageListener();
    }

    async loadState() {
        const result = await chrome.storage.local.get(['translationEnabled']);
        this.enabled = result.translationEnabled !== false;
        this.subtitleContainer.style.display = this.enabled ? 'block' : 'none';
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'toggleTranslation') {
                this.enabled = message.enabled;
                this.subtitleContainer.style.display = this.enabled ? 'block' : 'none';
            }
        });
    }

    setupSubtitleContainer() {
        this.subtitleContainer = document.createElement('div');
        this.subtitleContainer.id = 'mk-translation-container';
        document.body.appendChild(this.subtitleContainer);
    }

    startCaptionObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    this.processCaptions();
                }
            }
        });

        // Start observing YouTube's caption container
        setInterval(() => {
            const captionWindow = document.querySelector('.ytp-caption-window-container');
            if (captionWindow) {
                observer.observe(captionWindow, {
                    childList: true,
                    subtree: true
                });
            }
        }, 1000);
    }

    async processCaptions() {
        if (!this.enabled) return;

        const captionElement = document.querySelector('.ytp-caption-segment');
        if (!captionElement) return;

        const text = captionElement.textContent.trim();
        if (text === this.currentSubtitle) return;
        
        this.currentSubtitle = text;
        if (text) {
            const translation = await this.translateText(text);
            this.displayTranslation(translation);
        }
    }

    async translateText(text) {
        try {
            const response = await fetch(LIBRETRANSLATE_API, {
                method: 'POST',
                body: JSON.stringify({
                    q: text,
                    source: 'en',
                    target: TARGET_LANG
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data.translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    displayTranslation(translation) {
        if (!this.enabled) return;
        this.subtitleContainer.textContent = translation;
        this.subtitleContainer.style.display = translation ? 'block' : 'none';
    }
}

// Initialize when the page loads
window.addEventListener('load', () => {
    new YouTubeTranslator();
}); 