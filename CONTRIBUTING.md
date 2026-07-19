# Contributing to CineBoll (CineCrick)

First off, thank you for considering contributing to CineBoll! It's people like you that make CineBoll such a great platform for the community.

## 🛠️ Tech Stack Overview
Before you start, make sure you are comfortable with:
- **Frontend**: Next.js 16, React 19, TailwindCSS v4, TypeScript
- **Backend**: .NET 10 Web API, Entity Framework Core, PostgreSQL
- **Real-Time**: SignalR

## 🤝 How to Contribute

### 1. Find an Issue
Look for issues labeled `good first issue` or `help wanted` in the GitHub Issues tab. If you find a bug or have a feature request, please open a new issue to discuss it before submitting a Pull Request.

### 2. Fork and Clone
1. Fork the repository on GitHub.
2. Clone your fork locally: `git clone https://github.com/YOUR-USERNAME/CineBoll.git`
3. Set up the project locally by following the Quick Start guide in the [README.md](./README.md).

### 3. Branch Naming Convention
Create a new branch for your work. Please use the following naming conventions:
- `feature/your-feature-name` (for new features)
- `bugfix/issue-description` (for bug fixes)
- `docs/what-you-changed` (for documentation updates)

```bash
git checkout -b feature/add-new-quiz-type
```

### 4. Coding Style
- **Frontend**: We use ESLint and Prettier. Ensure your code passes linting (`npm run lint` in the `client` directory). Use semantic HTML and functional React components with hooks.
- **Backend**: Follow standard C# naming conventions (PascalCase for methods/classes, camelCase for local variables). Keep controllers thin and move business logic to Services.

### 5. Submitting a Pull Request (PR)
1. Push your branch to your fork: `git push origin feature/your-feature-name`
2. Open a Pull Request against the `main` branch of the original repository.
3. Provide a clear description of what your PR does and link it to the relevant issue (e.g., "Fixes #123").
4. Wait for a maintainer to review your code. We may request some changes before merging.

## 🧪 Testing (Coming Soon)
We are currently setting up our automated test suites. In the meantime, please verify your changes manually:
- Backend: Test new API endpoints via Swagger at `http://localhost:5000/swagger`.
- Frontend: Verify no console errors in the browser and responsive design holds on mobile viewports.

Thank you for your contributions!
