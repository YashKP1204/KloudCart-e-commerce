FROM node:22-alpine

WORKDIR /app

# Install worker dependencies, including the local shared package.
COPY worker/package.json ./worker/package.json
COPY shared/package.json ./shared/package.json
COPY shared/src ./shared/src
RUN cd /app/worker && npm install

COPY worker ./worker

ENV NODE_ENV=production

CMD ["npm", "start", "--prefix", "/app/worker"]
