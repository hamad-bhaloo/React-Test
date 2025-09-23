# Stage 1: build
FROM node:18-alpine AS build

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json bun.lockb ./

# Install dependencies
RUN npm ci 
# If using bun, maybe use bun install (but mixing bun + npm is unusual) — adjust if needed

# Copy rest of source
COPY . .

# Build the app
RUN npm run build

# Stage 2: serve
FROM nginx:stable-alpine AS production

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if you have one (optional)
# COPY ./nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
