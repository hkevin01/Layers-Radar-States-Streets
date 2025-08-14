#!/usr/bin/env python3
"""
Enhanced HTTP Server for Weather Radar Application
Provides CORS support, mock API endpoints, and proper MIME type handling
"""

import datetime
import http.server
import json
import os
import socket
import socketserver
import sys
import time


def find_free_port(start_port=8080, max_port=8100):
    """Find a free port starting from start_port"""
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("", port))
                return port
        except OSError:
            continue
    return None

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        super().end_headers()

    def do_GET(self):
        """Handle GET requests with API emulation and enhanced error handling."""
        try:
            # Handle preflight CORS
            if self.headers.get("Access-Control-Request-Method"):
                self.send_response(200)
                self.end_headers()
                return

            # API endpoint handling
            if self.path.startswith("/api/"):
                self.handle_api_request()
                return
            # PHP endpoint emulation
            elif self.path.startswith("/public/obsGetter.php"):
                self.handle_obs_getter()
                return
            # Service worker serving
            elif self.path == "/sw.js":
                self.serve_service_worker()
                return
            # Handle map tile requests specially
            elif self.is_map_tile_request():
                self.handle_tile_request()
                return

            # Default file serving with proper headers
            self.send_response(200)
            self.send_header("Cache-Control", "public, max-age=3600")
            super().do_GET()

        except Exception as e:
            self.send_error(500, str(e))
            print(f"❌ Request error: {e}")

    def is_map_tile_request(self):
        """Check if this is a map tile request."""
        return any(domain in self.path for domain in [
            "tile.openstreetmap.org",
            "server.arcgisonline.com",
            "mesonet.agron.iastate.edu",
            "tilecache.rainviewer.com"
        ])

    def handle_tile_request(self):
        """Handle map tile requests with proper caching."""
        self.send_response(200)
        self.send_header("Content-type", "image/png")
        self.send_header("Cache-Control", "public, max-age=86400")  # 24 hour cache
        self.end_headers()
        # In a real proxy we would fetch and serve the tile
        self.wfile.write(bytes("Tile would be served here", "utf-8"))

    def handle_api_request(self):
        """Handle API requests with enhanced mock data."""
        try:
            # Parse the API path
            path_parts = self.path.split("/")
            if len(path_parts) < 3:
                self.send_error(400, "Invalid API request")
                return

            # Set common headers
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            if self.path == "/api/radar/historical":
                # Generate realistic radar timestamps
                current_time = int(time.time())
                timestamps = [(current_time - (i * 300)) * 1000 for i in range(24)]

                mock_data = {
                    "status": "success",
                    "data": {
                        "timestamps": timestamps,
                        "available": True,
                        "metadata": {
                            "updateInterval": 300,
                            "format": "png",
                            "projection": "EPSG:3857",
                            "bounds": {
                                "north": 50.0,
                                "south": 24.0,
                                "east": -66.0,
                                "west": -125.0
                            }
                        }
                    }
                }
                self.wfile.write(json.dumps(mock_data).encode())

            elif self.path == "/api/radar/capabilities":
                capabilities = {
                    "status": "success",
                    "data": {
                        "layers": {
                            "base_reflectivity": {
                                "name": "Base Reflectivity",
                                "unit": "dBZ",
                                "range": [-30, 75],
                                "colormap": "NWS Reflectivity",
                                "available": True
                            },
                            "velocity": {
                                "name": "Base Velocity",
                                "unit": "kts",
                                "range": [-100, 100],
                                "colormap": "Velocity",
                                "available": True
                            }
                        },
                        "update_interval": 300,
                        "tile_format": "png",
                        "max_zoom": 16
                    }
                }
                self.wfile.write(json.dumps(capabilities).encode())
            else:
                self.send_error(404, "API endpoint not found")

        except Exception as e:
            self.send_error(500, f"API Error: {str(e)}")

    def handle_obs_getter(self):
        """Handle observation getter requests with mock data."""
        try:
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            current_hour = datetime.datetime.now().hour
            temp_base = 72 + (current_hour - 12) * 2

            mock_data = {
                "status": "success",
                "timestamp": int(time.time()),
                "data": {
                    "temperature": max(32, min(100, temp_base)),
                    "humidity": max(30, min(90, 65 + (current_hour - 12))),
                    "windSpeed": max(0, min(30, 5 + (current_hour % 5))),
                    "windDirection": (current_hour * 15) % 360,
                    "conditions": self.get_mock_conditions(current_hour),
                    "radar": {
                        "available": True,
                        "lastUpdate": int(time.time()),
                        "nextUpdate": int(time.time()) + 300
                    }
                }
            }

            self.wfile.write(json.dumps(mock_data).encode())

        except Exception as e:
            self.send_error(500, f"Failed to generate weather data: {str(e)}")

    def get_mock_conditions(self, hour):
        """Generate realistic weather conditions based on time."""
        conditions = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain"]
        return conditions[hour % len(conditions)]

    def serve_service_worker(self):
        """Serve the service worker with proper headers."""
        try:
            self.send_response(200)
            self.send_header("Content-type", "application/javascript")
            self.send_header("Service-Worker-Allowed", "/")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            sw_content = """
                // Weather Radar Service Worker v1.0
                const CACHE_NAME = 'weather-radar-v1';
                const CACHED_URLS = [
                    '/',
                    '/public/weather-radar.html',
                    '/public/css/styles.css',
                    'https://cdn.jsdelivr.net/npm/ol@8.2.0/ol.css',
                    'https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js'
                ];

                self.addEventListener('install', (event) => {
                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then(cache => cache.addAll(CACHED_URLS))
                    );
                });

                self.addEventListener('fetch', (event) => {
                    event.respondWith(
                        caches.match(event.request)
                            .then(response => response || fetch(event.request))
                    );
                });
            """
            self.wfile.write(sw_content.encode())

        except Exception as e:
            self.send_error(500, f"Failed to serve service worker: {str(e)}")

def main():
    """Main entry point for the server."""
    # Prefer environment variable PORT (Docker/Heroku style),
    # fallback to free port
    env_port = os.environ.get("PORT")
    if env_port:
        try:
            port = int(env_port)
        except ValueError:
            print(
                "⚠️ Invalid PORT env value '" + str(env_port) +
                "', falling back to scanner"
            )
            port = find_free_port()
    else:
        port = find_free_port()
    if port is None:
        print("❌ No available ports found between 8080-8100")
        sys.exit(1)

    print("🌐 Starting enhanced HTTP server...")
    print(
        "✨ Serving with CORS and proper MIME types enabled on port " +
        str(port)
    )
    print("📡 Server URLs:")
    print(
        "   🐛 Debug Version: http://localhost:" + str(port) +
        "/public/weather-radar-debug.html"
    )
    print(
        "   🌦️ Main App: http://localhost:" + str(port) +
        "/public/weather-radar.html"
    )
    print(
        "   📊 Fixed View: http://localhost:" + str(port) +
        "/public/weather-radar-fixed.html"
    )
    print(
        "   🧪 Simple Test: http://localhost:" + str(port) +
        "/public/simple-radar-test.html"
    )
    print("📂 Serving from: " + os.getcwd())
    print("\n✋ Press Ctrl+C to stop the server\n")

    try:
        with socketserver.TCPServer(("0.0.0.0", port), CORSRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print("❌ Server error: " + str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
