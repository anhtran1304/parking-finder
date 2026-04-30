# 🚗 Parking Finder

> A system design–focused project to explore real-time parking availability, geospatial queries, and distributed caching strategies.

---

## 📌 Problem

Finding available parking in urban areas is frustrating:

* Drivers waste time searching for empty spots
* Parking availability changes rapidly
* Existing solutions lack real-time accuracy

---

## 💡 Solution

**Parking Finder** helps users:

* Discover nearby parking spots using geospatial queries
* View available slots quickly via caching
* Reserve a parking slot with concurrency-safe booking

---

## 🧠 Key Engineering Goals

This project is built as a **system design showcase**, focusing on:

* Trade-offs between consistency and performance
* Handling concurrent booking (race conditions)
* Efficient geospatial querying
* Scalable architecture using Redis

---

## 🏗️ Architecture Overview

```text
[Frontend - Angular]
        ↓
[Backend - Spring Boot]
        ↓
 ┌───────────────┬───────────────┐
 │               │               │
[PostgreSQL + PostGIS]     [Redis]
   (source of truth)     (cache + atomic ops)
```

---

## ⚙️ Tech Stack

| Layer    | Technology           |
| -------- | -------------------- |
| Frontend | Angular              |
| Backend  | Spring Boot (Java)   |
| Database | PostgreSQL + PostGIS |
| Cache    | Redis                |
| Realtime | WebSocket (planned)  |
| DevOps   | Docker               |

---

## 📂 Project Structure

```text
parking-finder/
├── .ai/                # AI agent instructions (system design, rules)
├── infrastructure/    # Docker, scripts
├── backend/           # Spring Boot app
├── frontend/          # Angular app
├── docs/              # architecture & decisions
```

---

## 🚀 Getting Started

### 1. Clone repository

```bash
git clone <your-repo-url>
cd parking-finder
```

---

### 2. Setup environment variables

```bash
cp .env.example .env
```

Update `.env` values before running services.

---

### 3. Start infrastructure

```bash
cd infrastructure/docker
docker-compose up -d
```

---

### 4. Run backend

```bash
cd backend
mvn spring-boot:run
```

---

### 5. Run frontend

```bash
cd frontend
npm install
ng serve
```

---

## 🧪 Core Features

### 🔍 Nearby Parking Search

* Uses PostGIS for efficient geo queries
* Supports radius-based search

### ⚡ Fast Slot View

* Redis cache reduces latency
* Cache-aside strategy

### 🔒 Booking System

* Prevents overselling using atomic operations
* Handles race conditions

---

## ⚙️ Engineering Highlights

### 1. Cache Strategy (Redis)

* Cache-aside pattern
* TTL-based invalidation
* Trade-off: potential stale data

---

### 2. Concurrency Handling

Problem:

* Multiple users booking last slot

Solution:

* Redis atomic operations (`DECR`)
* DB validation fallback

---

### 3. Geospatial Query (PostGIS)

* `ST_DWithin` for nearby search
* GIST index for performance

---

## ⚖️ Trade-offs

| Decision       | Benefit          | Trade-off           |
| -------------- | ---------------- | ------------------- |
| Redis Cache    | Fast response    | Possible stale data |
| Atomic Counter | Prevent oversell | Needs sync with DB  |
| Monolith       | Simpler dev      | Limited scalability |

---

## 🧩 Future Improvements

* WebSocket for real-time updates
* Smart parking recommendation (AI)
* Payment integration

---

## 🧠 What I Learned

* Designing systems with real-world constraints
* Balancing performance vs consistency
* Handling distributed state (Redis vs DB)

---

## 📌 Note

This project is intentionally designed to **demonstrate system design thinking**, not just feature completeness.

## 🔐 Security Notes

- Do not commit `.env` to GitHub (already ignored by `.gitignore`).
- Use `.env.example` as the safe template for collaborators.
- Backend DB/Redis config is loaded from environment variables instead of hardcoded credentials.
