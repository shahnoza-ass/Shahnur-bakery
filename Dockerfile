FROM node:22-bookworm-slim AS frontend
WORKDIR /app/shahnur-bakery-frontend
COPY shahnur-bakery-frontend/package*.json ./
RUN npm ci --include=dev
COPY shahnur-bakery-frontend/ ./
ENV VITE_API_URL=/api
ENV VITE_SOCKET_URL=""
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/shahnur-bakery-backend
COPY shahnur-bakery-backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node shahnur-bakery-backend/ ./
COPY --from=frontend --chown=node:node /app/shahnur-bakery-frontend/dist /app/shahnur-bakery-frontend/dist
USER node
EXPOSE 5000
CMD ["node", "server.js"]
