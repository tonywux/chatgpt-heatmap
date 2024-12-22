const utils = {
    createDownloadButton: function(data, filename, text) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'download-btn';
        button.onclick = () => {
            chrome.downloads.download({
                url: URL.createObjectURL(blob),
                filename: filename,
                saveAs: true
            });
        };
        
        return button;
    },

    getTimestamp: function() {
        return new Date().toISOString().replace(/[:.]/g, '-');
    },

    updateStatus: function(message) {
        document.getElementById('status').textContent = message;
    },

    storage: {
        async saveData(key, data) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [key]: data }, resolve);
            });
        },

        async getData(key) {
            return new Promise((resolve) => {
                chrome.storage.local.get([key], (result) => {
                    resolve(result[key]);
                });
            });
        },

        async clearData() {
            return new Promise((resolve) => {
                chrome.storage.local.remove([
                    'rawData',
                    'processedData',
                    'generationDate'
                ], resolve);
            });
        }
    }
};