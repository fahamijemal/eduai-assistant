# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --production

COPY backend/ ./backend/

# Copy built frontend to serve statically
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create upload directory
RUN mkdir -p ./uploads

EXPOSE 5000
ENV NODE_ENV=production

CMD ["node", "backend/src/server.js"]
