document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map centered on Indonesia
    const map = L.map('map').setView([-2.5, 118.0], 4);

    // Define basemaps
    const basemaps = {
        osm: L.tileLayer.provider('OpenStreetMap.Mapnik'),
        satellite: L.tileLayer.provider('Esri.WorldImagery'),
        topo: L.tileLayer.provider('OpenTopoMap'),
        imagery: L.tileLayer.provider('Esri.WorldImagery'),
        outdoors: L.tileLayer.provider('Thunderforest.Outdoors')
    };

    // Add default basemap
    basemaps.osm.addTo(map);

    // Handle basemap change
    document.getElementById('basemap-select').addEventListener('change', function (event) {
        const selectedBasemap = event.target.value;

        // Remove all tile layers
        map.eachLayer(function (layer) {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });

        // Add selected basemap
        basemaps[selectedBasemap].addTo(map);
    });

    // Object to hold ship markers and data
    let shipMarkers = {};
    let shipData = {};
    let intervalId;
    let currentTimeIndex = 0;

    // Function to load GeoJSON data and add to the map
    function loadGeoJsonData(url, type) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (!data || !data.features || data.features.length === 0) {
                    throw new Error('No features in GeoJSON data');
                }

                if (type === 'ships') {
                    shipData = {}; // Reset ship data

                    data.features.forEach(feature => {
                        const shipId = feature.properties.id_kapal;
                        if (!shipData[shipId]) {
                            shipData[shipId] = [];
                        }
                        shipData[shipId].push({
                            latlng: L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]),
                            waktu: feature.properties.waktu
                        });
                    });

                    // Sort the data by time for each ship
                    Object.keys(shipData).forEach(shipId => {
                        shipData[shipId].sort((a, b) => a.waktu - b.waktu);
                    });

                    // Initialize markers at the first position
                    Object.keys(shipData).forEach(shipId => {
                        const firstPosition = shipData[shipId][0].latlng;
                        const marker = L.marker(firstPosition, {
                            icon: L.icon({
                                iconUrl: 'images/ship-marker.png', // Update with actual ship icon path
                                iconSize: [32, 32],
                                iconAnchor: [16, 32],
                                popupAnchor: [0, -32]
                            })
                        }).addTo(map);

                        marker.bindPopup(`<strong>Nama Kapal:</strong> ${shipId}`);
                        shipMarkers[shipId] = marker;
                    });

                    // Start the simulation
                    if (intervalId) {
                        clearInterval(intervalId);
                    }
                    intervalId = setInterval(simulateShipMovement, 5000); // 5-second interval

                } else if (type === 'routes') {
                    const routes = L.geoJSON(data, {
                        style: function () {
                            return { color: '#FF0000', weight: 3 };
                        },
                        onEachFeature: function (feature, layer) {
                            layer.bindPopup(`<strong>Route ID:</strong> ${feature.properties.route_id}<br>
                                             <strong>Ship ID:</strong> ${feature.properties.ship_id}`);
                        }
                    });
                    routes.addTo(map);
                } else if (type === 'docks') {
                    const docks = L.geoJSON(data, {
                        pointToLayer: function (feature, latlng) {
                            return L.marker(latlng, {
                                icon: L.icon({
                                    iconUrl: 'images/dock-marker.png', // Update with actual dock icon path
                                    iconSize: [32, 32],
                                    iconAnchor: [16, 32],
                                    popupAnchor: [0, -32]
                                })
                            });
                        },
                        onEachFeature: function (feature, layer) {
                            const popupContent = generatePopupContent(feature.properties);
                            layer.bindPopup(popupContent);
                        }
                    });
                    docks.addTo(map);
                }
            })
            .catch(error => {
                console.error('Error fetching the GeoJSON data:', error);
            });
    }

    // Function to generate the pop-up content with a responsive table
    function generatePopupContent(properties) {
        return `
            <div class="card" style="width: 100%;">
                <div class="card-body">
                    <h5 class="card-title">${properties['nama kapal']}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${properties['jenis kapal']}</h6>
                    <table class="table table-sm table-bordered">
                        <tbody>
                            <tr>
                                <th scope="row">ID Kapal</th>
                                <td>${properties['id kapal']}</td>
                            </tr>
                            <tr>
                                <th scope="row">Kapasitas</th>
                                <td>${properties.kapasitas || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th scope="row">Waktu</th>
                                <td>${properties.waktu ? new Date(properties.waktu * 86400000).toLocaleString() : 'N/A'}</td>
                            </tr>
                            <tr>
                                <th scope="row">Coordinates</th>
                                <td>[${properties.lat}, ${properties.lng}]</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    // Function to simulate ship movement
    function simulateShipMovement() {
        Object.keys(shipMarkers).forEach(shipId => {
            const shipPositions = shipData[shipId];
            if (currentTimeIndex < shipPositions.length) {
                const newLatLng = shipPositions[currentTimeIndex].latlng;
                const marker = shipMarkers[shipId];
                marker.setLatLng(newLatLng).update();
                marker.getPopup().setContent(generatePopupContent({
                    'nama kapal': shipId,
                    'id kapal': shipId,
                    kapasitas: 'N/A',
                    lat: newLatLng.lat,
                    lng: newLatLng.lng,
                    waktu: shipPositions[currentTimeIndex].waktu
                }));
            }
        });

        currentTimeIndex++;

        // Reset the index if we've reached the end of the data
        if (currentTimeIndex >= Math.max(...Object.values(shipData).map(data => data.length))) {
            currentTimeIndex = 0;
        }
    }

    // Checkbox change handlers
    document.getElementById('ship-checkbox').addEventListener('change', function () {
        if (this.checked) {
            loadGeoJsonData('data/kapal.geojson', 'ships');
        } else {
            Object.keys(shipMarkers).forEach(shipId => {
                map.removeLayer(shipMarkers[shipId]);
            });
            shipMarkers = {};
            clearInterval(intervalId); // Clear the interval when the layer is removed
        }
    });

    document.getElementById('route-checkbox').addEventListener('change', function () {
        if (this.checked) {
            loadGeoJsonData('data/rute kapal.json', 'routes');
        } else {
            map.eachLayer(function (layer) {
                if (layer instanceof L.GeoJSON && layer.feature && layer.feature.properties.route_id) {
                    map.removeLayer(layer);
                }
            });
        }
    });

    document.getElementById('dock-checkbox').addEventListener('change', function () {
        if (this.checked) {
            loadGeoJsonData('data/dermaga.geojson', 'docks');
        } else {
            map.eachLayer(function (layer) {
                if (layer instanceof L.GeoJSON && layer.feature && layer.feature.properties.nama_dock) {
                    map.removeLayer(layer);
                }
            });
        }
    });

    

    // Sidebar toggle functionality
    const sidebar = document.querySelector('.sidebar');
    const mapContainer = document.querySelector('.map-container');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    function checkScreenWidth() {
        if (window.innerWidth <= 576) {
            sidebar.classList.remove('visible');
            mapContainer.classList.remove('shifted');
            sidebarToggle.innerHTML = `<i class="fas fa-chevron-right"></i>`;
        } else {
            sidebar.classList.add('visible');
            mapContainer.classList.add('shifted');
            sidebarToggle.innerHTML = `<i class="fas fa-chevron-left'></i>`;
        }
    }

    checkScreenWidth();
    window.addEventListener('resize', checkScreenWidth);

    sidebarToggle.addEventListener('click', function () {
        const isVisible = sidebar.classList.toggle('visible');
        mapContainer.classList.toggle('shifted', isVisible);
        sidebarToggle.innerHTML = `<i class="fas fa-chevron-${isVisible ? 'left' : 'right'}"></i>`;
    });
});
