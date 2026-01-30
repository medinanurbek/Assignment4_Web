let myChart = null;

window.onload = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    document.getElementById('endDate').valueAsDate = end;
    document.getElementById('startDate').valueAsDate = start;
    
    loadAnalytics();
};

document.getElementById('analyzeBtn').addEventListener('click', loadAnalytics);

function resetUI() {
    if (myChart) {
        myChart.destroy();
        myChart = null;
    }
    document.getElementById('avg-val').innerText = "0.00";
    document.getElementById('min-val').innerText = "0.00";
    document.getElementById('max-val').innerText = "0.00";
    document.getElementById('std-val').innerText = "0.00";
}

async function loadAnalytics() {
    const field = document.getElementById('fieldSelect').value;
    const chartType = document.getElementById('chartType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        const dataRes = await fetch(`/api/measurements?field=${field}&start_date=${startDate}&end_date=${endDate}`);
        
        if (!dataRes.ok) {
            const errorData = await dataRes.json();
            resetUI(); 
            alert(`🔍 ${errorData.error}`); 
            return; 
        }

        const timeData = await dataRes.json();

        const metricsRes = await fetch(`/api/measurements/metrics?field=${field}&start_date=${startDate}&end_date=${endDate}`);
        const metrics = await metricsRes.json();
        
        document.getElementById('avg-val').innerText = metrics.avg;
        document.getElementById('min-val').innerText = metrics.min;
        document.getElementById('max-val').innerText = metrics.max;
        document.getElementById('std-val').innerText = metrics.stdDev;

        renderChart(timeData, field, chartType);

    } catch (err) {
        console.error(err);
        alert("Server connection error");
    }
}

function renderChart(data, fieldName, chartType) {
    const ctx = document.getElementById('timeSeriesChart').getContext('2d');
    
    if (myChart) myChart.destroy();

    const labels = data.map(item => new Date(item.timestamp).toLocaleDateString());
    const values = data.map(item => item[fieldName]);
    const colors = data.map((_, index) => `hsla(${(index * 360) / data.length}, 70%, 50%, 0.8)`);

    myChart = new Chart(ctx, {
        type: chartType, 
        data: {
            labels: labels,
            datasets: [{
                label: fieldName.toUpperCase(),
                data: values,
                backgroundColor: (chartType === 'pie' || chartType === 'polarArea') ? colors : 'rgba(26, 115, 232, 0.2)',
                borderColor: (chartType === 'pie' || chartType === 'polarArea') ? '#fff' : '#1a73e8',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    display: !(chartType === 'pie' || chartType === 'polarArea' || chartType === 'radar'),
                    beginAtZero: false 
                },
                x: {
                    display: !(chartType === 'pie' || chartType === 'polarArea' || chartType === 'radar')
                }
            }
        }
    });
}