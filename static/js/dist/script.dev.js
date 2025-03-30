"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

document.addEventListener('DOMContentLoaded', function () {
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';

  script.onload = function () {
    initApp();
  };

  document.head.appendChild(script);
});
var planetsData = [];

function initApp() {
  fetch('/api/planets').then(function (response) {
    return response.json();
  }).then(function (data) {
    planetsData = data;
    initPlanetSelect(data);
    createRadiusChart(data);
    createFluxTempChart(data);
    document.getElementById('compare-btn').addEventListener('click', function () {
      var selected = getSelectedPlanets();

      if (selected.length > 0) {
        createComparisonChart(selected);
      } else {
        alert('Please select at least one planet');
      }
    });
  })["catch"](function (error) {
    console.error('Error loading data:', error);
    document.getElementById('radius-chart').innerHTML = '<p class="error">Error loading planet data</p>';
  });
}

function initPlanetSelect(planets) {
  var select = document.getElementById('planet-select');
  planets.forEach(function (planet) {
    var option = document.createElement('option');
    option.value = planet.Object;
    option.textContent = "".concat(planet.Object, " (").concat(planet['Star type'], ")");
    select.appendChild(option);
  });
}

function getSelectedPlanets() {
  var selectedOptions = Array.from(document.getElementById('planet-select').selectedOptions);
  return selectedOptions.map(function (opt) {
    return opt.value;
  });
}

function createRadiusChart(planets) {
  var ctx = document.getElementById('radius-chart').getContext('2d');

  var sortedPlanets = _toConsumableArray(planets).sort(function (a, b) {
    return b['Radius (R⊕)'] - a['Radius (R⊕)'];
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedPlanets.map(function (p) {
        return p.Object;
      }),
      datasets: [{
        label: 'Radius (Earth Radii)',
        data: sortedPlanets.map(function (p) {
          return p['Radius (R⊕)'];
        }),
        backgroundColor: sortedPlanets.map(function (p) {
          return getColorForStarType(p['Star type']);
        }),
        borderColor: sortedPlanets.map(function (p) {
          return getColorForStarType(p['Star type'], 0.8);
        }),
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
          font: {
            size: 16
          }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function label(ctx) {
              return "".concat(ctx.parsed.y, " R\u2295 (").concat(ctx.label, ")");
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Radius (Earth Radii)',
            font: {
              size: 14
            }
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 10
            },
            callback: function callback(value) {
              return this.getLabelForValue(value).length > 15 ? this.getLabelForValue(value).substring(0, 15) + '...' : this.getLabelForValue(value);
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
  var ctx = document.getElementById('flux-chart').getContext('2d');
  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Exoplanets',
        data: planets.map(function (p) {
          return {
            x: p['Teq (K)'],
            y: p['Flux (F⊕)'],
            r: Math.sqrt(p['Radius (R⊕)']) * 2,
            name: p.Object
          };
        }),
        backgroundColor: planets.map(function (p) {
          return p.Note && p.Note.includes('habitable') ? '#4CAF50' : '#2196F3';
        }),
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
            label: function label(ctx) {
              return "".concat(ctx.raw.name, ": ").concat(ctx.raw.y, "F\u2295, ").concat(ctx.raw.x, "K");
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Temperature (K)'
          }
        },
        y: {
          type: 'logarithmic',
          title: {
            display: true,
            text: 'Flux (Earth Flux)'
          }
        }
      }
    }
  });
}

function createComparisonChart(selectedPlanetNames) {
  var ctx = document.getElementById('comparison-chart');

  if (window.comparisonChart) {
    window.comparisonChart.destroy();
  }

  var selectedPlanets = planetsData.filter(function (p) {
    return selectedPlanetNames.includes(p.Object);
  });
  var colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC24A', '#EA80FC'];
  var datasets = selectedPlanets.map(function (planet, index) {
    return {
      label: planet.Object,
      data: [planet['Mass (M⊕)'], planet['Radius (R⊕)'], planet['Flux (F⊕)'], planet['Teq (K)'], planet['Distance (ly)']],
      backgroundColor: colors[index % colors.length] + '33',
      borderColor: colors[index % colors.length],
      borderWidth: 2,
      pointBackgroundColor: colors[index % colors.length],
      pointRadius: 4,
      pointHoverRadius: 6
    };
  });
  window.comparisonChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Mass (M⊕)', 'Radius (R⊕)', 'Flux (F⊕)', 'Temperature (K)', 'Distance (ly)'],
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Planet Characteristics Comparison',
          font: {
            size: 16
          }
        },
        legend: {
          position: 'right',
          labels: {
            font: {
              size: 12
            },
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function label(context) {
              return "".concat(context.dataset.label, ": ").concat(context.raw);
            }
          }
        }
      },
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: 0,
          ticks: {
            font: {
              size: 11
            }
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

function getColorForStarType(type) {
  var alpha = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var colors = {
    'G': "rgba(255, 206, 86, ".concat(alpha, ")"),
    'K': "rgba(255, 159, 64, ".concat(alpha, ")"),
    'M': "rgba(255, 99, 132, ".concat(alpha, ")"),
    'F': "rgba(54, 162, 235, ".concat(alpha, ")"),
    'A': "rgba(153, 102, 255, ".concat(alpha, ")"),
    'B': "rgba(75, 192, 192, ".concat(alpha, ")")
  };

  for (var key in colors) {
    if (type.includes(key)) return colors[key];
  }

  return "rgba(199, 199, 199, ".concat(alpha, ")");
}
//# sourceMappingURL=script.dev.js.map
