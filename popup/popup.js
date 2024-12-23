document.addEventListener('DOMContentLoaded', async function() {
    const generateButton = document.getElementById('generateButton');
    const clearDataButton = document.getElementById('clearDataButton');
    const tokenInput = document.getElementById('tokenInput');
    const showTokenBtn = document.getElementById('showTokenBtn');
    const downloadButtonsContainer = document.getElementById('downloadButtons');
    const existingDataInfo = document.getElementById('existingDataInfo');

    // Function to update UI based on existing data
    async function updateUIWithExistingData() {
        const rawData = await utils.storage.getData('rawData');
        const processedData = await utils.storage.getData('processedData');
        const generationDate = await utils.storage.getData('generationDate');

        if (rawData && processedData && generationDate) {
            existingDataInfo.innerHTML = `
                <p>Last fetch time: ${new Date(generationDate).toLocaleString()}</p>
                <p>Total conversations: ${rawData.totalCount}</p>
            `;
            clearDataButton.classList.remove('hidden');

            // Recreate download buttons
            downloadButtonsContainer.innerHTML = '';
            downloadButtonsContainer.appendChild(utils.createDownloadButton(
                rawData,
                `chatgpt-raw-data-${utils.getTimestamp()}.json`,
                'Download Raw Data'
            ));
            downloadButtonsContainer.appendChild(utils.createDownloadButton(
                processedData,
                `chatgpt-processed-data-${utils.getTimestamp()}.json`,
                'Download Processed Data'
            ));
        } else {
            existingDataInfo.innerHTML = '<p>Click the button to export your conversations.</p> <p>Keep the extension open until the data is fetched.</p>';
            clearDataButton.classList.add('hidden');
            downloadButtonsContainer.innerHTML = '';
        }
    }

    // Initial UI update
    await updateUIWithExistingData();

    showTokenBtn.addEventListener('click', () => {
        if (tokenInput.type === 'password') {
            tokenInput.type = 'text';
            showTokenBtn.textContent = 'Hide';
        } else {
            tokenInput.type = 'password';
            showTokenBtn.textContent = 'Show';
        }
    });

    tokenInput.addEventListener('change', () => {
        chrome.storage.local.set({ 'chatgpt_token': tokenInput.value });
    });

    chrome.storage.local.get(['chatgpt_token'], function(result) {
        if (result.chatgpt_token) {
            tokenInput.value = result.chatgpt_token;
        }
    });

    clearDataButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all saved data?')) {
            await utils.storage.clearData();
            await updateUIWithExistingData();
            utils.updateStatus('All data cleared');
        }
    });

    generateButton.addEventListener('click', async () => {
        try {
            const accessToken = tokenInput.value.trim();
            if (!accessToken) {
                throw new Error('Please enter your bearer token');
            }

            generateButton.disabled = true;
            downloadButtonsContainer.innerHTML = '';

            // Step 1: Fetch Data
            const fetcher = new DataFetcher(accessToken);
            const rawData = await fetcher.fetchConversations();
            await utils.storage.saveData('rawData', rawData);
            
            // Step 2: Process Data
            const processedData = DataProcessor.processData(rawData);
            await utils.storage.saveData('processedData', processedData);
            
            // Save generation date
            await utils.storage.saveData('generationDate', new Date().toISOString());

            // Update UI with new data
            await updateUIWithExistingData();

            utils.updateStatus('Data fetched successfully!');

        } catch (error) {
            console.error('Error:', error);
            utils.updateStatus(`Error: ${error.message}`);
        } finally {
            generateButton.disabled = false;
        }
    });
});