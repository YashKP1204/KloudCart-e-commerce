FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package.json ./
RUN npm install

COPY frontend ./
RUN npm run build

FROM nginx:1.29-alpine

RUN sed -i 's|pid        /run/nginx.pid;|pid        /var/run/nginx/nginx.pid;|' /etc/nginx/nginx.conf

RUN addgroup -S cloudcart && adduser -S cloudcart -G cloudcart 

RUN mkdir -p /var/cache/nginx /var/run/nginx /var/log/nginx \
    && chown -R cloudcart:cloudcart /var/cache/nginx /var/run/nginx /var/log/nginx

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

USER cloudcart

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
