#!/bin/bash

# Weather Radar Application Launcher
# This script starts the local development server for the weather radar application

echo "🚀 Starting Weather Radar Application..."
echo "🌦️ Loading interactive weather visualization..."

# Check if we're in the right directory
if [ ! -f "$(dirname "$0")/server.py" ]; then
    echo "❌ Error: server.py not found in scripts directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Get the absolute path to the application directory
APP_DIR="$(pwd)"

echo "📁 Application directory: $APP_DIR"

# Make scripts executable
chmod +x "$(dirname "$0")/server.py"
chmod +x "$(dirname "$0")/start-gui.sh"

# Function to open in browser based on OS
open_browser() {
    local URL="http://localhost:8080/public/weather-radar-debug.html"
    if command -v xdg-open > /dev/null; then
        # Linux
        echo "🐧 Opening enhanced debug version in browser..."
        xdg-open "$URL"
    elif command -v open > /dev/null; then
        # macOS
        echo "🍎 Opening enhanced debug version in browser..."
        open "$URL"
    elif command -v cmd.exe > /dev/null; then
        # Windows (WSL)
        echo "🪟 Opening enhanced debug version in browser..."
        cmd.exe /c start "$URL"
    else
        echo "🌐 Please open the following URL in your browser:"
        echo "$URL"
        echo "🐛 This enhanced version includes comprehensive debugging and error handling"
    fi
}

# Start the enhanced HTTP server if available
if command -v python3 > /dev/null; then
    echo "🐍 Starting enhanced HTTP server..."
    cd "$APP_DIR" && python3 "$(dirname "$0")/server.py" &
    sleep 2
    open_browser
elif command -v python > /dev/null; then
    echo "🐍 Starting local HTTP server with Python 2..."
    echo "📡 Server will be available at: http://localhost:8080"
    echo "🚪 Open http://localhost:8080/public/weather-radar-debug.html in your browser"
    echo ""
    echo "✋ Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8080
    open_browser
elif command -v node > /dev/null; then
    echo "🟢 Starting local HTTP server with Node.js..."
    echo "📡 Server will be available at: http://localhost:8080"
    echo "🚪 Open http://localhost:8080/public/weather-radar-debug.html in your browser"
    echo ""
    echo "✋ Press Ctrl+C to stop the server"
    echo ""
    node -e '
        const http = require("http");
        const fs = require("fs");
        const path = require("path");
        const url = require("url");
        const projectRoot = process.cwd();
        const server = http.createServer((req, res) => {
            const cleanPath = path.normalize(url.parse(req.url).pathname).replace(/^(\.\.[\/\\])+/, "");
            let filePath = path.join(projectRoot, cleanPath);
            if (filePath.endsWith("/")) filePath += "index.html";
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end("File not found");
                    return;
                }
                const ext = path.extname(filePath);
                const contentType = {
                    ".html": "text/html",
                    ".css": "text/css",
                    ".js": "application/javascript",
                    ".json": "application/json"
                }[ext] || "text/plain";
                res.writeHead(200, {"Content-Type": contentType});
                res.end(data);
            });
        });
        server.listen(8080, () => {
            console.log("Server running at http://localhost:8080/");
        });
    '
    open_browser
else
    echo "⚠️  No HTTP server available. Opening file directly..."
    echo "💡 For best experience, install Python or Node.js"
    open_browser
fi
