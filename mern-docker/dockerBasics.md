✅ BASIC DOCKERFILE (Single Container Example)
    Example: Simple Node.js app
    Assume this structure:        
            my-app/
            ├─ server.js
            ├─ package.json
            └─ Dockerfile

✅ Dockerfile Explained (Very Important)

Line            Meaning
FROM            Base image (OS + runtime)
WORKDIR         Working directory inside container
COPY            Copy files from host → container (Dependency and others)
RUN             Executes and run commands while building image
EXPOSE          Documents which port app uses
CMD             Default command when container starts

🔑 Key takeaway:
    Dockerfile = instructions to create an image

- You build it once, run it many times.

✅ BASIC DOCKER COMPOSE FILE
    - Now let’s run multiple containers together.
    Scenario:
        app → Node.js backend
        mysql → Database

    📄 docker-compose.yml

✅ Docker Compose Explained
🔹 services
    Each service is one container.
    🔹 app service        
        ➡️ Build image using Dockerfile in current directory
            app:
                build: .
        ➡️ Maps:
            Host 3000 port → Container 3000 port
            ports:
                - "3000:3000"
            
        ➡️ Start database before app
                depends_on:
                    - db
    
    🔹 db service
        ➡️ Uses official MySQL image from Docker Hub
            image: mysql:8
        
        ➡️ Configure container via env variables            
            environment:
        
        ➡️ Persist database data (very important!)
            volumes:
                - mysql_data:/var/lib/mysql

        ➡️ Named volume managed by Docker
        ➡️ Data survives container restart        
                volumes:
                    mysql_data:

✅ What Happens When You Run Compose?
    command -  
        docker compose up
        ``
    <!-- Docker will: -->
        Build app image
        Pull MySQL image
        Create network
        Start DB container
        Start app container
        Connect them automatically

🔄 How Containers Talk to Each Other
    Inside code, app connects to MySQL like:    
        host: db
        port: 3306
    ⚠️ Never use localhost between containers

✅ Key Rules (MUST REMEMBER)
    ✅ Dockerfile = Image
    ✅ Compose = Application
    ✅ One process per container
    ✅ Containers talk via service name
    ✅ Data must go into volumes

🧠 Mini Mental Model
    Dockerfile → Image
    docker run → Container

    docker-compose.yml → Multi-container app
    docker compose up → Whole system running

✅ When to Use What?
    Use case            Tool
    One app             Dockerfile
    App + DB            Docker Compose
    Production scale    Kubernetes



    