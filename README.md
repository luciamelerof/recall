# Recall - Retrieval practice quiz app

A small web app that helps teachers run **retrieval practice**: build a question bank, generate mixed quizzes and review the auto-marked answers before they count.

🔗 **Live demo:** https://luciamelerof.github.io/recall/
(Click **Load sample questions** to try it with example data.)

## Features

- **Question bank:** create and delete questions by topic, saved in the browser (localStorage).
- **Random quizzes:** choose a topic or mix all of them (interleaving), with a fair Fisher-Yates shuffle.
- **Auto-marking:** answers are normalised (case, accents, punctuation) and compared with the Levenshtein distance, so small typos are flagged as *close* instead of wrong.
- **Teacher review (human in the loop):** every auto-mark is a draft. The teacher confirms clear cases in one click and decides the *close* ones.
- **Statistics:** percentage of correct answers per topic, using only teacher-confirmed marks.

## Tech

HTML, CSS and vanilla JavaScript. No frameworks, no build step.

## Run locally

```bash
git clone https://github.com/luciamelerof/recall.git
cd recall
```
Then open `index.html` in your browser.

## What I learned

- Managing state and rendering the DOM without a framework.
- Preventing XSS by rendering user input with `textContent` instead of `innerHTML`.
- Implementing the Levenshtein distance with dynamic programming.
- Designing AI-style automation that supports teachers instead of replacing them.

## Next steps

- A REST API (PHP/Symfony) and a database instead of localStorage.
- Teacher and student accounts.
- Spaced repetition: show questions answered wrongly more often.
- Unit tests for the marking logic.

## Author

Lucía Melero Fernández - Web Application Development student (Granada, Spain)
