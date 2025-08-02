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
    echo "📡 Server will be available at: http://localhost:8080"
    echo "🚪 Open http://localhost:8080/project-tracker.html in your browser"
    echo ""
    echo "✋ Press Ctrl+C to stop the server"
    echo ""
    
    cd public
    python3 -m http.server 8080
elif command -v python > /dev/null; then
    echo "🐍 Starting local HTTP server with Python..."
    echo "📡 Server will be available at: http://localhost:8080"
    echo "🚪 Open http://localhost:8080/project-tracker.html in your browser"
    echo ""
    echo "✋ Press Ctrl+C to stop the server"
    echo ""
    
    cd public
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
        
        const server = http.createServer((req, res) => {
            let filePath = path.join(__dirname, 'public', url.parse(req.url).pathname);
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
