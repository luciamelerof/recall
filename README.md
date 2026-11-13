# Recall - Retrieval practice quiz app

A web app that helps teachers run **retrieval practice**: build a question bank, generate mixed quizzes, auto-mark the answers and review them before they count.

🔗 **Live demo (browser-only version):** https://luciamelerof.github.io/recall/
Click **Add example questions** to try it with example data.

## Features

- **Question bank:** create and delete questions by topic.
- **Random quizzes:** pick a topic or mix all of them (interleaving), with a fair Fisher-Yates shuffle.
- **Auto-marking:** answers are normalised (case, accents, punctuation) and compared with the Levenshtein distance, so small typos are flagged as *close* instead of wrong.
- **Teacher review (human in the loop):** every auto-mark is a draft. The teacher confirms the clear cases in one click and decides the *close* ones.
- **Statistics:** percentage of correct answers per topic, using only teacher-confirmed marks.

## Architecture

```
Browser (HTML, CSS, vanilla JS)
   │  fetch + JSON
   ▼
PHP 8.3 REST API (Apache)  ──PDO──▶  MySQL 8.4
└──────────── Docker Compose ────────────┘
```

The frontend talks to a **storage interface** with two implementations:

| Store | Used when | Data lives in |
|---|---|---|
| `apiStore` | Running with Docker (`localhost:8080`) | MySQL, through the PHP API |
| `localStore` | GitHub Pages (static hosting) | The browser's localStorage |

The UI code is the same in both cases.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/questions.php` | List questions |
| POST | `/api/questions.php` | Create a question (`201`, or `422` with validation errors) |
| DELETE | `/api/questions.php?id={id}` | Delete a question (`204`, or `404`) |
| GET | `/api/attempts.php` | List attempts with their results |
| POST | `/api/attempts.php` | Submit answers; the **server** marks them (`201`) |
| PATCH | `/api/attempts.php?id={id}` | Confirm the clear auto-marks of an attempt |
| PATCH | `/api/results.php?id={id}` | Set the teacher's final mark (`correct` / `incorrect`) |
| GET | `/api/health.php` | Check that the API and the database are up |

## Design decisions

- **Server-side marking:** the client only sends the student's answers, never the expected answer or the mark.
- **Prepared statements** everywhere to prevent SQL injection; user content is rendered with `textContent` to prevent XSS.
- **Transactions:** an attempt and all its results are saved together or not at all.
- **History snapshots:** each result stores a copy of the question, so deleting a question does not break past attempts.
- **Secrets in `.env`:** not committed; `.env.example` documents the variables.

## Run with Docker

```bash
git clone https://github.com/luciamelerof/recall.git
cd recall
cp .env.example .env   # then set your own passwords
docker compose up -d --build
```

Open http://localhost:8080

## Tech

HTML, CSS, vanilla JavaScript · PHP 8.3 · MySQL 8.4 · Docker Compose

## What I learned

- Designing and documenting a small REST API with proper status codes.
- Keeping the frontend independent from where the data is stored.
- Implementing the Levenshtein distance with dynamic programming.
- Designing automation that supports teachers instead of replacing them.

## Next steps

- Migrate the API to **Symfony** (routing, validation, Doctrine ORM).
- Teacher and student accounts with authentication.
- Spaced repetition: show questions answered wrongly more often.
- Automated tests (PHPUnit for the marking logic and the API).

## Author

Lucía Melero Fernández - Web Application Development student (Granada, Spain)