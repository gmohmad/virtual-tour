FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_APP_API_URL
ARG VITE_LIVETOUR_API_URL
ARG VITE_STUN_SERVER
ENV VITE_APP_API_URL=$VITE_APP_API_URL
ENV VITE_LIVETOUR_API_URL=$VITE_LIVETOUR_API_URL
ENV VITE_STUN_SERVER=$VITE_STUN_SERVER

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
