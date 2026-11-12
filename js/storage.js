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

// Examples
const SAMPLE_QUESTIONS = [
  { topic: 'Biology', text: 'What gas do plants absorb during photosynthesis?', answer: 'Carbon dioxide' },
  { topic: 'Biology', text: 'What part of the cell contains the genetic material?', answer: 'Nucleus' },
  { topic: 'Geography', text: 'What is the capital of Australia?', answer: 'Canberra' },
  { topic: 'Geography', text: 'What is the longest river in the United Kingdom?', answer: 'Severn' },
  { topic: 'Computing', text: 'What does HTML stand for?', answer: 'HyperText Markup Language' },
  { topic: 'Computing', text: 'Which data structure works as First In, First Out?', answer: 'Queue' }
];