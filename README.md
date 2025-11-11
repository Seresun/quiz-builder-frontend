# quiz-builder-frontend

Quiz Builder UI built with Next.js (Pages Router), React, and TypeScript.

## Tech Stack

- Next.js 16 (Pages Router) + React 19
- TypeScript
- Tailwind CSS
- React Hook Form + Zod for forms and validation

## Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm (bundled with Node)
- Running backend API that exposes:
  - `POST /quizzes`
  - `GET /quizzes`
  - `GET /quizzes/:id`
  - `DELETE /quizzes/:id`

> The frontend expects the backend base URL in `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000`).

## Installation & Local Development

```bash
npm install
cp .env.local.example .env.local # or create manually
npm run dev
```

Then open http://localhost:3000 (Next.js will switch to another port if 3000 is busy).

### Environment Configuration

Create `.env.local` at the project root:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Adjust the value to point at your backend instance.

### Backend & Database

1. Clone the backend repository (e.g. `quiz-builder-backend`) and install dependencies.
2. Configure its `.env` with your database connection string (`DATABASE_URL=...`) and any other secrets.
3. Run database migrations/seed scripts (usually `npm run prisma:migrate`, `npm run knex:migrate`, or whatever the backend exposes).
4. Start the backend (e.g. `npm run start:dev`). Ensure it’s reachable at the URL from `NEXT_PUBLIC_API_URL`.

### Useful Scripts

- `npm run dev` – start the frontend in development mode.
- `npm run build` / `npm run start` – production build & serve.
- `npm run lint` – run ESLint.
- `npm run format` – format the codebase with Prettier.

## Creating a Sample Quiz

1. Start both backend and frontend.
2. Navigate to http://localhost:3000/create.
3. Fill in:
   - Quiz title.
   - Add one or more questions.
   - Choose a question type:
     - **Boolean** – mark the correct answer (True or False).
     - **Input** – provide the expected free-text answer.
     - **Checkbox** – add options and mark one or more as correct.
4. Submit – the quiz will be saved via `POST /quizzes` and you’ll be redirected to `/quizzes`.

You can also populate using the API directly:

```bash
curl -X POST "$NEXT_PUBLIC_API_URL/quizzes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sample Quiz",
    "questions": [
      { "text": "The sky is blue", "type": "boolean", "correctAnswer": true },
      { "text": "Capital of France", "type": "input", "correctAnswer": "Paris" },
      {
        "text": "Primary colors",
        "type": "checkbox",
        "options": ["Red", "Green", "Blue"],
        "correctAnswer": ["Red", "Blue"]
      }
    ]
  }'
```

## Project Structure

```
pages/
├── _app.tsx            # Tailwind + global styles
├── index.tsx           # Redirects to /quizzes
├── create.tsx          # Quiz creation form
└── quizzes/
    ├── index.tsx       # Quiz list with delete actions
    └── [id].tsx        # Quiz details (read-only)

services/api.ts         # API helpers (fetch, create, delete)
styles/globals.css      # Tailwind directives & base styles
```

## Formatting & Linting

The project ships with ESLint (via `next lint`) and Prettier. Ensure both pass before submitting changes:

```bash
npm run lint
npm run format
```
