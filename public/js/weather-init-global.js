/* global ol */
// Weather Radar Initialization - Global Script Version
// Uses global OpenLayers (ol) loaded via CDN script tag

// Global namespace for weather radar functions
window.WeatherRadarInit = (function() {
    "use strict";

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
    function createFallbackIcon(size = 144) {
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
    async function registerServiceWorker() {
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
    async function initializeWeatherMap(targetId = "map") {
        try {
            const mapTilerKey = getMapTilerKey();

            // Check if OpenLayers is available
            if (typeof ol === "undefined") {
                throw new Error("OpenLayers not loaded - ensure ol.js is included before this script");
            }

            console.log("✅ OpenLayers found:", ol.VERSION);

            // Build base layers
            const osmLayer = new ol.layer.Tile({
                title: "OpenStreetMap",
                type: "base",
                visible: false,
                source: new ol.source.OSM()
            });

            // Google Maps satellite layer (default)
            const googleSatelliteLayer = new ol.layer.Tile({
                title: "Google Satellite",
                type: "base",
                visible: true, // Default base layer
                source: new ol.source.XYZ({
                    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                    attributions: "© Google",
                    crossOrigin: "anonymous",
                    maxZoom: 20
                })
            });

            const mapTilerLayer = mapTilerKey ? new ol.layer.Tile({
                title: "Google-like Streets (MapTiler)",
                type: "base",
                visible: false,
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
                target: targetId,
                view: new ol.View({
                    center: ol.proj.fromLonLat([-98.5795, 39.8283]),
                    zoom: 4
                }),
                layers: [
                    googleSatelliteLayer, // Default Google satellite base layer
                    ...(mapTilerLayer ? [mapTilerLayer] : []),
                    osmLayer,
                    new ol.layer.Tile({
                        source: new ol.source.XYZ({
                            url: "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png",
                            attributions: "© Iowa Environmental Mesonet",
                            crossOrigin: "anonymous"
                        }),
                        opacity: 0.7,
                        name: "radar"
                    })
                ]
            });

            // Debugging helpers
            const state = {
                hidden: false,
                base: { start: 0, ok: 0, err: 0 },
                radar: { start: 0, ok: 0, err: 0 },
                startedAt: Date.now(),
            };

            // Attach tile event listeners for base (now using Google satellite as default)
            const baseSource = googleSatelliteLayer.getSource();
            baseSource.on("tileloadstart", () => { state.base.start++; updateDebugOverlay(state); });
            baseSource.on("tileloadend", () => { state.base.ok++; maybeHideLoading(state, "base"); updateDebugOverlay(state); });
            baseSource.on("tileloaderror", () => { state.base.err++; showErrorBanner("Base tiles failed to load"); updateDebugOverlay(state); });

            // Attach tile event listeners for radar
            const radarLayer = map.getLayers().item(map.getLayers().getLength() - 1);
            const radarSource = radarLayer.getSource();
            radarSource.on("tileloadstart", () => { state.radar.start++; updateDebugOverlay(state); });
            radarSource.on("tileloadend", () => { state.radar.ok++; updateDebugOverlay(state); });
            radarSource.on("tileloaderror", () => {
                state.radar.err++;
                showErrorBanner("Radar tiles failed to load");
                updateDebugOverlay(state);
                if (state.radar.err >= 3 && state.radar.ok === 0) {
                    switchRadarFallback(radarLayer);
                }
            });

            // Start periodic radar refresh (20s) with cache-busting
            startRadarAutoRefresh(radarLayer);

            // Hide loading on first full render
            map.once("rendercomplete", () => {
                maybeHideLoading(state, "render");
            });

            // Fallback: hide after 5s even if radar fails, as long as base rendered something
            setTimeout(() => {
                if (!state.hidden) {
                    if (state.base.ok > 0) {
                        hideAllLoadingScreens();
                        state.hidden = true;
                        showErrorBanner("Radar may be slow or blocked; base map loaded");
                    } else {
                        showErrorBanner("Base map not loading; check network/CORS");
                    }
                }
            }, 5000);

            // Debug overlay (enable with ?debug=1)
            if (new URL(window.location.href).searchParams.get("debug") === "1") {
                ensureDebugOverlay();
                updateDebugOverlay(state, true);
                // Expose simple debug API
                window.debugRadar = {
                    state,
                    hide: hideAllLoadingScreens,
                    status: () => ({ ...state }),
                };
            }

            // Initial hide attempt (in case map paints immediately)
            maybeHideLoading(state, "init");

            // Global error handlers for better visibility
            window.addEventListener("unhandledrejection", (e) => {
                showErrorBanner(`Unhandled promise rejection: ${e?.reason?.message || e.reason || e}`);
            });
            window.addEventListener("error", (e) => {
                if (e?.message) showErrorBanner(`Runtime error: ${e.message}`);
            });

            console.log("✅ Weather map initialized successfully");
            return map;
        } catch (error) {
            console.error("Failed to initialize weather map:", error);
            showErrorBanner(`Initialization failed: ${error?.message || error}`);
            throw error;
        }
    }

    // Utility functions
    function hideAllLoadingScreens() {
        const els = [
            ...document.querySelectorAll("#loading-screen"),
            ...document.querySelectorAll(".loading-screen")
        ];
        els.forEach((el) => {
            el.classList?.add("hidden");
            el.style.opacity = "0";
            setTimeout(() => { el.style.display = "none"; }, 300);
        });
    }

    function maybeHideLoading(state, reason) {
        if (state.hidden) return;
        // Hide when base tiles have loaded at least one, or on first rendercomplete
        if (state.base.ok > 0 || reason === "render") {
            hideAllLoadingScreens();
            state.hidden = true;
            console.log(`✅ Loading screen hidden (${reason})`);
        }
    }

    function ensureDebugOverlay() {
        if (document.getElementById("debug-overlay")) return;
        const box = document.createElement("div");
        box.id = "debug-overlay";
        box.style.cssText = "position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,.7);color:#0f0;padding:8px 10px;font:12px monospace;z-index:99999;border-radius:4px;";
        box.innerHTML = "<div>Debug ready…</div>";
        document.body.appendChild(box);
    }

    function updateDebugOverlay(state, force) {
        const box = document.getElementById("debug-overlay");
        if (!box && !force) return;
        if (!box && force) ensureDebugOverlay();
        const el = document.getElementById("debug-overlay");
        if (!el) return;
        el.innerHTML = `
            <div>Base: start ${state.base.start} ok ${state.base.ok} err ${state.base.err}</div>
            <div>Radar: start ${state.radar.start} ok ${state.radar.ok} err ${state.radar.err}</div>
            <div>Hidden: ${state.hidden}</div>
        `;
    }

    function showErrorBanner(message) {
        // Create container once
        let container = document.getElementById("error-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "error-container";
            container.style.cssText = "position:fixed;top:10px;right:10px;max-width:400px;z-index:100000;";
            document.body.appendChild(container);
        }
        const item = document.createElement("div");
        item.style.cssText = "background:#fee2e2;border:1px solid #ef4444;color:#991b1b;padding:10px;margin:6px 0;border-radius:4px;font:13px/1.3 sans-serif;";
        item.textContent = String(message);
        container.appendChild(item);
        setTimeout(() => item.remove(), 6000);
    }

    // Switch radar layer source to RainViewer fallback
    function switchRadarFallback(radarLayer) {
        try {
            const rv = new ol.source.XYZ({
                url: "https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png",
                attributions: "© RainViewer",
                crossOrigin: "anonymous"
            });
            radarLayer.setSource(rv);
            showErrorBanner("Switched to RainViewer fallback for radar.");
            // Ensure auto-refresh continues on the new source
            startRadarAutoRefresh(radarLayer);
        } catch (e) {
            console.error("Failed to switch radar fallback:", e);
        }
    }

    // --- Radar auto-refresh (every 20 seconds) ---------------------------------
    const radarAutoRefresh = { intervalId: null, key: 0 };

    function applyRadarCacheBustingToSource(source) {
        if (!source || typeof source.setTileLoadFunction !== "function") return;
        source.setTileLoadFunction((imageTile, src) => {
            try {
                const sep = src.includes("?") ? "&" : "?";
                const cacheKey = radarAutoRefresh.key;
                imageTile.getImage().src = `${src}${sep}ts=${cacheKey}`;
            } catch (e) {
                // Fallback to default behavior if something goes wrong
                imageTile.getImage().src = src;
            }
        });
    }

    function startRadarAutoRefresh(radarLayer) {
        try {
            if (!radarLayer) return;
            // Clear existing interval if any
            if (radarAutoRefresh.intervalId) {
                clearInterval(radarAutoRefresh.intervalId);
                radarAutoRefresh.intervalId = null;
            }

            const source = radarLayer.getSource();
            applyRadarCacheBustingToSource(source);

            // Use a stable 20s bucket so all tiles share the same key within the window
            const computeKey = () => Math.floor(Date.now() / 20000);
            radarAutoRefresh.key = computeKey();
            // Trigger an immediate refresh so the first view gets the cache-busted URLs
            if (typeof source.refresh === "function") {
                source.refresh();
            } else {
                // Force a change event as a fallback
                source.changed?.();
            }

            radarAutoRefresh.intervalId = setInterval(() => {
                radarAutoRefresh.key = computeKey();
                // Refresh the current source (it may have changed due to fallback)
                const currentSource = radarLayer.getSource();
                applyRadarCacheBustingToSource(currentSource);
                if (typeof currentSource.refresh === "function") {
                    currentSource.refresh();
                } else {
                    currentSource.changed?.();
                }
            }, 20000);
        } catch (e) {
            console.error("Failed to start radar auto-refresh:", e);
        }
    }

    // Public API
    return {
        initializeWeatherMap: initializeWeatherMap,
        registerServiceWorker: registerServiceWorker,
        createFallbackIcon: createFallbackIcon
    };
})();

// Also make functions available globally for backward compatibility
window.initializeWeatherMap = window.WeatherRadarInit.initializeWeatherMap;
window.registerServiceWorker = window.WeatherRadarInit.registerServiceWorker;
