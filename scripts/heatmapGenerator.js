class HeatmapGenerator {
    static getIntensityLevel(count) {
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        if (count <= 10) return 3;
        return 4;
    }

    static render(heatmapData) {
        const container = document.getElementById('heatmap-container');
        container.innerHTML = '';
        container.className = 'heatmap-container';

        heatmapData.forEach(item => {
            const cell = document.createElement('div');
            cell.className = `heatmap-cell heatmap-cell-${this.getIntensityLevel(item.count)}`;
            cell.title = `${item.date}: ${item.count} conversations`;
            container.appendChild(cell);
        });
    }
}