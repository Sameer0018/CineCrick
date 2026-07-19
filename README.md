# CineBoll (CineCrick)

![CineBoll Demo](https://via.placeholder.com/1200x600.png?text=Demo+Screenshot%2FGIF+Placeholder)

CineBoll (also known as CineCrick) is a crossover platform bridging Indian cricket and Bollywood movies. It features real-time chat, quizzes, trivia, and an admin dashboard.

## 🚀 Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- **Backend:** .NET 10 Web API, C#
- **Real-Time Data:** SignalR (WebSockets)
- **Database:** PostgreSQL via Entity Framework Core
- **Authentication:** JWT (JSON Web Tokens) with BCrypt for password hashing

## ⚡ Quick Start (Under 10 Minutes)

Get the project running locally in 5 simple steps.

**Prerequisites:** 
- [Node.js (v20+)](https://nodejs.org/)
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [PostgreSQL](https://www.postgresql.org/) running locally.

### Step 1: Database Setup
Ensure your local PostgreSQL is running on port `5432` with the username `postgres` and password `Sameer123`.
Create an empty database named `cinecrick`. *(If your credentials differ, update the connection string in `Server/appsettings.json`)*. 

*Note: The backend automatically runs `DbSeeder.Seed(context)` on startup, so it will automatically generate your tables and seed default data. You can also manually restore from the `cinecrick_dump.backup` file provided in the root directory.*

### Step 2: Start the Backend
Open your terminal and run:
```bash
cd Server
dotnet run
```
*The API will start. You can view the full Swagger documentation at `http://localhost:5000/swagger`.*

### Step 3: Install Frontend Dependencies
Open a second terminal window and run:
```bash
cd client
npm install
```

### Step 4: Start the Frontend
```bash
npm run dev
```

### Step 5: Access the Application
Open your browser and navigate to **`http://localhost:3000`**.

> **Admin Access:** The database seeder automatically creates/promotes the user `sameer@clay.co.in` to an Admin role upon backend startup.

---

## 📡 Main APIs & Services

The backend exposes RESTful APIs and a WebSocket hub for real-time interactions. All routes require the `Bearer {JWT_TOKEN}` authorization header unless public.

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate and receive your JWT payload.

### Quizzes & Trivia (`/api/quiz`, `/api/trivia`)
- `GET /api/quiz/{topicId}` - Fetch randomized questions for a specific movie/cricket topic.
- `POST /api/quiz/submit` - Submit answers and calculate user scores.
- `GET /api/trivia` - Fetch daily trivia items.

### Content & Community (`/api/topics`, `/api/directory`, `/api/leaderboard`)
- `GET /api/topics` - Browse the available topics and crossover categories.
- `GET /api/directory` - Explore the entity directory (players, actors, movies).
- `GET /api/leaderboard` - Fetch the global high-score rankings.

### Real-Time Chat (`/ws/conversations` & `/api/conversations`)
- **SignalR Hub:** Connect to `/ws/conversations` for live bi-directional chat updates.
- `GET /api/conversations` - Fetch user chat history and active threads.
- `POST /api/conversations/send` - Push a new message to a conversation.

### Admin & Moderation (`/api/dashboard`, `/api/admin`, `/api/safety`)
- `GET /api/dashboard/stats` - Fetch platform-wide analytics for the admin dashboard.
- `GET /api/admin/users` - List and manage user permissions.
- `POST /api/safety/moderate` - Content safety and moderation hooks.
