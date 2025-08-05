// Create map once the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Initializing Weather Radar Application...');

        // Create base map
        const map = new ol.Map({
            target: 'main-map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                }),
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q/{z}/{x}/{y}.png',
                        attributions: '© Iowa Environmental Mesonet'
                    }),
                    opacity: 0.7
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([-98.5795, 39.8283]), // US center
                zoom: 4
            })
        });

        // Set up map controls
        setupMapControls(map);

        console.log('✨ Weather Radar Application ready!');

    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        showError('Failed to initialize application: ' + error.message);
    }
});

/**
 * Set up map navigation controls
 */
function setupMapControls(map) {
    // Zoom controls
    document.getElementById('zoom-in')?.addEventListener('click', () => {
        const view = map.getView();
        view.animate({
            zoom: view.getZoom() + 1,
            duration: 250
        });
    });

    document.getElementById('zoom-out')?.addEventListener('click', () => {
        const view = map.getView();
        view.animate({
            zoom: view.getZoom() - 1,
            duration: 250
        });
    });

    // Geolocation
    document.getElementById('geolocation')?.addEventListener('click', () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const view = map.getView();
                view.animate({
                    center: ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]),
                    zoom: 10,
                    duration: 500
                });
            });
        }
    });

    // Reset view
    document.getElementById('reset-view')?.addEventListener('click', () => {
        const view = map.getView();
        view.animate({
            center: ol.proj.fromLonLat([-98.5795, 39.8283]), // US center
            zoom: 4,
            duration: 500
        });
    });
}

/**
 * Show error message to user
 */
function showError(message) {
    console.error('Error:', message);
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.textContent = `Error: ${message}`;
        loading.style.display = 'block';
        loading.style.backgroundColor = '#ffebee';
        loading.style.color = '#c62828';
        loading.style.border = '1px solid #ef9a9a';
    }
}
