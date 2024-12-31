document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('translationToggle');
    
    // Load saved state
    chrome.storage.local.get(['translationEnabled'], (result) => {
        toggle.checked = result.translationEnabled !== false;
    });

    // Save state on change
    toggle.addEventListener('change', () => {
        const enabled = toggle.checked;
        chrome.storage.local.set({ translationEnabled: enabled });
        
        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'toggleTranslation',
                enabled: enabled 
            });
        });
    });
}); 