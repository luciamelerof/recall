// Navigation
const navButtons = document.querySelectorAll('nav button');
const views = document.querySelectorAll('.view');

function showView(viewId) {
  views.forEach(view => view.classList.toggle('active', view.id === viewId));
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// State
let questions = [];
let attempts = [];
let currentQuiz = [];

// DOM
const questionForm = document.getElementById('question-form');
const questionList = document.getElementById('question-list');
const bankCount = document.getElementById('bank-count');
const quizTopic = document.getElementById('quiz-topic');
const quizSize = document.getElementById('quiz-size');
const generateBtn = document.getElementById('generate-quiz');
const quizForm = document.getElementById('quiz-form');
const quizMessage = document.getElementById('quiz-message');
const reviewList = document.getElementById('review-list');
const statsBox = document.getElementById('stats');
const errorBanner = document.getElementById('error-banner');

// Errors
// Runs an async task and shows a message if it fails
async function run(task) {
  errorBanner.hidden = true;
  try {
    await task();
  } catch (error) {
    errorBanner.textContent = `Something went wrong: ${error.message}`;
    errorBanner.hidden = false;
  }
}

function formatDate(date) {
  // MySQL returns "2026-11-13 10:00:00" in UTC
  const iso = date.includes(' ') ? `${date.replace(' ', 'T')}Z` : date;
  return new Date(iso).toLocaleString();
}

// Question bank
questionForm.addEventListener('submit', event => {
  event.preventDefault();

  run(async () => {
    const question = await store.addQuestion({
      topic: document.getElementById('q-topic').value.trim(),
      text: document.getElementById('q-text').value.trim(),
      answer: document.getElementById('q-answer').value.trim()
    });
    questions.push(question);
    questionForm.reset();
    renderBank();
  });
});

function deleteQuestion(id) {
  run(async () => {
    await store.deleteQuestion(id);
    questions = questions.filter(q => q.id !== id);
    renderBank();
  });
}

document.getElementById('load-samples').addEventListener('click', () => {
  run(async () => {
    const existing = new Set(questions.map(q => q.text));
    for (const sample of SAMPLE_QUESTIONS.filter(s => !existing.has(s.text))) {
      questions.push(await store.addQuestion(sample));
    }
    renderBank();
  });
});

function renderBank() {
  questionList.innerHTML = '';

  questions.forEach(q => {
    const li = document.createElement('li');
    li.className = 'card question-item';

    const info = document.createElement('div');

    const topic = document.createElement('span');
    topic.className = 'tag';
    topic.textContent = q.topic;

    const text = document.createElement('p');
    text.textContent = q.text;

    const answer = document.createElement('small');
    answer.textContent = `Answer: ${q.answer}`;

    info.append(topic, text, answer);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteQuestion(q.id));

    li.append(info, deleteBtn);
    questionList.append(li);
  });

  bankCount.textContent = `${questions.length} question(s) in the bank`;
  renderTopicOptions();
}

// Quiz
function renderTopicOptions() {
  const topics = [...new Set(questions.map(q => q.topic))];

  quizTopic.innerHTML = '';
  quizTopic.append(new Option('All topics (mixed)', 'all'));
  topics.forEach(topic => quizTopic.append(new Option(topic, topic)));
}

// Fisher-Yates shuffle: every order has the same probability
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

generateBtn.addEventListener('click', () => {
  const topic = quizTopic.value;
  const pool = topic === 'all'
    ? questions
    : questions.filter(q => q.topic === topic);

  if (pool.length === 0) {
    quizMessage.textContent = 'Add some questions to the bank first.';
    quizForm.innerHTML = '';
    return;
  }

  const size = Math.min(Number(quizSize.value) || 1, pool.length);
  currentQuiz = shuffle(pool).slice(0, size);
  quizMessage.textContent = `Quiz ready: ${size} question(s).`;
  renderQuiz();
});

function renderQuiz() {
  quizForm.innerHTML = '';

  currentQuiz.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'card quiz-question';

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = q.topic;

    const label = document.createElement('label');
    label.textContent = `${index + 1}. ${q.text}`;

    const input = document.createElement('input');
    input.name = q.id;
    input.placeholder = 'Your answer';
    input.autocomplete = 'off';

    label.append(input);
    card.append(tag, label);
    quizForm.append(card);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'primary';
  submitBtn.textContent = 'Mark my answers';
  quizForm.append(submitBtn);
}

quizForm.addEventListener('submit', event => {
  event.preventDefault();
  if (currentQuiz.length === 0) return;

  run(async () => {
    // Only the student's answers are sent; marking happens in the store
    const answers = currentQuiz.map(q => ({
      questionId: q.id,
      given: quizForm.querySelector(`input[name="${q.id}"]`).value
    }));

    const attempt = await store.submitAttempt(answers);
    attempts.push(attempt);
    currentQuiz = [];
    renderResults(attempt.results);
    renderReview();
  });
});

