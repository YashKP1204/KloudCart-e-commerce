FROM node:22-alpine

WORKDIR /app

# Install backend dependencies, including the local shared package.
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json
COPY shared/src ./shared/src
RUN cd /app/backend && npm install

# Copy application source after dependency installation for better layer caching.
COPY backend ./backend

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start", "--prefix", "/app/backend"]
