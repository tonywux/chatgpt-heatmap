document.addEventListener('DOMContentLoaded', function() {
    const exportButton = document.getElementById('exportButton');
    const statusDiv = document.getElementById('status');
    const tokenInput = document.getElementById('tokenInput');
    const showTokenBtn = document.getElementById('showTokenBtn');

    // Toggle token visibility
    showTokenBtn.addEventListener('click', () => {
        if (tokenInput.type === 'password') {
            tokenInput.type = 'text';
            showTokenBtn.textContent = 'Hide';
        } else {
            tokenInput.type = 'password';
            showTokenBtn.textContent = 'Show';
        }
    });

    // Save token when it changes
    tokenInput.addEventListener('change', () => {
        chrome.storage.local.set({ 'chatgpt_token': tokenInput.value });
    });

    // Load saved token
    chrome.storage.local.get(['chatgpt_token'], function(result) {
        if (result.chatgpt_token) {
            tokenInput.value = result.chatgpt_token;
        }
    });

    exportButton.addEventListener('click', async () => {
        try {
            const accessToken = tokenInput.value.trim();
            if (!accessToken) {
                throw new Error('Please enter an access token');
            }

            statusDiv.textContent = 'Fetching conversations...';
            exportButton.disabled = true;

            let allConversations = [];
            let offset = 0;
            const limit = 100;
            let hasMore = true;
            let failedRequests = [];
            let totalItems = null;

            while (hasMore) {
                try {
                    statusDiv.textContent = `Fetching conversations (offset: ${offset})...`;
                    
                    const response = await fetch(
                        `https://chatgpt.com/backend-api/conversations?offset=${offset}&limit=${limit}&order=updated`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            },
                            credentials: 'include'
                        }
                    );

                    if (!response.ok) {
                        if (response.status === 401) {
                            throw new Error('Invalid access token. Please check and try again.');
                        }
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    
                    // Set total items on first successful request
                    if (totalItems === null) {
                        totalItems = data.total;
                    }

                    allConversations = allConversations.concat(data.items);
                    
                    statusDiv.textContent = `Fetched ${allConversations.length} of ${totalItems} conversations...`;
                    
                    if (data.items.length < limit || offset + limit >= data.total) {
                        hasMore = false;
                    } else {
                        offset += limit;
                    }

                } catch (error) {
                    console.error(`Failed to fetch offset ${offset}:`, error);
                    failedRequests.push(offset);
                    offset += limit; // Continue with next batch even if this one failed
                    
                    // Stop if we've had too many consecutive failures
                    if (failedRequests.length >= 3) {
                        console.warn('Too many consecutive failures, stopping pagination');
                        hasMore = false;
                    }
                }

                // Add a small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Prepare the export data
            const exportData = {
                conversations: allConversations,
                exportDate: new Date().toISOString(),
                totalCount: allConversations.length,
                failedOffsets: failedRequests,
                isComplete: failedRequests.length === 0,
                expectedTotal: totalItems
            };

            // Create and download the JSON file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `chatgpt-conversations-${timestamp}.json`;

            chrome.downloads.download({
                url: URL.createObjectURL(blob),
                filename: filename,
                saveAs: true
            });

            const failedMessage = failedRequests.length > 0 
                ? ` (${failedRequests.length} pages failed to fetch)`
                : '';
            
            statusDiv.textContent = `Exported ${allConversations.length} conversations${failedMessage}!`;

        } catch (error) {
            console.error('Error:', error);
            statusDiv.textContent = `Error: ${error.message}`;
        } finally {
            exportButton.disabled = false;
        }
    });
});