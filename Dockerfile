# Multi-stage Production Dockerfile for Patimati Frontend

# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package management files from client directory
COPY client/package*.json ./client/

# Install frontend dependencies
WORKDIR /app/client
RUN npm ci

# Copy repository source code
WORKDIR /app
COPY . .

# Run frontend build (node scripts/generate-firebase-sw.mjs && tsc -b && vite build)
WORKDIR /app/client
RUN npm run build

# Stage 2: Production Nginx stage
FROM nginx:alpine

# Copy custom Nginx configuration to override default config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets to Nginx web root
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
