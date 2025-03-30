document.addEventListener('DOMContentLoaded', function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
        initApp();
    };
    document.head.appendChild(script);
});

let planetsData = []; 


function initApp() {
    fetch('/api/planets')
        .then(response => response.json())
        .then(data => {
            planetsData = data; 
            initPlanetSelect(data);
            createRadiusChart(data);
            createFluxTempChart(data);
            
            document.getElementById('compare-btn').addEventListener('click', function() {
                const selected = getSelectedPlanets();
                if (selected.length > 0) {
                    createComparisonChart(selected);
                } else {
                    alert('Please select at least one planet');
                }
            });
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('radius-chart').innerHTML = 
                '<p class="error">Error loading planet data</p>';
        });
}

function initPlanetSelect(planets) {
    const select = document.getElementById('planet-select');
    planets.forEach(planet => {
        const option = document.createElement('option');
        option.value = planet.Object;
        option.textContent = `${planet.Object} (${planet['Star type']})`;
        select.appendChild(option);
    });
}

function getSelectedPlanets() {
    const selectedOptions = Array.from(document.getElementById('planet-select').selectedOptions);
    return selectedOptions.map(opt => opt.value);
}

function createRadiusChart(planets) {
    const ctx = document.getElementById('radius-chart').getContext('2d');
    
    const sortedPlanets = [...planets].sort((a, b) => b['Radius (R⊕)'] - a['Radius (R⊕)']);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedPlanets.map(p => p.Object),
            datasets: [{
                label: 'Radius (Earth Radii)',
                data: sortedPlanets.map(p => p['Radius (R⊕)']),
                backgroundColor: sortedPlanets.map(p => getColorForStarType(p['Star type'])),
                borderColor: sortedPlanets.map(p => getColorForStarType(p['Star type'], 0.8)),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Radius of Exoplanets (Earth Radii)',
                    font: { size: 16 }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.parsed.y} R⊕ (${ctx.label})`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Radius (Earth Radii)',
                        font: { size: 14 }
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        callback: function(value) {
                            return this.getLabelForValue(value).length > 15 ? 
                                   this.getLabelForValue(value).substring(0, 15) + '...' : 
                                   this.getLabelForValue(value);
                        }
                    }
                }
            },
            barPercentage: 0.8, 
            categoryPercentage: 0.9 
        }
    });
}

function createFluxTempChart(planets) {
    const ctx = document.getElementById('flux-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Exoplanets',
                data: planets.map(p => ({
                    x: p['Teq (K)'],
                    y: p['Flux (F⊕)'],
                    r: Math.sqrt(p['Radius (R⊕)']) * 2,
                    name: p.Object
                })),
                backgroundColor: planets.map(p => 
                    p.Note && p.Note.includes('habitable') ? '#4CAF50' : '#2196F3'),
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Flux vs Temperature with Habitability'
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.raw.name}: ${ctx.raw.y}F⊕, ${ctx.raw.x}K`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Temperature (K)' }
                },
                y: {
                    type: 'logarithmic',
                    title: { display: true, text: 'Flux (Earth Flux)' }
                }
            }
        }
    });
}

function createComparisonChart(selectedPlanetNames) {
    const ctx = document.getElementById('comparison-chart');
    
    if (window.comparisonChart) {
        window.comparisonChart.destroy();
    }

    const selectedPlanets = planetsData.filter(p => 
        selectedPlanetNames.includes(p.Object)
    );

    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#8AC24A', '#EA80FC'
    ];

    const datasets = selectedPlanets.map((planet, index) => ({
        label: planet.Object,
        data: [
            planet['Mass (M⊕)'],
            planet['Radius (R⊕)'],
            planet['Flux (F⊕)'],
            planet['Teq (K)'],
            planet['Distance (ly)']
        ],
        backgroundColor: colors[index % colors.length] + '33', 
        borderColor: colors[index % colors.length],
        borderWidth: 2,
        pointBackgroundColor: colors[index % colors.length],
        pointRadius: 4,
        pointHoverRadius: 6
    }));

    window.comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Mass (M⊕)', 
                'Radius (R⊕)', 
                'Flux (F⊕)', 
                'Temperature (K)', 
                'Distance (ly)'
            ],
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Planet Characteristics Comparison',
                    font: { size: 16 }
                },
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    ticks: {
                        font: { size: 11 }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.1
                }
            }
        }
    });
}

function getColorForStarType(type, alpha = 1) {
    const colors = {
        'G': `rgba(255, 206, 86, ${alpha})`,
        'K': `rgba(255, 159, 64, ${alpha})`,
        'M': `rgba(255, 99, 132, ${alpha})`,
        'F': `rgba(54, 162, 235, ${alpha})`,
        'A': `rgba(153, 102, 255, ${alpha})`,
        'B': `rgba(75, 192, 192, ${alpha})`
    };
    
    for (const key in colors) {
        if (type.includes(key)) return colors[key];
    }
    return `rgba(199, 199, 199, ${alpha})`;
}