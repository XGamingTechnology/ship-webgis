document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map
    const map = L.map('map').setView([51.505, -0.09], 13);

    const basemaps = {
        osm: L.tileLayer.provider('OpenStreetMap.Mapnik'),
        satellite: L.tileLayer.provider('Esri.WorldImagery'),
        topo: L.tileLayer.provider('OpenTopoMap'),
        imagery: L.tileLayer.provider('Esri.WorldImagery'),
        outdoors: L.tileLayer.provider('Thunderforest.Outdoors')
    };

    // Add default basemap
    basemaps.osm.addTo(map);

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

    // Move zoom control to bottom right
    map.zoomControl.setPosition('bottomright');

    // Object to hold layer groups
    const layerGroups = {};

    // Handle GeoJSON file selection
    document.getElementById('geojson-select').addEventListener('change', function (event) {
        const selectedGeojson = event.target.value;

        // Clear previous layers
        Object.values(layerGroups).forEach(layerGroup => {
            map.removeLayer(layerGroup);
        });

        if (selectedGeojson === 'none') {
            return; // Do nothing if "None" is selected
        }

        let geojsonUrl = '';

        // Assign the appropriate URL based on the selectedGeojson
        if (selectedGeojson === 'ships') {
            geojsonUrl = 'path_to_your_ships_geojson_file';
        } else if (selectedGeojson === 'routes') {
            geojsonUrl = 'path_to_your_routes_geojson_file';
        } else if (selectedGeojson === 'docks') {
            geojsonUrl = 'path_to_your_docks_geojson_file';
        }

        // Fetch the selected GeoJSON data
        fetch(geojsonUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('GeoJSON data:', data);

                if (!data || !data.features || data.features.length === 0) {
                    throw new Error('No features in GeoJSON data');
                }

                // Clear previous layer groups
                Object.keys(layerGroups).forEach(layer => {
                    map.removeLayer(layerGroups[layer]);
                });

                if (selectedGeojson === 'ships' || selectedGeojson === 'docks') {
                    // Create markers for ships or docks
                    const markers = L.geoJSON(data, {
                        pointToLayer: function (feature, latlng) {
                            const iconUrl = selectedGeojson === 'ships' 
                                ? 'path_to_ship_icon' 
                                : 'path_to_dock_icon';

                            const marker = L.marker(latlng, { 
                                icon: L.icon({
                                    iconUrl: iconUrl,
                                    iconSize: [32, 32],
                                    iconAnchor: [16, 32],
                                    popupAnchor: [0, -32]
                                })
                            });
                            return marker;
                        },
                        onEachFeature: function (feature, layer) {
                            let popupContent = '';

                            if (selectedGeojson === 'ships') {
                                popupContent = `<strong>Ship Name:</strong> ${feature.properties.nama_kapal}<br>
                                                <strong>Type:</strong> ${feature.properties.jenis_kapal}<br>
                                                <strong>ID:</strong> ${feature.properties.id_kapal}<br>`;
                            } else if (selectedGeojson === 'docks') {
                                popupContent = `<strong>Dock Name:</strong> ${feature.properties.nama_dock}<br>
                                                <strong>Capacity:</strong> ${feature.properties.kapasitas}<br>`;
                            }

                            layer.bindPopup(popupContent);
                        }
                    });

                    markers.addTo(map);
                    layerGroups[selectedGeojson] = markers;

                } else if (selectedGeojson === 'routes') {
                    // Create polylines for ship routes
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
                    layerGroups[selectedGeojson] = routes;
                }

                map.fitBounds(layerGroups[selectedGeojson].getBounds());
            })
            .catch(error => {
                console.error('Error fetching the GeoJSON data:', error);
            });
    });

    const sidebar = document.querySelector('.sidebar');
    const mapContainer = document.querySelector('.map-container');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // Function to check screen width and hide sidebar by default on mobile
    function checkScreenWidth() {
        if (window.innerWidth <= 576) {
            sidebar.classList.remove('visible');
            mapContainer.classList.remove('shifted');
            sidebarToggle.innerHTML = `<i class="fas fa-chevron-right"></i>`;
        } else {
            sidebar.classList.add('visible');
            mapContainer.classList.add('shifted');
            sidebarToggle.innerHTML = `<i class="fas fa-chevron-left"></i>`;
        }
    }

    // Run check on initial load and on window resize
    checkScreenWidth();
    window.addEventListener('resize', checkScreenWidth);

    sidebarToggle.addEventListener('click', function () {
        const isVisible = sidebar.classList.toggle('visible');
        mapContainer.classList.toggle('shifted', isVisible);
        sidebarToggle.innerHTML = `<i class="fas fa-chevron-${isVisible ? 'left' : 'right'}"></i>`;
    });
});
