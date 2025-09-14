FROM node:18-alpine

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

# Expose default port used by the enhanced server (matches docker-compose)
EXPOSE 8089

# Default port for the Python server
ENV PORT=8089

# Serve the public directory on PORT (default 8089)
CMD ["sh", "-c", "python3 -m http.server ${PORT:-8089} --directory public"]