function renderResults(results) {
  const labels = {
    correct: '✓ Correct',
    close: '~ Almost: your teacher will check this',
    incorrect: '✗ Not quite'
  };

  const correctCount = results.filter(r => r.auto === 'correct').length;
  quizMessage.textContent =
    `Auto-marked: ${correctCount}/${results.length} correct. Your teacher will confirm the final marks.`;

  quizForm.innerHTML = '';

  results.forEach((r, index) => {
    const card = document.createElement('div');
    card.className = `card result result-${r.auto}`;

    const question = document.createElement('p');
    question.className = 'result-question';
    question.textContent = `${index + 1}. ${r.question}`;

    const given = document.createElement('p');
    given.textContent = `Your answer: ${r.given || '(blank)'}`;

    const expected = document.createElement('p');
    expected.textContent = `Expected: ${r.expected}`;

    const verdict = document.createElement('strong');
    verdict.textContent = labels[r.auto];

    card.append(question, given, expected, verdict);
    quizForm.append(card);
  });
}

// Teacher review
function setFinal(resultId, value) {
  run(async () => {
    await store.setFinal(resultId, value);
    attempts.flatMap(a => a.results).find(r => r.id === resultId).final = value;
    renderReview();
  });
}

// Confirms the clear cases; "close" answers always need a human decision
function acceptClearMarks(attemptId) {
  run(async () => {
    const updated = await store.confirmClear(attemptId);
    attempts = attempts.map(a => (a.id === updated.id ? updated : a));
    renderReview();
  });
}

function renderReview() {
  reviewList.innerHTML = '';

  const pending = attempts
    .filter(a => a.results.some(r => r.final === null))
    .reverse(); // newest first

  if (pending.length === 0) {
    reviewList.textContent = 'All caught up. New quizzes will appear here.';
  }

  pending.forEach(attempt => {
    const box = document.createElement('div');
    box.className = 'card attempt';

    const header = document.createElement('div');
    header.className = 'attempt-header';

    const title = document.createElement('strong');
    title.textContent = `Quiz · ${formatDate(attempt.date)}`;

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'primary';
    acceptBtn.textContent = 'Confirm clear marks';
    acceptBtn.addEventListener('click', () => acceptClearMarks(attempt.id));

    header.append(title, acceptBtn);
    box.append(header);

    attempt.results.forEach(r => {
      if (r.final !== null) return;

      const item = document.createElement('div');
      item.className = `review-item result result-${r.auto}`;

      const question = document.createElement('p');
      question.className = 'result-question';
      question.textContent = r.question;

      const answers = document.createElement('p');
      answers.textContent = `Answer: ${r.given || '(blank)'} · Expected: ${r.expected}`;

      const suggestion = document.createElement('small');
      suggestion.textContent = `Suggested: ${r.auto}`;

      const actions = document.createElement('div');
      actions.className = 'review-actions';

      const okBtn = document.createElement('button');
      okBtn.className = 'primary';
      okBtn.textContent = 'Mark correct';
      okBtn.addEventListener('click', () => setFinal(r.id, 'correct'));

      const noBtn = document.createElement('button');
      noBtn.className = 'danger';
      noBtn.textContent = 'Mark incorrect';
      noBtn.addEventListener('click', () => setFinal(r.id, 'incorrect'));

      actions.append(okBtn, noBtn);
      item.append(question, answers, suggestion, actions);
      box.append(item);
    });

    reviewList.append(box);
  });

  renderStats();
}

function renderStats() {
  statsBox.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = 'How the class is doing';
  statsBox.append(title);

  const marked = attempts
    .flatMap(a => a.results)
    .filter(r => r.final !== null);

  if (marked.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Confirm some marks below to see results by topic.';
    statsBox.append(empty);
    return;
  }

  const byTopic = {};
  marked.forEach(r => {
    byTopic[r.topic] ??= { correct: 0, total: 0 };
    byTopic[r.topic].total++;
    if (r.final === 'correct') byTopic[r.topic].correct++;
  });

  Object.entries(byTopic).forEach(([topic, s]) => {
    const pct = Math.round((s.correct / s.total) * 100);

    const row = document.createElement('div');
    row.className = 'stat-row';

    const label = document.createElement('span');
    label.textContent = `${topic}: ${pct}% (${s.correct}/${s.total})`;

    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${pct}%`;
    bar.append(fill);

    row.append(label, bar);
    statsBox.append(row);
  });
}

// Start
document.getElementById('storage-mode').textContent = USE_API
  ? 'Saved in the class database.'
  : 'Saved in this browser only.';

run(async () => {
  [questions, attempts] = await Promise.all([store.getQuestions(), store.getAttempts()]);
  renderBank();
  renderReview();
});