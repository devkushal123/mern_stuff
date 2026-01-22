<!-- 🐳 DOCKERFILE — DEEP LINE‑BY‑LINE EXPLANATION -->
1. First: What a Dockerfile REALLY is
- Dockerfile = Blueprint (recipe) to build an IMAGE
- It is not executed every time
- It runs only during image build
- Output = immutable image

Think:
    Dockerfile → Image → Container

# <!-- ✅ A CLEAN BASIC DOCKERFILE (Node example)- -->
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    EXPOSE 3000
    CMD ["node", "server.js"]

    - Now let’s break it down properly.

## 1️⃣ FROM
    FROM node:18-alpine
    <!-- What it REALLY means -->
    - This is the base image
    - The "node:18-alpine" tag indicates that the image is built on the Alpine Linux version 18, which is a specific version of the Alpine Linux OS.
    - Includes:
        OS layer (Alpine Linux)
        Node.js runtime

    - Why alpine?
        Very small (~5–7 MB)
        Faster download
        Less attack surface

    <!-- Common mistake ❌ -->
        FROM node
    ⬇️ This pulls a huge image (hundreds of MB)

    Interview point ✅
        Smaller base images = faster builds + better security

## 2️⃣ WORKDIR
    WORKDIR /app

    - What it does
        Sets working directory inside the container
        All future commands run inside /app
        Equivalent to:            
                mkdir /app
                cd /app
    
    - Why this matters
        ✅ Clean structure
        ✅ Avoids absolute paths
        ✅ Recommended best practice
    - Common mistake ❌
        Not using WORKDIR and writing paths everywhere.

## 3️⃣ COPY package*.json ./
    COPY package*.json ./

    - Why copied BEFORE source code?
        Because of Docker layer caching.
        Docker builds images in layers:
            Layer 1 → FROM
            Layer 2 → WORKDIR
            Layer 3 → COPY package.json
            Layer 4 → npm install
            Layer 5 → COPY source code

    - If code changes but package.json doesn’t:
        ✅ npm install is NOT re‑run
        ✅ Huge speed improvement

    - Common beginner mistake ❌        
        COPY . .
        RUN npm install
    ⬆️ This causes npm install to run every time

## 4️⃣ RUN
    RUN npm install

    - What RUN does
        Executes command during image build
        Result is saved in the image

    - Key understanding
        RUN happens once, during build
        CMD happens every time, during run

    Multiple RUNs?
        ❌ Avoid this:        
            RUN apt update
            RUN apt install vim
        ✅ Prefer this:
            RUN apt update && apt install -y vim
        (less layers, smaller image)

## 5️⃣ COPY . .
    - Meaning
        Copies entire project
        From host → container /app

    - ⚠️ Copies:
        node_modules (if not ignored)
        secrets
        .env

    - ✅ MUST HAVE: .dockerignore           
        node_modules
        .env
        .git
    
    - Interview 💬
        .dockerignore is as important as .gitignore

## 6️⃣ EXPOSE
    EXPOSE 3000

    - BIG misconception ❌
        EXPOSE opens the port
        🚫 NO.
    - Truth ✅
        It is documentation
        It tells Docker which port the app uses
    - Actual port opening happens here:
        docker run -p 3000:3000
    - or in Compose:        
                ports:
                - "3000:3000"
                ``
    - Interview ✅
            EXPOSE does not publish ports

## 7️⃣ CMD
    CMD ["node", "server.js"]

    - Purpose-
        Defines default command
        Runs when container starts

- Difference: CMD vs RUN

    RUN             CMD
    Build time      Runtime
    Image creation  Container execution
    One-time        Every start

## - CMD vs ENTRYPOINT (Very IMPORTANT)
- CMD (overrideable)
    CMD ["node", "server.js"]
    docker run image bash
    ➡️ CMD ignored
- ENTRYPOINT (NOT easily overrideable)
    ENTRYPOINT ["node", "server.js"]
    ✅ Used when container behaves like a binary
    ✅ Common in CLI tools

## ❗ Dockerfile ORDER MATTERS
    - This is optimal ✅
     
    FROM
    WORKDIR
    COPY package.json
    RUN npm install
    COPY .
    CMD

    This is bad ❌    
        COPY .
        RUN npm install

## 🧠 Dockerfile Mental Model (Save This)

    Each instruction = immutable layer
    If a layer changes → everything below rebuilds
    Smaller layers = better performance
    Deterministic builds = production stability

✅ COMMON INTERVIEW QUESTIONS (Dockerfile)
Q: Why copy package.json first?
A: To leverage Docker cache and avoid re‑installing dependencies
Q: Difference between RUN and CMD?
A: RUN builds the image, CMD runs the container
Q: Why use alpine?
A: Smaller size, faster, more secure