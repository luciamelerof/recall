const STORAGE_KEY = 'recall.questions';

function loadQuestions() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveQuestions(questions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}