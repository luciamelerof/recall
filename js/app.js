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

// Question bank
let questions = loadQuestions();

const questionForm = document.getElementById('question-form');
const questionList = document.getElementById('question-list');
const bankCount = document.getElementById('bank-count');

questionForm.addEventListener('submit', event => {
    event.preventDefault();

    const question = {
        id: Date.now().toString(),
        topic: document.getElementById('q-topic').value.trim(),
        text: document.getElementById('q-text').value.trim(),
        answer: document.getElementById('q-answer').value.trim(),
        createdAt: new Date().toISOString()
    };

    questions.push(question);
    saveQuestions(questions);
    questionForm.reset();
    renderBank();
});

function deleteQuestion(id) {
    questions = questions.filter(q => q.id !== id);
    saveQuestions(questions);
    renderBank();
}

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

renderBank();

// QUIZ
const quizSize = document.getElementById('quiz-size');
const generateBtn = document.getElementById('generate-quiz');
const quizForm = document.getElementById('quiz-form');
const quizMessage = document.getElementById('quiz-message');

let currentQuiz = [];

function renderTopicOptions() {
    const select = document.getElementById('quiz-topic');
    const topics = [...new Set(questions.map(q => q.topic))];

    select.innerHTML = '';
    select.append(new Option('All topics (mixed)', 'all'));
    topics.forEach(topic => select.append(new Option(topic, topic)));
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
    const topic = document.getElementById('quiz-topic').value;
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
    submitBtn.textContent = 'Submit answers';
    quizForm.append(submitBtn);
}

// Auto-marking
function normalize(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s]/g, '')     // remove punctuation
        .replace(/\s+/g, ' ')
        .trim();
}

// Minimum number of edits to turn a into b
function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,       // delete
                dp[i][j - 1] + 1,       // insert
                dp[i - 1][j - 1] + cost // replace
            );
        }
    }
    return dp[a.length][b.length];
}

function autoMark(given, expected) {
    const a = normalize(given);
    const b = normalize(expected);

    if (a === '') return 'incorrect';
    if (a === b) return 'correct';

    const similarity = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
    return similarity >= 0.8 ? 'close' : 'incorrect';
}

// Submit quiz
let attempts = loadAttempts();

quizForm.addEventListener('submit', event => {
    event.preventDefault();
    if (currentQuiz.length === 0) return;

    const results = currentQuiz.map(q => {
        const given = quizForm.querySelector(`input[name="${q.id}"]`).value;
        return {
            questionId: q.id,
            question: q.text,
            topic: q.topic,
            expected: q.answer,
            given,
            auto: autoMark(given, q.answer),
            final: null // the teacher confirms it in step 5
        };
    });

    attempts.push({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        results
    });
    saveAttempts(attempts);

    currentQuiz = [];
    renderResults(results);
    renderReview();
});

function renderResults(results) {
    const labels = {
        correct: '✅ Correct',
        close: '🟡 Close: needs teacher review',
        incorrect: '❌ Incorrect'
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
const reviewList = document.getElementById('review-list');
const statsBox = document.getElementById('stats');

function setFinal(attemptId, index, value) {
    const attempt = attempts.find(a => a.id === attemptId);
    attempt.results[index].final = value;
    saveAttempts(attempts);
    renderReview();
}

// Confirms the clear cases; "close" answers always need a human decision
function acceptClearMarks(attemptId) {
    const attempt = attempts.find(a => a.id === attemptId);
    attempt.results.forEach(r => {
        if (r.final === null && r.auto !== 'close') r.final = r.auto;
    });
    saveAttempts(attempts);
    renderReview();
}

function renderReview() {
    reviewList.innerHTML = '';

    const pending = attempts
        .filter(a => a.results.some(r => r.final === null))
        .reverse(); // newest first

    if (pending.length === 0) {
        reviewList.textContent = 'Nothing to review 🎉';
    }

    pending.forEach(attempt => {
        const box = document.createElement('div');
        box.className = 'card attempt';

        const header = document.createElement('div');
        header.className = 'attempt-header';

        const title = document.createElement('strong');
        title.textContent = `Quiz · ${new Date(attempt.date).toLocaleString()}`;

        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'primary';
        acceptBtn.textContent = 'Accept clear auto-marks';
        acceptBtn.addEventListener('click', () => acceptClearMarks(attempt.id));

        header.append(title, acceptBtn);
        box.append(header);

        attempt.results.forEach((r, index) => {
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
            okBtn.textContent = '✅ Correct';
            okBtn.addEventListener('click', () => setFinal(attempt.id, index, 'correct'));

            const noBtn = document.createElement('button');
            noBtn.className = 'danger';
            noBtn.textContent = '❌ Incorrect';
            noBtn.addEventListener('click', () => setFinal(attempt.id, index, 'incorrect'));

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
    title.textContent = 'Results by topic (teacher-confirmed)';
    statsBox.append(title);

    const marked = attempts
        .flatMap(a => a.results)
        .filter(r => r.final !== null);

    if (marked.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No confirmed marks yet.';
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

renderReview();