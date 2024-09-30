FROM node:18-alpine as base
WORKDIR /app

FROM base AS deps
COPY ./package*.json .
RUN npm ci

FROM deps AS runner
COPY . .
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD [ "npm", "start"]
