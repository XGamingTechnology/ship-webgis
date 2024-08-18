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

    // Object to hold ship markers and data
    let shipMarkers = {};  // Define shipMarkers here
    let shipLayer = null;
    let routeLayer = null;
    let dockLayer = null;
    let shipData = {}; // Added to store ship data
    let currentTimeIndex = 0;
    let intervalId = null; // Define intervalId here

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
                    shipData = {};  // Reset ship data

                    // Process each feature in the GeoJSON
                    data.features.forEach((feature) => {
                        const shipId = feature.properties["id kapal"];
                        const namaKapal = feature.properties["nama kapal"];
                        const waktu = feature.properties["waktu"];
                        const coordinates = feature.geometry.coordinates;

                        if (!shipData[shipId]) {
                            shipData[shipId] = [];
                        }
                        shipData[shipId].push({
                            latlng: L.latLng(coordinates[1], coordinates[0]),
                            waktu: waktu,
                            namaKapal: namaKapal
                        });
                    });

                    // Sort the data by time for each ship
                    Object.keys(shipData).forEach(shipId => {
                        shipData[shipId].sort((a, b) => a.waktu - b.waktu);
                    });

                    // Initialize markers at the first position
                    Object.keys(shipData).forEach(shipId => {
                        const firstPosition = shipData[shipId][0].latlng;
                        if (shipMarkers[shipId]) {
                            map.removeLayer(shipMarkers[shipId]);
                        }
                        const marker = L.marker(firstPosition, {
                            icon: L.icon({
                                iconUrl: 'images/ship-marker.png', // Update with actual ship icon path
                                iconSize: [32, 32],
                                iconAnchor: [16, 32],
                                popupAnchor: [0, -32]
                            })
                        }).addTo(map);

                        marker.bindPopup(`<strong>Nama Kapal:</strong> ${shipData[shipId][0].namaKapal || 'N/A'}<br>
                        <strong>ID Kapal:</strong> ${shipId}<br>
                        <strong>Waktu:</strong> ${new Date(shipData[shipId][0].waktu * 86400000).toLocaleString()}`);
                        shipMarkers[shipId] = marker;
                    });

                    // Start the simulation
                    if (intervalId) {
                        clearInterval(intervalId);
                    }
                    intervalId = setInterval(simulateShipMovement, 5000); // 5-second interval

                } else if (type === 'routes') {
                    if (routeLayer) {
                        map.removeLayer(routeLayer);
                    }
                    routeLayer = L.geoJSON(data, {
                        style: function () {
                            return { color: '#FF0000', weight: 3 };
                        },
                        onEachFeature: function (feature, layer) {
                            layer.bindPopup(`<strong>Route ID:</strong> ${feature.properties.route_id}<br>
                                             <strong>Ship ID:</strong> ${feature.properties.ship_id}`);
                        }
                    }).addTo(map);
                } else if (type === 'docks') {
                    if (dockLayer) {
                        map.removeLayer(dockLayer);
                    }
                    dockLayer = L.geoJSON(data, {
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
                            layer.bindPopup(`<strong>Dock Name:</strong> ${feature.properties.nama_dock}<br>
                                             <strong>Capacity:</strong> ${feature.properties.kapasitas}<br>`);
                        }
                    }).addTo(map);
                }
            })
            .catch(error => {
                console.error('Error fetching the GeoJSON data:', error);
            });
    }

    // Function to simulate ship movement
    function simulateShipMovement() {
        console.log("Simulating ship movement...");

        Object.keys(shipMarkers).forEach(shipId => {
            const shipPositions = shipData[shipId];
            if (shipPositions) {
                if (currentTimeIndex < shipPositions.length) {
                    const newLatLng = shipPositions[currentTimeIndex].latlng;

                    // Update the existing marker's position
                    const marker = shipMarkers[shipId];
                    marker.setLatLng(newLatLng).update();

                    // Update the popup content with the correct data
                    marker.getPopup().setContent(`
                        <strong>Nama Kapal:</strong> ${shipPositions[currentTimeIndex].namaKapal || 'N/A'}<br>
                        <strong>ID Kapal:</strong> ${shipId}<br>
                        <strong>Waktu:</strong> ${new Date(shipPositions[currentTimeIndex].waktu * 86400000).toLocaleString()}
                    `).update();
                }
            }
        });

        currentTimeIndex++;
        console.log("Current Time Index:", currentTimeIndex);

        // Reset the index if we've reached the end of the data
        if (currentTimeIndex >= Math.max(...Object.values(shipData).map(data => data.length))) {
            currentTimeIndex = 0;
            console.log("Resetting currentTimeIndex");
        }
    }

    // Checkbox change handlers
    document.getElementById('ship-checkbox').addEventListener('change', function () {
        if (this.checked) {
            loadGeoJsonData('data/kapal.geojson', 'ships');
        } else {
            // Remove all ship markers
            Object.keys(shipMarkers).forEach(shipId => {
                map.removeLayer(shipMarkers[shipId]);
            });
            shipMarkers = {};  // Clear the shipMarkers object

            // Stop the simulation
            clearInterval(intervalId);
            intervalId = null;
            currentTimeIndex = 0;  // Reset the time index
        }
    });

    document.getElementById('route-checkbox').addEventListener('change', function () {
        if (this.checked) {
            loadGeoJsonData('data/rute kapal.json', 'routes');
        } else {
            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
            }
        }
    });

    document.getElementById('dock-checkbox').addEventListener('change', function () {
        if (this.checked) {
            loadGeoJsonData('data/dermaga.geojson', 'docks');
        } else {
            if (dockLayer) {
                map.removeLayer(dockLayer);
                dockLayer = null;
            }
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
        sidebarToggle.innerHTML = `<i class="fas fa-chevron-${isVisible ? 'left' : 'right'}'></i>`;
    });
});
