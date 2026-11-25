# Run SmartClientManagement on your PC

Three repositories side by side, plus a local PostgreSQL:

```text
smartClientManagement/
├── smartClientManagement-FrontEnd     this repository (redesign: redesign-app/, Angular 22)
├── smartClientManagement-BackEnd      API v2 in backend-v2/ (Spring Boot 4, Java 21, Flyway)
└── smartClientManagement-AI-Service   CRM assistant (Spring AI + Gemini)
```

```text
Front  http://localhost:4200 ──► API v2      http://localhost:8090 ──► PostgreSQL localhost:5432 / smartclient
                             └─► AI service  http://localhost:8091 ──► API v2 (user's JWT) and Gemini
```

On `localhost`, the redesign calls the local services (`redesign-app/src/app/core/config.ts`); on GitHub Pages it calls Render.

## Needs

- Java 21, Node 22, Git, PostgreSQL (any recent version) running on port 5432.
- Optional: `GEMINI_API_KEY` in your Windows environment (free key from https://aistudio.google.com). Without it, everything works except the assistant.

## 1. Clone

```powershell
mkdir smartClientManagement; cd smartClientManagement
gh repo clone DevOpsAchrafOu/smartClientManagement-FrontEnd
gh repo clone DevOpsAchrafOu/smartClientManagement-BackEnd
gh repo clone DevOpsAchrafOu/smartClientManagement-AI-Service
```

## 2. Local database (once)

```sql
-- as the postgres user (psql -U postgres)
CREATE ROLE smartclient LOGIN PASSWORD 'smartclient';
CREATE DATABASE smartclient OWNER smartclient ENCODING 'UTF8';
```

These values are for a local database only. API v2 creates the tables (Flyway migrations V1 to V5) and the demo data on its first start.

## 3. Start

```powershell
# API v2
cd smartClientManagement-BackEnd\backend-v2
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8090 --spring.datasource.url=jdbc:postgresql://localhost:5432/smartclient --spring.datasource.username=smartclient --spring.datasource.password=smartclient --app.jwt.secret=local-dev-secret-only-for-this-pc-0123456789"

# AI service (another window)
cd smartClientManagement-AI-Service
$env:BACKEND_URL = 'http://localhost:8090'; .\mvnw.cmd spring-boot:run

# Front (another window)
cd smartClientManagement-FrontEnd\redesign-app
npm install; npx ng serve --port 4200 --open
```

Then sign in at http://localhost:4200/ with a demo account (`a.admin`, or a CRM role: `y.benali` manager, `s.mansouri` sales, `l.bouzid` read-only; password `123456789`).

## Useful addresses

| What | Address |
|---|---|
| Front (redesign) | http://localhost:4200/ |
| API v2, Swagger | http://localhost:8090/swagger-ui.html |
| API v2 health | http://localhost:8090/actuator/health |
| AI service health | http://localhost:8091/actuator/health |
