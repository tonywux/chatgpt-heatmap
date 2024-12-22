class DataFetcher {
    constructor(accessToken) {
        this.accessToken = accessToken;
    }

    async fetchConversations() {
        let allConversations = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        let failedRequests = [];
        let totalItems = null;

        while (hasMore) {
            try {
                const currentBatch = {
                    start: offset,
                    end: offset + limit
                };
                
                const progressMsg = totalItems 
                    ? `Fetching ${currentBatch.start}-${currentBatch.end} records of ${totalItems}...`
                    : `Fetching ${currentBatch.start}-${currentBatch.end} records...`;
                utils.updateStatus(progressMsg);
                
                const response = await fetch(
                    `https://chatgpt.com/backend-api/conversations?offset=${offset}&limit=${limit}&order=updated`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.accessToken}`
                        },
                        credentials: 'include'
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (totalItems === null) {
                    totalItems = data.total;
                }

                allConversations = allConversations.concat(data.items);
                
                utils.updateStatus(`${currentBatch.start}-${currentBatch.end} records fetched successfully.`);
                
                if (data.items.length < limit || offset + limit >= data.total) {
                    hasMore = false;
                } else {
                    offset += limit;
                }

            } catch (error) {
                console.error(`Failed to fetch offset ${offset}:`, error);
                utils.updateStatus(`${offset}-${offset + limit} records fetching failed.`);
                failedRequests.push(offset);
                offset += limit;
                
                if (failedRequests.length >= 3) {
                    hasMore = false;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const exportData = {
            conversations: allConversations,
            exportDate: new Date().toISOString(),
            totalCount: allConversations.length,
            failedOffsets: failedRequests,
            isComplete: failedRequests.length === 0,
            expectedTotal: totalItems
        };

        return exportData;
    }
}