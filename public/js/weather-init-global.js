/* global ol */
// Weather Radar Initialization - Global Script Version
// Uses global OpenLayers (ol) loaded via CDN script tag

// Global namespace for weather radar functions
window.WeatherRadarInit = (function() {
    "use strict";

    // Load optional local config for API keys
    let __localConfig = null;
    async function loadLocalConfigOnce() {
        if (__localConfig !== null) return __localConfig;
        try {
            const res = await fetch('/public/config.local.json', { cache: 'no-store' });
            if (res.ok) {
                __localConfig = await res.json();
            } else {
                __localConfig = {};
            }
        } catch (_) {
            __localConfig = {};
        }
        return __localConfig;
    }

    // Get MapTiler API key from config, window, query param, or localStorage
    async function getMapTilerKey() {
        try {
            const cfg = await loadLocalConfigOnce();
            if (cfg?.MAPTILER_KEY) return String(cfg.MAPTILER_KEY);
            if (window.API_KEYS?.MAPTILER_KEY) return String(window.API_KEYS.MAPTILER_KEY);
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
    async function getBingKey() {
        try {
            const cfg = await loadLocalConfigOnce();
            if (cfg?.BING_MAPS_KEY) return String(cfg.BING_MAPS_KEY);
        if (window.API_KEYS?.BING_MAPS_KEY) return String(window.API_KEYS.BING_MAPS_KEY);
            if (window.BING_MAPS_KEY) return String(window.BING_MAPS_KEY);
            const ls = localStorage.getItem('BING_MAPS_KEY');
            if (ls) return ls;
        } catch (_) {}
        return '';
    }
    async function getGoogleKey() {
        try {
            const cfg = await loadLocalConfigOnce();
        if (cfg?.GOOGLE_MAPS_API_KEY) return String(cfg.GOOGLE_MAPS_API_KEY);
        if (window.API_KEYS?.GOOGLE_MAPS_KEY) return String(window.API_KEYS.GOOGLE_MAPS_KEY);
        if (window.GOOGLE_MAPS_API_KEY) return String(window.GOOGLE_MAPS_API_KEY);
            const ls = localStorage.getItem('GOOGLE_MAPS_API_KEY');
            if (ls) return ls;
        } catch (_) {}
        return '';
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

            // Pick a service worker script that is actually served with a JavaScript MIME type
            const candidates = ["/public/sw.js", "/sw.js"]; // prefer /public
            let chosen = null;
            let chosenBlobUrl = null;
            for (const path of candidates) {
                try {
                    const resp = await fetch(path, { cache: 'no-store' });
                    if (!resp.ok) continue;
                    const ct = (resp.headers.get('content-type') || '').toLowerCase();
                    const text = await resp.text();
                    const looksHtml = /^\s*<!doctype|^\s*<html|^\s*<head|^\s*<body/i.test(text);
                    const looksJs = /self\.|addEventListener\(\s*['"](install|activate|fetch)['"]\)/i.test(text);
                    if (looksHtml) { console.warn(`Skipping SW at ${path}: response looks like HTML`); continue; }
                    if (!/javascript|ecmascript|text\/plain|application\/x-javascript/.test(ct) && !looksJs) {
                        console.warn(`Skipping SW at ${path}: content-type not JS-like and code doesn't look like SW`);
                        continue;
                    }
                    // Use a Blob URL from the fetched body to ensure we register exactly what we validated
                    const blob = new Blob([text], { type: 'application/javascript' });
                    chosenBlobUrl = URL.createObjectURL(blob);
                    chosen = path;
                    break;
                } catch (_) { /* try next */ }
            }
            if (!chosen) {
                console.warn("Skipping Service Worker registration: sw.js not served as JavaScript");
                return;
            }

            // Register new service worker with correct scope
            const registration = await navigator.serviceWorker.register(chosenBlobUrl || chosen, {
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
            console.warn("Service Worker registration skipped due to error:", error);
            // Soft-fail: proceed without SW rather than surfacing a runtime error
            return;
        }
    }

    // Initialize Weather Map
    async function initializeWeatherMap(targetId = "map") {
        try {
            // Load keys
            const [mapTilerKey, bingKey] = await Promise.all([
                getMapTilerKey(),
                getBingKey()
            ]);

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

            // Google Maps road view
            const googleRoadLayer = new ol.layer.Tile({
                title: "Google Roads",
                type: "base",
                visible: false,
                source: new ol.source.XYZ({
                    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
                    attributions: "© Google",
                    crossOrigin: "anonymous",
                    maxZoom: 20
                })
            });

            // Google Maps hybrid view (satellite + labels)
            const googleHybridLayer = new ol.layer.Tile({
                title: "Google Hybrid",
                type: "base",
                visible: false,
                source: new ol.source.XYZ({
                    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                    attributions: "© Google",
                    crossOrigin: "anonymous",
                    maxZoom: 20
                })
            });

            // Bing Maps road view (requires key; fallback to ESRI if absent)
            const bingRoadLayer = new ol.layer.Tile({
                title: "Bing Roads",
                type: "base",
                visible: false,
                source: new ol.source.XYZ({
                    url: bingKey ? "https://ecn.t{0-3}.tiles.virtualearth.net/tiles/r{quad}?g=1" : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                    attributions: "© Microsoft",
                    crossOrigin: "anonymous",
                    maxZoom: 19,
                    tileUrlFunction: bingKey ? function(tileCoord) {
                        try {
                            const z = tileCoord[0];
                            const x = tileCoord[1];
                            const y = tileCoord[2];
                            let quad = "";
                            for (let i = z; i > 0; i--) {
                                let digit = 0;
                                const mask = 1 << (i - 1);
                                if ((x & mask) !== 0) digit++;
                                if ((y & mask) !== 0) digit += 2;
                                quad += digit;
                            }
                            const server = Math.floor(Math.random() * 4);
                            return `https://ecn.t${server}.tiles.virtualearth.net/tiles/r${quad}?g=1&key=${encodeURIComponent(bingKey)}`;
                        } catch (error) {
                            console.warn('Bing Roads URL generation error:', error);
                            return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${tileCoord[0]}/${tileCoord[2]}/${tileCoord[1]}`;
                        }
                    } : undefined
                })
            });

            // Bing Maps satellite view (Aerial)
            const bingSatelliteLayer = new ol.layer.Tile({
                title: "Bing Satellite",
                type: "base",
                visible: false,
                source: new ol.source.XYZ({
                    url: bingKey ? "https://ecn.t{0-3}.tiles.virtualearth.net/tiles/a{quad}?g=1" : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    attributions: "© Microsoft",
                    crossOrigin: "anonymous",
                    maxZoom: 19,
                    tileUrlFunction: bingKey ? function(tileCoord) {
                        try {
                            const z = tileCoord[0];
                            const x = tileCoord[1];
                            const y = tileCoord[2];
                            let quad = "";
                            for (let i = z; i > 0; i--) {
                                let digit = 0;
                                const mask = 1 << (i - 1);
                                if ((x & mask) !== 0) digit++;
                                if ((y & mask) !== 0) digit += 2;
                                quad += digit;
                            }
                            const server = Math.floor(Math.random() * 4);
                            return `https://ecn.t${server}.tiles.virtualearth.net/tiles/a${quad}?g=1&key=${encodeURIComponent(bingKey)}`;
                        } catch (error) {
                            console.warn('Bing Satellite URL generation error:', error);
                            return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tileCoord[0]}/${tileCoord[2]}/${tileCoord[1]}`;
                        }
                    } : undefined
                })
            });

            // Bing Maps hybrid view (Aerial with labels)
            const bingHybridLayer = new ol.layer.Tile({
                title: "Bing Hybrid",
                type: "base",
                visible: false,
                source: new ol.source.XYZ({
                    url: bingKey ? "https://ecn.t{0-3}.tiles.virtualearth.net/tiles/h{quad}?g=1" : "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                    attributions: "© Microsoft",
                    crossOrigin: "anonymous",
                    maxZoom: 19,
                    tileUrlFunction: bingKey ? function(tileCoord) {
                        try {
                            const z = tileCoord[0];
                            const x = tileCoord[1];
                            const y = tileCoord[2];
                            let quad = "";
                            for (let i = z; i > 0; i--) {
                                let digit = 0;
                                const mask = 1 << (i - 1);
                                if ((x & mask) !== 0) digit++;
                                if ((y & mask) !== 0) digit += 2;
                                quad += digit;
                            }
                            const server = Math.floor(Math.random() * 4);
                            return `https://ecn.t${server}.tiles.virtualearth.net/tiles/h${quad}?g=1&key=${encodeURIComponent(bingKey)}`;
                        } catch (error) {
                            console.warn('Bing Hybrid URL generation error:', error);
                            return `https://mt1.google.com/vt/lyrs=y&x=${tileCoord[1]}&y=${tileCoord[2]}&z=${tileCoord[0]}`;
                        }
                    } : undefined
                })
            });

        const mapTilerLayer = mapTilerKey ? new ol.layer.Tile({
                title: "MapTiler Streets",
                type: "base",
                visible: false,
                source: new ol.source.XYZ({
            url: `https://api.maptiler.com/maps/streets-v2/tiles/256/{z}/{x}/{y}.png?key=${mapTilerKey}`,
                    attributions: [
                        "© MapTiler",
                        "© OpenStreetMap contributors"
                    ],
                    crossOrigin: "anonymous"
                })
            }) : new ol.layer.Tile({
                title: "ESRI World Street Map",
                type: "base",
                visible: false,
                source: new ol.source.XYZ({
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                    attributions: "© ESRI",
                    crossOrigin: "anonymous"
                })
            });

            const map = new ol.Map({
                target: targetId,
                view: new ol.View({
                    center: ol.proj.fromLonLat([-98.5795, 39.8283]),
                    zoom: 4
                }),
                layers: [
                    googleSatelliteLayer, // Default Google satellite base layer
                    googleRoadLayer, // Google Maps road view
                    googleHybridLayer, // Google Maps hybrid view
                    bingRoadLayer, // Bing Maps road view
                    bingSatelliteLayer, // Bing Maps satellite view
                    bingHybridLayer, // Bing Maps hybrid view
                    mapTilerLayer, // MapTiler or ESRI fallback
                    osmLayer,
                    new ol.layer.Tile({
                        source: new ol.source.XYZ({
                            url: "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png",
                            attributions: "© Iowa Environmental Mesonet",
                            crossOrigin: "anonymous",
                            tileLoadFunction: function(tile, src) {
                                const img = tile.getImage();
                                img.onload = function() {
                                    tile.setState(1); // LOADED
                                };
                                img.onerror = function() {
                                    // Log individual tile errors but don't immediately switch sources
                                    console.warn('NEXRAD tile failed (normal for some areas):', src);
                                    tile.setState(3); // ERROR - let OpenLayers handle fallback
                                };
                                img.src = src;
                            }
                        }),
                        opacity: 0.7,
                        name: "radar"
                    })
                ]
            });

            // Create a second radar layer (for crossfade). It sits above the primary radar layer.
            try {
                const radarPrimary = map.getLayers().item(map.getLayers().getLength() - 1);
                const radarSecondary = new ol.layer.Tile({
                    source: null,
                    opacity: 0,
                    visible: true,
                    name: "radar2"
                });
                // Ensure map reference is available to helpers
                radarPrimary.set('mapRef', map);
                radarSecondary.set('mapRef', map);
                // Put the secondary radar on top
                map.addLayer(radarSecondary);
                // Track active layer for crossfade swaps
                map.__rvLayers = { A: radarPrimary, B: radarSecondary, active: 'A' };
            } catch (e) {
                console.warn('Failed to create secondary radar layer for crossfade:', e);
            }

            // If using MapTiler, attach error fallback to ESRI when repeated failures occur
            try {
                if (mapTilerKey && mapTilerLayer && typeof mapTilerLayer.getSource === 'function') {
                    const mtSrc = mapTilerLayer.getSource();
                    // Counters for basic health
                    const mtCounters = { ok: 0, err: 0 };
                    mtSrc.on('tileloadend', () => { mtCounters.ok++; });
                    mtSrc.on('tileloaderror', () => {
                        mtCounters.err++;
                        if (mtCounters.err >= 3 && mtCounters.ok === 0) {
                            console.warn('MapTiler tiles failing; switching to ESRI World Street Map');
                            showErrorBanner('MapTiler unavailable — using ESRI Streets fallback');
                            mapTilerLayer.set('title', 'ESRI World Street Map (fallback)');
                            mapTilerLayer.setSource(new ol.source.XYZ({
                                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                                attributions: '© ESRI',
                                crossOrigin: 'anonymous'
                            }));
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to attach MapTiler fallback logic:', e);
            }

            // Debugging helpers
            const state = {
                hidden: false,
                base: { start: 0, ok: 0, err: 0 },
                radar: { start: 0, ok: 0, err: 0 },
                startedAt: Date.now(),
                radarSource: "NEXRAD",
                rv: { frames: [], index: 0, playing: false, timerId: null, speedMs: Number(localStorage.getItem("rv_speed_ms")) || 5000, mode: localStorage.getItem("rv_mode") || "2h", transitioning: false, crossfadeDurationMs: 2000 },
                fallback: { active: false, lastAt: 0, count: 0 },
                overlays: {}
            };

            // Attach tile event listeners for base (now using Google satellite as default)
            const baseSource = googleSatelliteLayer.getSource();
            baseSource.on("tileloadstart", () => { state.base.start++; updateDebugOverlay(state); });
            baseSource.on("tileloadend", () => { state.base.ok++; maybeHideLoading(state, "base"); updateDebugOverlay(state); });
            baseSource.on("tileloaderror", () => { state.base.err++; showErrorBanner("Base tiles failed to load"); updateDebugOverlay(state); });

            // Helpers to format/log tile coords
            const xyzFromTileCoord = (tileCoord) => {
                if (!tileCoord) return null;
                const z = tileCoord[0];
                const x = tileCoord[1];
                const yTMS = tileCoord[2];
                const y = -yTMS - 1; // convert OL TMS to XYZ
                return { z, x, y };
            };

            const logRadar = (eventType, e) => {
                try {
                    const coord = xyzFromTileCoord(e?.tile?.getTileCoord?.());
                    const src = e?.tile?.getImage?.()?.src || "(src unknown)";
                    if (coord) {
                        // eslint-disable-next-line no-console
                        console.log(`RADAR ${eventType}: z=${coord.z} x=${coord.x} y=${coord.y} -> ${src}`);
                    } else {
                        // eslint-disable-next-line no-console
                        console.log(`RADAR ${eventType}: (coord unavailable) -> ${src}`);
                    }
                } catch (_) { /* no-op */ }
            };

            // Attach tile event listeners for radar (with granular logs)
            const radarLayer = map.__rvLayers ? map.__rvLayers.A : map.getLayers().item(map.getLayers().getLength() - 1);
            // Generic binder for tile logging on any overlay source
            const bindTileListenersToSource = (src, counters, label) => {
                if (!src || src.__radarListenersBound) return;
                src.__radarListenersBound = true;
                src.on("tileloadstart", (e) => { counters.start++; (label==="radar"?logRadar("START", e):console.log(`${label} START`, e)); updateDebugOverlay(state); });
                src.on("tileloadend", (e) => { counters.ok++; (label==="radar"?logRadar("OK", e):console.log(`${label} OK`, e)); updateDebugOverlay(state); });
                src.on("tileloaderror", (e) => {
                    counters.err++;
                    if (label === "radar") {
                        logRadar("ERROR", e);
                        // Only show error banner and switch fallback if we have many errors and no successes
                        // Add cooldown and one-shot guard to avoid thrashing
                        const now = Date.now();
                        const inCooldown = (now - (state.fallback.lastAt || 0)) < 120000; // 2 min cooldown
                        const alreadyFallback = String(state.radarSource || "").toLowerCase().includes("rainviewer");
                        if (state.radar.err >= 5 && state.radar.ok === 0 && counters.start > 3) {
                            if (state.fallback.active || inCooldown || alreadyFallback) {
                                // Avoid repeated switching; just note once
                                if (!state.__notedFallbackCooldown) {
                                    showErrorBanner("Radar tiles failing; waiting on fallback cooldown");
                                    state.__notedFallbackCooldown = true;
                                }
                            } else {
                                showErrorBanner("Radar tiles failed to load - switching to fallback");
                                state.fallback.active = true;
                                state.fallback.lastAt = now;
                                state.fallback.count = (state.fallback.count || 0) + 1;
                                switchRadarFallback(radarLayer, state);
                                // Clear cooldown note when we attempt a switch
                                state.__notedFallbackCooldown = false;
                                // Auto-release active flag after cooldown window
                                setTimeout(() => { state.fallback.active = false; }, 120000);
                            }
                        } else if (state.radar.err > 10 && state.radar.ok < 3) {
                            console.warn('High radar tile error rate, but some tiles loading - continuing');
                        }
                    } else {
                        console.warn(`${label} ERROR`, e);
                    }
                    updateDebugOverlay(state);
                });
            };

            const bindRadarListenersToSource = (src) => bindTileListenersToSource(src, state.radar, "radar");

            // Expose binder for use by crossfade logic outside this init function
            map.__bindRadarListenersToSource = (src) => bindRadarListenersToSource(src);

            const radarSource = radarLayer.getSource();
            bindRadarListenersToSource(radarSource);

            // Ensure listeners get rebound if the radar source changes (e.g., fallback)
        radarLayer.on("change:source", () => {
                try {
                    const newSrc = radarLayer.getSource();
            // Reset radar counters when source changes to avoid immediate re-trigger
            state.radar.start = 0; state.radar.ok = 0; state.radar.err = 0;
                    bindRadarListenersToSource(newSrc);
                } catch (e) {
                    console.warn("Failed to bind listeners to new radar source", e);
                }
            });

            // Also bind change:source for the secondary layer if present
            try {
                if (map.__rvLayers?.B) {
                    map.__rvLayers.B.on('change:source', () => {
                        try {
                            const newSrc = map.__rvLayers.B.getSource();
                            state.radar.start = 0; state.radar.ok = 0; state.radar.err = 0;
                            bindRadarListenersToSource(newSrc);
                        } catch (e) {
                            console.warn('Failed to bind listeners to radar2 source', e);
                        }
                    });
                }
            } catch (e) { /* no-op */ }

            // Start periodic radar refresh (20s) with cache-busting
            startRadarAutoRefresh(radarLayer);

            // Prefer RainViewer as the primary radar source
            // This will fetch the latest 2-hour timeline and set the most recent frame
            try {
        enableRainviewerTimeline(map).then((frames) => {
                    if (Array.isArray(frames) && frames.length) {
                        const latestIdx = frames.length - 1;
            setRainviewerFrameByIndex(map, latestIdx, map.__radarState);
                        showErrorBanner("Using RainViewer radar by default");
                    } else {
                        console.warn("RainViewer frames unavailable; keeping NEXRAD until fallback triggers");
                    }
                }).catch((e) => console.warn("RainViewer default init failed", e));
            } catch (e) {
                console.warn("Failed to enable RainViewer by default", e);
            }

            // Hide loading on first full render
            map.once("rendercomplete", () => {
                maybeHideLoading(state, "render");
            });

            // Fallback: hide after 7s even if radar fails, as long as base rendered something
            setTimeout(() => {
                if (!state.hidden) {
                    if (state.base.ok > 0) {
                        hideAllLoadingScreens();
                        state.hidden = true;
                        if (state.radar.ok === 0) {
                            showErrorBanner("Radar isn't available right now. Showing base map and continuing to retry.");
                            // As an extra safety, switch to fallback if we still have no radar
                            const now = Date.now();
                            const inCooldown = (now - (state.fallback?.lastAt || 0)) < 120000;
                            const alreadyFallback = String(state.radarSource || "").toLowerCase().includes("rainviewer");
                            if (!inCooldown && !alreadyFallback && !state.fallback?.active) {
                                try {
                                    state.fallback.active = true;
                                    state.fallback.lastAt = now;
                                    state.fallback.count = (state.fallback.count || 0) + 1;
                                    switchRadarFallback(radarLayer, state);
                                    setTimeout(() => { state.fallback.active = false; }, 120000);
                                } catch (_) { /* ignore */ }
                            }
                        }
                    } else {
                        showErrorBanner("Base map not loading; check network/CORS");
                    }
                }
            }, 7000);

            // Debug overlay (enable with ?debug=1)
            if (new URL(window.location.href).searchParams.get("debug") === "1") {
                ensureDebugOverlay();
                updateDebugOverlay(state, true);
                // Expose simple debug API
                window.debugRadar = {
                    state,
                    hide: hideAllLoadingScreens,
                    status: () => ({ ...state }),
                    setSpeed: (ms) => { state.rv.speedMs = Number(ms)||700; try{localStorage.setItem("rv_speed_ms", String(state.rv.speedMs));}catch(_){}} ,
                    setMode: (mode) => { state.rv.mode = mode; try{localStorage.setItem("rv_mode", mode);}catch(_){}} ,
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

            // Attach state for external controls
            map.__radarState = state;

            console.log("✅ Weather map initialized successfully");
            return map;
        } catch (error) {
            console.error("Failed to initialize weather map:", error);
            showErrorBanner(`Initialization failed: ${error?.message || error}`);
            throw error;
        }
    }

    // --- RainViewer Timeline Support -----------------------------------------
    async function getRainviewerTimeline() {
        try {
            const res = await fetch("https://api.rainviewer.com/public/weather-maps.json", { cache: "no-store" });
            if (!res.ok) throw new Error(`RainViewer API ${res.status}`);
            const json = await res.json();
            const frames = Array.isArray(json?.radar?.past) ? json.radar.past : (Array.isArray(json?.radar) ? json.radar : []);
            const nowcast = Array.isArray(json?.radar?.nowcast) ? json.radar.nowcast : [];
            // Combine past + nowcast for a continuous loop
            const all = [...frames, ...nowcast];
            return all.map((f) => ({
                time: f.time || f.t || null,
                path: f.path || null,
            })).filter((f) => f.time || f.path);
        } catch (e) {
            showErrorBanner(`Failed to load RainViewer timeline: ${e.message}`);
            return [];
        }
    }

    function findRadarLayer(map) {
        if (!map) return null;
        if (map.__rvLayers && (map.__rvLayers.active === 'A' || map.__rvLayers.active === 'B')) {
            return map.__rvLayers[map.__rvLayers.active];
        }
        const layers = map.getLayers().getArray();
        return layers.find((l) => l.get("name") === "radar") || layers[layers.length - 1] || null;
    }

    function setRainviewerFrameByIndex(map, index, stateRef) {
        try {
            const mapObj = map;
            const radarLayer = findRadarLayer(mapObj);
            if (!radarLayer) return;
            const frames = stateRef?.rv?.frames || [];
            if (!frames.length) return;
            const i = ((index % frames.length) + frames.length) % frames.length;
            const frame = frames[i];

            // Use the frame URL from RainViewer API
            let url;
            if (frame.path) {
                // frame.path is a base path; append tile template per docs
                url = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
            } else {
                url = `https://tilecache.rainviewer.com/v2/radar/${frame.time}/256/{z}/{x}/{y}/2/1_1.png`;
            }

            const src = new ol.source.XYZ({
                url,
                attributions: "© RainViewer",
                crossOrigin: "anonymous",
                maxZoom: 10
            });

            // Apply cache-buster to the new source immediately
            try { applyRadarCacheBustingToSource(src); } catch (_) {}

            // If dual-layer crossfade is available, fade between layers
            const doCrossfade = !!mapObj.__rvLayers && (stateRef?.rv ? stateRef.rv.crossfadeEnabled !== false : true);
            if (doCrossfade) {
                const activeKey = mapObj.__rvLayers.active || 'A';
                const fromLayer = mapObj.__rvLayers[activeKey];
                const toKey = activeKey === 'A' ? 'B' : 'A';
                const toLayer = mapObj.__rvLayers[toKey];

                // Set new source on the toLayer
                toLayer.setSource(src);
                toLayer.setOpacity(0);
                toLayer.setVisible(true);
                // Bind listeners for tile logging/counters
                try { mapObj.__bindRadarListenersToSource?.(src); } catch (_) {}

                // Wait for at least a few tiles to load on the new source, or fallback after a timeout
                const targetOpacity = 0.7;
                const duration = (stateRef?.rv?.crossfadeDurationMs) || 800;
                stateRef.rv.transitioning = true;

                let done = false;
                const maybeStart = () => {
                    if (done) return;
                    done = true;
                    animateCrossfadeLayers(mapObj, fromLayer, toLayer, duration, targetOpacity, () => {
                        try {
                            mapObj.__rvLayers.active = toKey;
                            fromLayer.setOpacity(0);
                            toLayer.setOpacity(targetOpacity);
                        } catch (_) { /* noop */ }
                        stateRef.rv.transitioning = false;
                    });
                };

                try {
                    let toOk = 0;
                    const minTiles = 2; // require at least a couple of tiles before fading
                    const onLoadEnd = () => {
                        toOk++;
                        if (toOk >= minTiles) {
                            // Small delay to allow a few tiles to land
                            setTimeout(maybeStart, 120);
                            try { src.un('tileloadend', onLoadEnd); } catch (_) {}
                        }
                    };
                    src.on('tileloadend', onLoadEnd);
                } catch (_) { /* ignore */ }

                // Fallback: if nothing loads in time, either skip frame or force a gentle fade
                const maxWait = Math.min(3000, Math.max(900, Math.floor((stateRef?.rv?.speedMs || 5000) * 0.9)));
                    setTimeout(() => {
                    if (!done) {
                        // If still nothing loaded, consider skipping this frame once
                        if (frames.length > 1) {
                                const next2 = i < (frames.length - 1) ? (i + 1) : i;
                            // Mark current transition finished before jumping
                            stateRef.rv.transitioning = false;
                            setRainviewerFrameByIndex(mapObj, next2, stateRef);
                        } else {
                            maybeStart();
                        }
                    }
                }, maxWait);
            } else {
                // Fallback: single-layer swap
                radarLayer.setSource(src);
                radarLayer.setOpacity(0.7);
            }

            if (stateRef) {
                stateRef.rv.index = i;
                stateRef.radarSource = `RainViewer@${frame.time || "path"}`;
                try { localStorage.setItem("rv_frame_index", String(i)); } catch(_){}
                // Notify listeners that the frame index changed
                try { window.dispatchEvent(new CustomEvent("rv:frame", { detail: { index: i } })); } catch(_) { }
            }

            startRadarAutoRefresh(radarLayer);
        } catch (e) {
            console.error("Failed to set RainViewer frame:", e);
        }
    }

    function playRainviewer(map, stateRef, speedMs = undefined) {
        try {
            const mapObj = map;
            if (!stateRef?.rv?.frames?.length) return;
            pauseRainviewer(map, stateRef);
            const ms = Number(speedMs || stateRef.rv.speedMs || 5000);
            stateRef.rv.speedMs = ms;
            try { localStorage.setItem("rv_speed_ms", String(ms)); } catch(_){}
            stateRef.rv.playing = true;
            stateRef.rv.timerId = setInterval(() => {
                // Avoid advancing while a crossfade/transition is in progress
                if (stateRef?.rv?.transitioning) return;
                const startOk = stateRef.radar?.ok || 0;
                const next = (stateRef.rv.index + 1) % stateRef.rv.frames.length;
                setRainviewerFrameByIndex(mapObj, next, stateRef);
                // Heuristic: if no new tiles have loaded soon after, skip ahead once
                setTimeout(() => {
                    const afterOk = stateRef.radar?.ok || 0;
                    if (afterOk <= startOk) {
                        const next2 = (stateRef.rv.index + 1) % stateRef.rv.frames.length;
                        setRainviewerFrameByIndex(mapObj, next2, stateRef);
                    }
                }, Math.max(900, Math.min(2000, Math.floor(ms * 0.6))));
            }, ms);
        } catch (e) {
            console.warn("Failed to start RainViewer playback", e);
        }
    }

    function pauseRainviewer(_, stateRef) {
        try {
            if (stateRef?.rv?.timerId) {
                clearInterval(stateRef.rv.timerId);
                stateRef.rv.timerId = null;
            }
            if (stateRef?.rv) stateRef.rv.playing = false;
        } catch (_) { /* no-op */ }
    }

    async function enableRainviewerTimeline(map) {
        try {
            if (!map) return [];
            const stateRef = map.__radarState || { rv: { frames: [], index: 0 } };
            let frames = await getRainviewerTimeline();

            // Always use the natural 2-hour timeline from RainViewer API
            stateRef.rv.frames = frames;
            if (!map.__radarState) map.__radarState = stateRef;

            // Restore last frame index if available
            try {
                const savedIdx = Number(localStorage.getItem("rv_frame_index"));
                if (!Number.isNaN(savedIdx) && frames.length) {
                    stateRef.rv.index = Math.min(Math.max(savedIdx, 0), frames.length - 1);
                }
            } catch(_){}

            // If we have frames, set an initial frame (default to latest)
            if (frames && frames.length) {
                const idx = Number.isInteger(stateRef.rv.index) ? stateRef.rv.index : frames.length - 1;
                setRainviewerFrameByIndex(map, idx, stateRef);
            }

            return frames;
        } catch (e) {
            showErrorBanner(`Failed to enable RainViewer timeline: ${e.message}`);
            return [];
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
            <div>Radar Source: ${state.radarSource || "Unknown"}</div>
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
    function switchRadarFallback(radarLayer, state) {
        try {
            // Fetch current RainViewer timestamps and use the latest
            fetch('https://api.rainviewer.com/public/weather-maps.json')
                .then(res => res.json())
                .then(data => {
                    const frames = [...(data?.radar?.past || []), ...(data?.radar?.nowcast || [])];
                    if (frames.length > 0) {
                        const latest = frames[frames.length - 1];
                        let url;
                        if (latest.path) {
                            url = `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
                        } else {
                            url = `https://tilecache.rainviewer.com/v2/radar/${latest.time}/256/{z}/{x}/{y}/2/1_1.png`;
                        }

                        const rv = new ol.source.XYZ({
                            url: url,
                            attributions: "© RainViewer",
                            crossOrigin: "anonymous",
                            maxZoom: 10
                        });

                        if (radarLayer) {
                            // If crossfade layers exist, update the active layer source
                            const mapRef = radarLayer.get('mapRef');
                            if (mapRef?.__rvLayers) {
                                const activeKey = mapRef.__rvLayers.active || 'A';
                                const activeLayer = mapRef.__rvLayers[activeKey];
                                try { applyRadarCacheBustingToSource(rv); } catch (_) {}
                                activeLayer.setSource(rv);
                                activeLayer.setOpacity(0.7);
                            } else {
                                radarLayer.setSource(rv);
                                radarLayer.setOpacity(0.7);
                            }
                            if (state) state.radarSource = "RainViewer-Live";
                            // Reduce banner spam: only show once per cooldown
                            if (!state || (Date.now() - (state.fallback?.lastAt || 0)) > 59000) {
                                showErrorBanner("Switched to RainViewer live radar data.");
                            }
                            // Reset counters when switching
                            if (state) { state.radar.start = 0; state.radar.ok = 0; state.radar.err = 0; }
                            startRadarAutoRefresh(radarLayer);
                        }
                    } else {
                        throw new Error('No RainViewer frames available');
                    }
                })
                .catch(err => {
                    console.warn('RainViewer API failed, using ESRI satellite as final fallback:', err);
                    if (radarLayer) {
                        const esri = new ol.source.XYZ({
                            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                            attributions: "© ESRI",
                            crossOrigin: "anonymous"
                        });
                        const mapRef = radarLayer.get('mapRef');
                        if (mapRef?.__rvLayers) {
                            const activeKey = mapRef.__rvLayers.active || 'A';
                            const activeLayer = mapRef.__rvLayers[activeKey];
                            activeLayer.setSource(esri);
                            activeLayer.setOpacity(0.3);
                        } else {
                            radarLayer.setSource(esri);
                            radarLayer.setOpacity(0.3); // Lower opacity for satellite
                        }
                        if (state) state.radarSource = "ESRI-Satellite-Fallback";
                        if (!state || (Date.now() - (state.fallback?.lastAt || 0)) > 59000) {
                            showErrorBanner("Using ESRI satellite imagery - radar unavailable.");
                        }
                        if (state) { state.radar.start = 0; state.radar.ok = 0; state.radar.err = 0; }
                    }
                });

            updateDebugOverlay(state || { base: {start:0,ok:0,err:0}, radar: {start:0,ok:0,err:0}, hidden: false });
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
                const withTs = `${src}${sep}ts=${cacheKey}`;
                // Try to log the z/x/y if present in URL for easier debugging
                try { console.log("RADAR START(loadfn):", withTs); } catch (_) { /* no-op */ }
                imageTile.getImage().src = withTs;
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
            if (source) {
                if (typeof source.refresh === "function") { source.refresh(); } else { source.changed?.(); }
            }

            radarAutoRefresh.intervalId = setInterval(() => {
                radarAutoRefresh.key = computeKey();
                // Refresh the current source(s) (it/they may have changed due to crossfade/fallback)
                const mapRef = radarLayer.get('mapRef');
                if (mapRef?.__rvLayers) {
                    const layers = [mapRef.__rvLayers.A, mapRef.__rvLayers.B].filter(Boolean);
                    for (const lyr of layers) {
                        try {
                            const srcL = lyr.getSource();
                            applyRadarCacheBustingToSource(srcL);
                            if (srcL) {
                                if (typeof srcL.refresh === 'function') srcL.refresh(); else srcL.changed?.();
                            }
                        } catch (_) { /* ignore */ }
                    }
                } else {
                    const currentSource = radarLayer.getSource();
                    applyRadarCacheBustingToSource(currentSource);
                    if (currentSource) {
                        if (typeof currentSource.refresh === "function") { currentSource.refresh(); } else { currentSource.changed?.(); }
                    }
                }
            }, 20000);
        } catch (e) {
            console.error("Failed to start radar auto-refresh:", e);
        }
    }

    // --- Crossfade Animation Utility -----------------------------------------
    function animateCrossfadeLayers(map, fromLayer, toLayer, durationMs, targetOpacity, onDone) {
        try {
            if (!fromLayer || !toLayer) { onDone?.(); return; }
            // Cancel any previous animation
            if (map.__rvAnimId) { try { cancelAnimationFrame(map.__rvAnimId); } catch (_) {} }
            const start = performance.now();
            const fromStart = Number(fromLayer.getOpacity() ?? 0.7);
            const toStart = Number(toLayer.getOpacity() ?? 0);
            const toEnd = targetOpacity;
            const fromEnd = 0;

            function easeInOut(t){ return t<0.5 ? 2*t*t : -1+(4-2*t)*t; }

            function step(ts) {
                const elapsed = ts - start;
                const t = Math.max(0, Math.min(1, elapsed / durationMs));
                const e = easeInOut(t);
                const fromVal = fromStart + (fromEnd - fromStart) * e;
                const toVal = toStart + (toEnd - toStart) * e;
                try {
                    fromLayer.setOpacity(fromVal);
                    toLayer.setOpacity(toVal);
                } catch (_) { /* no-op */ }
                if (t < 1) {
                    map.__rvAnimId = requestAnimationFrame(step);
                } else {
                    try {
                        fromLayer.setOpacity(fromEnd);
                        toLayer.setOpacity(toEnd);
                    } catch (_) {}
                    onDone?.();
                }
            }
            map.__rvAnimId = requestAnimationFrame(step);
        } catch (_) {
            // If anything goes wrong, jump to end state
            try { fromLayer?.setOpacity(0); toLayer?.setOpacity(targetOpacity); } catch (_) {}
            onDone?.();
        }
    }

    // Public API
    return {
        initializeWeatherMap: initializeWeatherMap,
        registerServiceWorker: registerServiceWorker,
    createFallbackIcon: createFallbackIcon,
    // RainViewer timeline APIs
    getRainviewerTimeline: getRainviewerTimeline,
    setRainviewerFrameByIndex: setRainviewerFrameByIndex,
    playRainviewer: playRainviewer,
    pauseRainviewer: pauseRainviewer,
        enableRainviewerTimeline: enableRainviewerTimeline,
        // Generic overlay tile logging (for future overlays)
        attachOverlayTileLogging: (layer, label) => {
            try {
                const src = layer?.getSource?.();
                if (!src) return;
                if (!window.__overlayCounters) window.__overlayCounters = {};
                if (!window.__overlayCounters[label]) window.__overlayCounters[label] = { start: 0, ok: 0, err: 0 };
                const counters = window.__overlayCounters[label];
                if (!src.__radarListenersBound) {
                    src.__radarListenersBound = true;
                    src.on("tileloadstart", () => { counters.start++; console.log(`${label} START`); });
                    src.on("tileloadend", () => { counters.ok++; console.log(`${label} OK`); });
                    src.on("tileloaderror", (e) => { counters.err++; console.warn(`${label} ERROR`, e); });
                }
            } catch (e) { console.warn("Failed to attach overlay logging", e); }
        }
    };
})();

// Also make functions available globally for backward compatibility
window.initializeWeatherMap = window.WeatherRadarInit.initializeWeatherMap;
window.registerServiceWorker = window.WeatherRadarInit.registerServiceWorker;
// Back-compat alias for older tests and integrations
window.WeatherMap = window.WeatherRadarInit;
