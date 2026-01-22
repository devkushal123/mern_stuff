
# 1️⃣ Base image (Node runtime)
FROM node:18-alpine

# 2️⃣ Create app directory inside container
WORKDIR /app

# 3️⃣ Copy dependency files first (layer caching)
COPY package*.json ./

# 4️⃣ Install dependencies
RUN npm install

# 5️⃣ Copy application code
COPY . .

# 6️⃣ Expose application port
EXPOSE 3000

# 7️⃣ Start the app
CMD ["node", "server.js"]



