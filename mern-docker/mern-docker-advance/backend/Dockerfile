
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Create unprivileged user
RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp
USER nodeusr

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=2s --retries=5 CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
