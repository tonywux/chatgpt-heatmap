class DataProcessor {
    static processData(rawData) {
        const dateCountMap = new Map();
        
        rawData.conversations.forEach(conversation => {
            const date = new Date(conversation.create_time)
                .toLocaleDateString('en-CA');
            dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
        });

        const heatmapData = Array.from(dateCountMap, ([date, count]) => ({
            date,
            count
        }));

        heatmapData.sort((a, b) => a.date.localeCompare(b.date));
        return this.fillMissingDates(heatmapData);
    }

    static getDateRange(heatmapData) {
        if (heatmapData.length === 0) return { start: null, end: null };
        
        const dates = heatmapData.map(item => new Date(item.date));
        return {
            start: new Date(Math.min(...dates)),
            end: new Date(Math.max(...dates))
        };
    }

    static fillMissingDates(heatmapData) {
        const { start, end } = this.getDateRange(heatmapData);
        if (!start || !end) return [];

        const filledData = new Map(heatmapData.map(item => [item.date, item.count]));
        
        const current = new Date(start);
        while (current <= end) {
            const dateStr = current.toLocaleDateString('en-CA');
            if (!filledData.has(dateStr)) {
                filledData.set(dateStr, 0);
            }
            current.setDate(current.getDate() + 1);
        }

        return Array.from(filledData, ([date, count]) => ({
            date,
            count
        })).sort((a, b) => a.date.localeCompare(b.date));
    }
}