FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/nexus-corp-web/package.json ./apps/nexus-corp-web/package.json
COPY apps/admin-panel-web/package.json ./apps/admin-panel-web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY . .

RUN npm ci

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["npm","run","dev:web"]