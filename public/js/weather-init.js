/* global ol */
// Weather Radar Initialization Module
import "https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js";

// Get MapTiler API key from window, query param, or localStorage
function getMapTilerKey() {
    try {
        if (window.MAPTILER_KEY) return String(window.MAPTILER_KEY);
        const url = new URL(window.location.href);
        const qp = url.searchParams.get("mtk");
        if (qp) {
            // Persist for future visits
            try {
                localStorage.setItem("MAPTILER_KEY", qp);
            } catch (persistErr) {
                console.warn("Could not persist MAPTILER_KEY:", persistErr);
            }
            return qp;
        }
        const ls = localStorage.getItem("MAPTILER_KEY");
        if (ls) return ls;
    } catch (e) {
        console.warn("MapTiler key lookup issue:", e);
    }
    return "";
}

// Icon handling
export function createFallbackIcon(size = 144) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Draw weather icon
    ctx.fillStyle = "#2196f3";
    ctx.fillRect(0, 0, size, size);
    ctx.font = `${size * 0.6}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🌦️", size/2, size/2);

    return canvas.toDataURL("image/png");
}

// Service Worker Registration
export async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.log("Service workers not supported");
        return;
    }

    try {
        // Unregister any existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }

        // Register new service worker with correct scope
        const registration = await navigator.serviceWorker.register("/public/sw.js", {
            scope: "/public/"
        });
        console.log("✅ Service Worker registered:", registration.scope);

        // Set up message channel
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            if (event.data.status === "ready") {
                console.log("Service Worker is ready");
            }
        };

        // Send init message
        registration.active?.postMessage(
            { type: "INIT" },
            [messageChannel.port2]
        );

    } catch (error) {
        console.error("Service Worker registration failed:", error);
        throw error;
    }
}

// Initialize Weather Map
export async function initializeWeatherMap() {
    try {
        const mapTilerKey = getMapTilerKey();

        // Build base layers
        const osmLayer = new ol.layer.Tile({
            title: "OpenStreetMap",
            type: "base",
            visible: !mapTilerKey,
            source: new ol.source.OSM()
        });

        const mapTilerLayer = mapTilerKey ? new ol.layer.Tile({
            title: "Google-like Streets (MapTiler)",
            type: "base",
            visible: true,
            source: new ol.source.XYZ({
                url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`,
                attributions: [
                    "© MapTiler",
                    "© OpenStreetMap contributors"
                ],
                crossOrigin: "anonymous"
            })
        }) : null;

        const map = new ol.Map({
            target: "map",
            view: new ol.View({
                center: ol.proj.fromLonLat([-98.5795, 39.8283]),
                zoom: 4
            }),
            layers: [
                ...(mapTilerLayer ? [mapTilerLayer] : []),
                osmLayer,
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png",
                        attributions: "© Iowa Environmental Mesonet",
                        crossOrigin: "anonymous"
                    }),
                    opacity: 0.7
                })
            ]
        });
    // Hide loading screen if present
    hideLoadingScreen();

    return map;
    } catch (error) {
    console.error("Failed to initialize weather map:", error);
        throw error;
    }
}

// Handle Icon Errors
window.addEventListener("error", function(e) {
    if (e.target.tagName === "IMG" || e.target.tagName === "LINK") {
        const src = e.target.src || e.target.href;
        if (src && src.includes("icon")) {
            const size = src.includes("144x144") ? 144 : 192;
            const fallbackUrl = createFallbackIcon(size);
            if (e.target.tagName === "IMG") {
                e.target.src = fallbackUrl;
            } else if (e.target.rel === "manifest") {
                // Update manifest with fallback icon
                const manifest = {
                    icons: [{
                        src: fallbackUrl,
                        sizes: `${size}x${size}`,
                        type: "image/png"
                    }]
                };
                const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
                e.target.href = URL.createObjectURL(blob);
            }
        }
    }
}, true);

// Utility: hide the loading overlay if it exists
function hideLoadingScreen() {
    const el = document.getElementById("loading-screen");
    if (el) {
        el.classList.add("hidden");
        // Fallback inline style for older CSS
        el.style.opacity = "0";
        setTimeout(() => {
            el.style.display = "none";
        }, 300);
    }
}
