# CSCI 3308 Message Board Project

### Welcome to Team 3's Message Board application: a fully Dockerized, Node.js + Express + PostgreSQL + Handlebars forum that lets users register, log in, create boards, start discussion posts, and leave comments


## Features

User Authentication: Register & log in with hashed passwords (bcrypt) and session management (express-session)

Boards & Posts: Create categorized boards, start new discussion posts, and comment on posts

Dockerized: Runs in Docker containers for the app, database (Postgres), and optional Redis (for session store or caching)

Integration Tests: End-to-end smoke tests using Mocha, Chai & Supertest


## Technology Stack

Node.js & Express for the server.

PostgreSQL as the relational database.

Handlebars for server-rendered views.

Docker Compose to orchestrate services.

pg.Pool for database connection pooling.

bcrypt for password hashing.

Mocha, Chai, Supertest for integration testing.


### Prerequisites

Docker

Docker Compose

(Optional) Node.js & npm if running locally without Docker

### Clone the repository
```
git clone git@github.com:yourUsername/CSCI3308-Team-3-Project.git
```
```
cd CSCI3308-Team-3-Project/ProjectSourceCode
```
Create your .env file

### Copy the example and fill in your secrets:
```
cp .env.example .env
```
### Edit .env to add your values:
```
 POSTGRES_USER=message_user
 POSTGRES_PASSWORD=supersecretpassword
 POSTGRES_DB=messageboard
 POSTGRES_HOST=db
 SESSION_SECRET=yourSessionSecret
```
### Run with Docker Compose

Bring up the app & database in detached mode:
```
docker-compose up -d --build
```

The Postgres container will initialize the schema and seed data from
src/init_data/*.sql
The web container builds and starts the Express server on port 3000.

### Access the app

Open your browser to:

http://localhost:3000


### Run Integration Tests

Execute the Mocha suite inside the web container:
docker-compose exec web npm test

## Directory Structure

```
ProjectSourceCode/
├─ .env.example       # Example env variables
├─ docker-compose.yml
├─ DockerFile         # Builds the web image
├─ init_data/         # SQL schema & seed scripts
│    ├─ create.sql
│    └─ insert.sql
├─ src/
│   ├─ index.js       # App entry point, HTTP handlers, Business logic, Express routers (auth, boards, posts, comments)
│   ├─ db.js          # Postgres connection pool
│   //├─ routes/        # Express routers (auth, boards, posts, comments)
│   //├─ controllers/   # HTTP handlers
│   //├─ services/      # Business logic
│   ├─ models/        # Raw SQL queries
│   └─ views/         # Handlebars templates & public assets
└─ test/
    └─ integration/   # End-to-end tests (Mocha/Chai/Supertest)
```

contributors:

Made by Team 3 for CSCI 3308
