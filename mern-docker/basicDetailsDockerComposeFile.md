<!-- 🐳 docker‑compose.yml — LINE BY LINE (DEEP EXPLANATION) -->

1. First, what docker‑compose REALLY is (important):
    - Docker Compose = a tool to run multiple Docker containers together as ONE application

    - Example real apps:
        Backend API
        Frontend
        Database
        Cache (Redis)
    - Compose manages networking, startup, env vars, volumes for you.

2. ✅ A BASIC COMPOSE FILE (We’ll explain every line)

    version: "3.9"
    services:
        app:
            build: .
            ports:
                - "3000:3000"
            environment:
                - NODE_ENV=production
            depends_on:
                - db

        db:
            image: mysql:8
            environment:
            MYSQL_ROOT_PASSWORD: root
            MYSQL_DATABASE: testdb
            volumes:
                - mysql_data:/var/lib/mysql

    volumes:
        mysql_data:

1️⃣ version
    version: "3.9"

    - What it means
        Defines Compose file format
        NOT Docker version

    - Should you worry?
        👉 No in practice

    Modern Docker ignores this internally
    Still kept for backward compatibility

    ✅ Safe to use: "3.8" or "3.9"

2️⃣ services (MOST IMPORTANT SECTION)
    services:
    
    - Meaning
        Every entry under services = one container
        Each service runs in:
            Its own container
            Same private Docker network
    - Think:    
        services:
            backend
            frontend
            database

3️⃣ app service       
        app:
        ``
    - app is the service name
    - This becomes:
            Container name prefix
            Network hostname
    - ⚠️ This name is VERY important.
    - Inside Docker network:    
        app → reachable via hostname "app"
    
4️⃣ build
    build: .

    - Meaning
        Build image using a Dockerfile
        . = current directory

    - Equivalent to:    
        docker build -t app .
    
    - Alternative
        build:
            context: .
            dockerfile: Dockerfile.dev
        ``
5️⃣ ports
    ports:
        - "3000:3000"
    
    - Format
        HOST_PORT : CONTAINER_PORT
    - Meaning
        App runs on port 3000 inside container
        Exposed on port 3000 of your machine
    - Browser flow:
        Browser → localhost:3000 → container:3000

    - Common mistake ❌
        Using ports for DB containers (not needed unless external access needed)


6️⃣ environment (SIMPLE BUT CRITICAL)
    environment:
        - NODE_ENV=production

    - Meaning
        Sets environment variables inside container

    - Inside container: 
        process.env.NODE_ENV

    - Alternative        
        environment:
            NODE_ENV: production
    - Best practice ✅
        Use .env file for secrets:

7️⃣ depends_on
        
    depends_on:
    - db

    - Means
        Start db container before app container

    - ⚠️ VERY IMPORTANT LIMITATION:
        depends_on does NOT wait for DB to be ready

    - Only waits for container start, not readiness.
    ✅ Real production uses:
        healthcheck
        retries in app

8️⃣ db service
    db:
    - This is your database container.
9️⃣ image
    image: mysql:8

    - Meaning-
        Pull image from Docker Hub
        No Dockerfile needed
    - equals to     
        docker run mysql:8
        ``
🔟 environment in database
    
    environment:
        MYSQL_ROOT_PASSWORD: root
        MYSQL_DATABASE: testdb

    - Purpose
        Configure DB at startup
        Each DB image has its own required env vars

    - 🔹 Example:
        MySQL
        PostgreSQL
        MongoDB
        (all use env variables)
    - 🚫 NEVER hardcode secrets in production

1️⃣1️⃣ volumes (EXTREMELY IMPORTANT)

    volumes:
        - mysql_data:/var/lib/mysql
    
    - mysql_data (Docker volume) → /var/lib/mysql (DB storage)
    Why it matters
    Without volume:
        container delete = data gone ❌

    With volume:
        container delete = data safe ✅


    Containers are disposable, data is not

1️⃣2️⃣ Top‑level volumes
    volumes:
    mysql_data:

What this does
    Creates a named volume
    Managed by Docker
    Persistent storag