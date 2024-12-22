class DataProcessor {
    static processData(rawData) {
        const dateCountMap = new Map();
        
        rawData.conversations.forEach(conversation => {
            const date = new Date(conversation.create_time)
                .toLocaleDateString('en-CA');
            dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
        });

        const heatmapData = Array.from(dateCountMap, ([date, count]) => {
            const dateObj = new Date(date);
            return {
                date,
                count,
                dayOfWeek: dateObj.getDay(),
                weekNumber: this.getWeekNumber(dateObj)
            };
        });

        heatmapData.sort((a, b) => a.date.localeCompare(b.date));
        return this.fillMissingDates(heatmapData);
    }

    static getWeekNumber(dateObj) {
        const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
        const pastDaysOfYear = (dateObj - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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

        const filledData = new Map(heatmapData.map(item => [item.date, item]));
        
        const current = new Date(start);
        while (current <= end) {
            const dateStr = current.toLocaleDateString('en-CA');
            if (!filledData.has(dateStr)) {
                filledData.set(dateStr, {
                    date: dateStr,
                    count: 0,
                    dayOfWeek: current.getDay(),
                    weekNumber: this.getWeekNumber(current)
                });
            }
            current.setDate(current.getDate() + 1);
        }

        return Array.from(filledData, ([_, value]) => value)
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}