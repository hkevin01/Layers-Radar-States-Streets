FROM node:16-alpine

# Install Python for the HTTP server and wget for healthchecks
RUN apk add --no-cache python3 wget

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Expose default port
EXPOSE 8080

# Default port for the Python server
ENV PORT=8080

# Start the enhanced Python server
CMD ["python3", "scripts/server.py"]
