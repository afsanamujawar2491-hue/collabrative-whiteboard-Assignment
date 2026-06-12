# Collaborative Whiteboard

Real-time collaborative whiteboard built with React, Spring Boot, Keycloak, and PostgreSQL.

## Prerequisites

- Docker & Docker Compose
- Java 17+
- Node.js 20+
- Maven 3.9+
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) (for invitations)

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL and Keycloak on `http://localhost:8080`.

### 2. Configure Gmail for invitations

```bash
cd Backend/whiteboard-app/src/main/resources
copy application-local.properties.example application-local.properties
```

Edit `application-local.properties`:

```properties
spring.mail.username=your.email@gmail.com
spring.mail.password=your-16-char-app-password
app.mail.from=your.email@gmail.com
```

**How to get a Gmail App Password:**
1. Enable 2-Step Verification on your Google Account
2. Go to Google Account → Security → App passwords
3. Create a password for "Mail" / "Other"
4. Paste the 16-character password into `application-local.properties`

### 3. Start backend

```bash
cd Backend/whiteboard-app
.\mvnw.cmd spring-boot:run
```

Backend runs on `http://localhost:8081`.

### 4. Start frontend

```bash
cd FrontEnd/whiteboard-app
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Authentication

- **Sign Up** — click "Sign Up" on the home page (Keycloak registration)
- **Login** — click "Login" for existing users
- Demo user (if Keycloak realm imported): `demo` / `demo123`

## Invitation flow

1. Open a whiteboard session → click **Invite**
2. Enter the recipient's Gmail address
3. They receive an email with a **Join Whiteboard Session** button
4. Clicking the link opens `/join?token=...` → login/signup → redirects to the session

## Features

- Keycloak authentication with signup & login
- Create/join whiteboard sessions
- Real-time drawing sync (Fabric.js + WebSocket)
- Live chat
- Email invitations via Gmail
- PNG/PDF/WebM export

## Architecture

| Service    | Port | Purpose              |
|------------|------|----------------------|
| Frontend   | 5173 | React SPA            |
| Backend    | 8081 | Spring Boot API + WS |
| Keycloak   | 8080 | Authentication       |
| PostgreSQL | 5432 | App database         |
