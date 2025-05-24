document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('myChart').getContext('2d');

    const getSeverityLevel = (value) => {
        if (value > 70) return 2;
        if (value > 35) return 1;
        return 0;
    };

    const getLineColor = (severityLevel) => {
        switch (severityLevel) {
            case 2: return 'rgba(220,53,69,1)';
            case 1: return 'rgba(255,193,7,1)';
            default: return 'rgba(40,167,69,1)';
        }
    };

    // Solo 4 datos para 0, 1, 2, 3 segundos
    let data = Array.from({ length: 4 }, () => Math.floor(Math.random() * 100));
    let labels = [0, 1, 2, 3];

    let lastDirection = 1; // 1: sube, -1: baja

    const getSegmentColor = ctx => ctx.p0 && ctx.p1
        ? getLineColor(getSeverityLevel(ctx.p1.parsed.y))
        : 'rgba(40,167,69,1)';

    const drawArrow = (chart) => {
        const meta = chart.getDatasetMeta(0);
        if (meta.data.length < 2) return;

        const lastPoint = meta.data[meta.data.length - 1];
        const secondLastPoint = meta.data[meta.data.length - 2];

        const { x, y } = lastPoint.getProps(['x', 'y'], true);
        const prevX = secondLastPoint.getProps(['x'], true).x;
        const prevY = secondLastPoint.getProps(['y'], true).y;

        const angle = (x === prevX && y === prevY) ? 0 : Math.atan2(y - prevY, x - prevX);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();

        const arrowSize = 8;
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize, -arrowSize / 2);
        ctx.lineTo(-arrowSize, arrowSize / 2);
        ctx.closePath();

        ctx.fillStyle = getLineColor(getSeverityLevel(data[data.length - 1]));
        ctx.fill();
        ctx.restore();
    };

    // Modifica el setInterval para evitar valores constantes
    setInterval(() => {
        const last = data[data.length - 1];

        // Cambia la dirección con mayor probabilidad si está mucho tiempo en el mismo rango
        const currentLevel = getSeverityLevel(last);
        const prevLevels = data.slice(-3).map(getSeverityLevel);
        const sameLevelCount = prevLevels.filter(l => l === currentLevel).length;

        // Si lleva 3 veces en el mismo nivel, fuerza cambio de dirección
        if (sameLevelCount >= 3) {
            lastDirection *= -1;
        } else if (Math.random() < 0.3) {
            lastDirection *= -1; // 30% de cambiar dirección aleatoriamente
        }

        // Movimiento más fuerte para salir del rango
        let delta = Math.floor(Math.random() * 10 + 8) * lastDirection;
        let next = Math.max(0, Math.min(100, last + delta));

        // Si sigue igual, fuerza un salto mayor
        if (getSeverityLevel(next) === currentLevel) {
            next = Math.max(0, Math.min(100, last + delta * 1.5));
        }

        data = [...data.slice(1), next];
        chart.data.datasets[0].data = data;
        chart.update();
    }, 3000);

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Nivel de Contaminación',
                data,
                fill: false,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0,
                segment: {
                    borderColor: getSegmentColor
                }
            }]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        generateLabels: function(chart) {
                            return [
                                {
                                    text: 'Baja (Verde, 0-35 ppm)',
                                    fillStyle: 'rgba(40,167,69,1)',
                                    strokeStyle: 'rgba(40,167,69,1)',
                                    lineWidth: 2
                                },
                                {
                                    text: 'Media (Amarillo, 36-70 ppm)',
                                    fillStyle: 'rgba(255,193,7,1)',
                                    strokeStyle: 'rgba(255,193,7,1)',
                                    lineWidth: 2
                                },
                                {
                                    text: 'Alta (Rojo, 71-100 ppm)',
                                    fillStyle: 'rgba(220,53,69,1)',
                                    strokeStyle: 'rgba(220,53,69,1)',
                                    lineWidth: 2
                                }
                            ];
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Calidad del Aire en Quito (ppm)',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#333'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' ppm';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Segundos',
                        font: {
                            size: 14
                        },
                        color: '#555'
                    },
                    grid: {
                        display: false
                    },
                    min: 0,
                    max: 3,
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Nivel de Contaminación (ppm)',
                        font: {
                            size: 14
                        },
                        color: '#555'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' ppm';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.08)'
                    }
                }
            }
        },
        plugins: [{
            afterDraw: chart => drawArrow(chart)
        }]
    });

    // Actualiza cada 3 segundos
    setInterval(() => {
        const last = data[data.length - 1];
        const next = Math.max(0, Math.min(100, last + Math.floor(Math.random() * 21) - 10));
        data = [...data.slice(1), next];
        chart.data.datasets[0].data = data;
        chart.update();
    }, 3000);
});
