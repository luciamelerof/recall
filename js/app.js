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

quizForm.addEventListener('submit', event => {
  event.preventDefault();
  // Step 4: check answers
});