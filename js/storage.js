const STORAGE_KEY = 'recall.questions';

function loadQuestions() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveQuestions(questions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

const ATTEMPTS_KEY = 'recall.attempts';

function loadAttempts() {
    const data = localStorage.getItem(ATTEMPTS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAttempts(attempts) {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}