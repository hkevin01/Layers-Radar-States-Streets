#!/bin/bash

# Project Progress Tracker GUI Launcher
# This script opens the interactive GUI application for project progress tracking

echo "🚀 Starting Project Progress Tracker GUI..."
echo "📊 Loading interactive dashboard with React components..."

# Check if we're in the right directory
if [ ! -f "public/project-tracker.html" ]; then
    echo "❌ Error: project-tracker.html not found in public/ directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Get the absolute path to the HTML file
HTML_FILE="$(pwd)/public/project-tracker.html"

echo "📁 File location: $HTML_FILE"

# Function to open in browser based on OS
open_browser() {
    if command -v xdg-open > /dev/null; then
        # Linux
        echo "🐧 Opening in default browser (Linux)..."
        xdg-open "file://$HTML_FILE"
    elif command -v open > /dev/null; then
        # macOS
        echo "🍎 Opening in default browser (macOS)..."
        open "file://$HTML_FILE"
    elif command -v cmd.exe > /dev/null; then
        # Windows (WSL)
        echo "🪟 Opening in default browser (Windows)..."
        cmd.exe /c start "file://$HTML_FILE"
    else
        echo "🌐 Please open the following URL in your browser:"
        echo "file://$HTML_FILE"
    fi
}

# Start a simple HTTP server if available (recommended for full functionality)
if command -v python3 > /dev/null; then
    echo "🐍 Starting local HTTP server with Python..."
    echo "📡 Searching for available port starting from 8080..."
    echo ""
    echo "✋ Press Ctrl+C to stop the server"
    echo ""
    
    # Create and run a custom Python HTTP server with port availability check
    python3 -c '
import http.server
import socketserver
import os
import socket
import sys

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

    def guess_type(self, path):
        """Guess the type of a file based on its path."""
        base, ext = os.path.splitext(path)
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        return "application/octet-stream"

    extensions_map = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        "": "application/octet-stream",
    }

# Find an available port
port = find_free_port()
if port is None:
    print("❌ No available ports found between 8080-8100")
    sys.exit(1)

print("🌐 Starting enhanced HTTP server...")
print(f"✨ Serving with CORS and proper MIME types enabled on port {port}")
print(f"🌍 Open http://localhost:{port}/public/project-tracker.html in your browser")
print(f"🌦️ Or try http://localhost:{port}/public/weather-radar-fixed.html for FIXED radar view")
print(f"🗺️ Or try http://localhost:{port}/public/simple-radar-test.html for simple test")
print(f"📡 Original: http://localhost:{port}/public/weather-radar.html")
print("📂 Serving from:", os.getcwd())

try:
    with socketserver.TCPServer(("", port), CORSRequestHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n👋 Server stopped by user")
except Exception as e:
    print(f"❌ Server error: {e}")
'

elif command -v python > /dev/null; then
    echo "🐍 Starting local HTTP server with Python 2..."
    echo "📡 Server will be available at: http://localhost:8080"
    echo "🚪 Open http://localhost:8080/project-tracker.html in your browser"
    echo ""
    echo "✋ Press Ctrl+C to stop the server"
    echo ""
    
    # Run a basic Python 2 server (fallback with limited functionality)
    python -m SimpleHTTPServer 8080
elif command -v node > /dev/null; then
    echo "🟢 Starting local HTTP server with Node.js..."
    echo "📡 Server will be available at: http://localhost:8080"
    echo "🚪 Open http://localhost:8080/project-tracker.html in your browser"
    echo ""
    echo "✋ Press Ctrl+C to stop the server"
    echo ""
    
    # Simple Node.js HTTP server
    node -e "
        const http = require('http');
        const fs = require('fs');
        const path = require('path');
        const url = require('url');
        
        // Get the project root directory (parent of scripts directory)
        const projectRoot = path.resolve(process.cwd());
        
        const server = http.createServer((req, res) => {
            // Clean and secure the path
            const cleanPath = path.normalize(url.parse(req.url).pathname).replace(/^(\.\.[\/\\])+/, '');
            let filePath = path.join(projectRoot, cleanPath);
            if (filePath.endsWith('/')) filePath += 'index.html';
            
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('File not found');
                    return;
                }
                
                const ext = path.extname(filePath);
                const contentType = {
                    '.html': 'text/html',
                    '.css': 'text/css', 
                    '.js': 'application/javascript',
                    '.json': 'application/json'
                }[ext] || 'text/plain';
                
                res.writeHead(200, {'Content-Type': contentType});
                res.end(data);
            });
        });
        
        server.listen(8080, () => {
            console.log('Server running at http://localhost:8080/');
        });
    "
else
    echo "⚠️  No HTTP server available. Opening file directly..."
    echo "💡 For best experience, install Python or Node.js"
    open_browser
fi
