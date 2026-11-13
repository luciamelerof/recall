// Sample data
const SAMPLE_QUESTIONS = [
  { topic: 'Biology', text: 'What gas do plants absorb during photosynthesis?', answer: 'Carbon dioxide' },
  { topic: 'Biology', text: 'What part of the cell contains the genetic material?', answer: 'Nucleus' },
  { topic: 'Geography', text: 'What is the capital of Australia?', answer: 'Canberra' },
  { topic: 'Geography', text: 'What is the longest river in the United Kingdom?', answer: 'Severn' },
  { topic: 'Computing', text: 'What does HTML stand for?', answer: 'HyperText Markup Language' },
  { topic: 'Computing', text: 'Which data structure works as First In, First Out?', answer: 'Queue' }
];

// Local store: data in this browser (GitHub Pages)
const QUESTIONS_KEY = 'recall.questions';
const ATTEMPTS_KEY = 'recall.attempts';

function readLocal(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const localStore = {
  async getQuestions() {
    return readLocal(QUESTIONS_KEY);
  },

  async addQuestion(data) {
    const questions = readLocal(QUESTIONS_KEY);
    const question = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    questions.push(question);
    writeLocal(QUESTIONS_KEY, questions);
    return question;
  },

  async deleteQuestion(id) {
    writeLocal(QUESTIONS_KEY, readLocal(QUESTIONS_KEY).filter(q => q.id !== id));
  },

  async getAttempts() {
    return readLocal(ATTEMPTS_KEY);
  },

  async submitAttempt(answers) {
    const questions = readLocal(QUESTIONS_KEY);
    const attemptId = Date.now().toString();

    const results = answers.map((a, index) => {
      const q = questions.find(q => q.id === a.questionId);
      return {
        id: `${attemptId}-${index}`,
        questionId: q.id,
        question: q.text,
        topic: q.topic,
        expected: q.answer,
        given: a.given,
        auto: autoMark(a.given, q.answer),
        final: null
      };
    });

    const attempt = { id: attemptId, date: new Date().toISOString(), results };
    const attempts = readLocal(ATTEMPTS_KEY);
    attempts.push(attempt);
    writeLocal(ATTEMPTS_KEY, attempts);
    return attempt;
  },

  async confirmClear(attemptId) {
    const attempts = readLocal(ATTEMPTS_KEY);
    const attempt = attempts.find(a => a.id === attemptId);
    attempt.results.forEach(r => {
      if (r.final === null && r.auto !== 'close') r.final = r.auto;
    });
    writeLocal(ATTEMPTS_KEY, attempts);
    return attempt;
  },

  async setFinal(resultId, value) {
    const attempts = readLocal(ATTEMPTS_KEY);
    const result = attempts.flatMap(a => a.results).find(r => r.id === resultId);
    result.final = value;
    writeLocal(ATTEMPTS_KEY, attempts);
    return result;
  }
};

// API store: data in MySQL through the PHP API (Docker)
async function request(path, options = {}) {
  const response = await fetch(`/api/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.error || (body.errors || []).join(', ') || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

const apiStore = {
  getQuestions: () => request('questions.php'),

  addQuestion: data =>
    request('questions.php', { method: 'POST', body: JSON.stringify(data) }),

  deleteQuestion: id =>
    request(`questions.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getAttempts: () => request('attempts.php'),

  submitAttempt: answers =>
    request('attempts.php', { method: 'POST', body: JSON.stringify({ answers }) }),

  confirmClear: attemptId =>
    request(`attempts.php?id=${encodeURIComponent(attemptId)}`, { method: 'PATCH' }),

  setFinal: (resultId, value) =>
    request(`results.php?id=${encodeURIComponent(resultId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ final: value })
    })
};

// Docker serves the app on port 8080 with the PHP API.
// GitHub Pages only serves static files, so it falls back to localStorage.
const USE_API = location.port === '8080';
const store = USE_API ? apiStore : localStore;