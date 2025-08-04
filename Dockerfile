FROM node:16-alpine

# Install Python for the HTTP server
RUN apk add --no-cache python3

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

# Start the enhanced Python server
CMD ["python3", "scripts/server.py"]
