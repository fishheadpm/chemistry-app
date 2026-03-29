'use strict';

const STORAGE_KEY = 'chemistry_app_mistakes';

const menuScreen = document.getElementById('menuScreen');
const quizScreen = document.getElementById('quizScreen');

const modeNameToFormulaButton = document.getElementById('modeNameToFormula');
const modeFormulaToNameButton = document.getElementById('modeFormulaToName');
const modeMistakeNameToFormulaButton = document.getElementById('modeMistakeNameToFormula');
const modeMistakeFormulaToNameButton = document.getElementById('modeMistakeFormulaToName');
const resetMistakesButton = document.getElementById('resetMistakes');

const mistakeQuestionCountElement = document.getElementById('mistakeQuestionCount');
const totalMistakeCountElement = document.getElementById('totalMistakeCount');

const modeLabel = document.getElementById('modeLabel');
const mistakeCountLabel = document.getElementById('mistakeCountLabel');
const questionTitle = document.getElementById('questionTitle');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const judgeButton = document.getElementById('judgeButton');
const nextButton = document.getElementById('nextButton');
const backToMenuButton = document.getElementById('backToMenuButton');
const resultMessage = document.getElementById('resultMessage');
const correctAnswerMessage = document.getElementById('correctAnswerMessage');

let questions = [];
let currentQuestion = null;
let currentMode = '';
let hasJudgedCurrentQuestion = false;

function loadMistakeData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('間違いデータの読み込みに失敗しました', error);
    return {};
  }
}

function saveMistakeData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getMistakeCount(questionId) {
  const mistakeData = loadMistakeData();
  return mistakeData[questionId] || 0;
}

function addMistake(questionId) {
  const mistakeData = loadMistakeData();
  mistakeData[questionId] = (mistakeData[questionId] || 0) + 1;
  saveMistakeData(mistakeData);
}

function resetMistakes() {
  localStorage.removeItem(STORAGE_KEY);
}

function updateMenuStats() {
  const mistakeData = loadMistakeData();
  const questionCount = Object.keys(mistakeData).length;
  const totalCount = Object.values(mistakeData).reduce((sum, value) => sum + value, 0);

  mistakeQuestionCountElement.textContent = String(questionCount);
  totalMistakeCountElement.textContent = String(totalCount);
}

function showMenu() {
  menuScreen.classList.remove('hidden');
  quizScreen.classList.add('hidden');
  updateMenuStats();
}

function showQuiz() {
  menuScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
}

function getModeInfo(mode) {
  switch (mode) {
    case 'nameToFormula':
      return {
        label: '名前 → 化学式',
        questionTitle: '物質名',
        questionText: currentQuestion.name,
        correctAnswer: currentQuestion.formula
      };
    case 'formulaToName':
      return {
        label: '化学式 → 名前',
        questionTitle: '化学式',
        questionText: currentQuestion.formula,
        correctAnswer: currentQuestion.name
      };
    case 'mistakeNameToFormula':
      return {
        label: '間違えた問題だけ(名前 → 化学式)',
        questionTitle: '物質名',
        questionText: currentQuestion.name,
        correctAnswer: currentQuestion.formula
      };
    case 'mistakeFormulaToName':
      return {
        label: '間違えた問題だけ(化学式 → 名前)',
        questionTitle: '化学式',
        questionText: currentQuestion.formula,
        correctAnswer: currentQuestion.name
      };
    default:
      throw new Error(`未知のモードです: ${mode}`);
  }
}

function getQuestionsForMode(mode) {
  const mistakeData = loadMistakeData();

  if (mode === 'mistakeNameToFormula' || mode === 'mistakeFormulaToName') {
    return questions.filter((question) => (mistakeData[question.id] || 0) > 0);
  }

  return questions;
}

function pickRandomQuestion(list) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function setResult(message, isCorrect, correctAnswer = '') {
  resultMessage.textContent = message;
  resultMessage.className = isCorrect ? 'result-correct' : 'result-wrong';

  if (correctAnswer) {
    correctAnswerMessage.textContent = `正解: ${correctAnswer}`;
  } else {
    correctAnswerMessage.textContent = '';
  }
}

function startMode(mode) {
  const targetQuestions = getQuestionsForMode(mode);

  if (targetQuestions.length === 0) {
    alert('該当する問題がありません。');
    updateMenuStats();
    return;
  }

  currentMode = mode;
  currentQuestion = pickRandomQuestion(targetQuestions);
  hasJudgedCurrentQuestion = false;

  const modeInfo = getModeInfo(mode);

  modeLabel.textContent = modeInfo.label;
  questionTitle.textContent = modeInfo.questionTitle;
  questionText.textContent = modeInfo.questionText;
  mistakeCountLabel.textContent = `この問題の間違い回数: ${getMistakeCount(currentQuestion.id)}`;

  answerInput.value = '';
  answerInput.disabled = false;
  judgeButton.disabled = false;
  nextButton.disabled = true;

  setResult('', true, '');

  showQuiz();
  answerInput.focus();
}

function judgeAnswer() {
  if (!currentQuestion || hasJudgedCurrentQuestion) {
    return;
  }

  const userAnswer = answerInput.value.trim();
  const modeInfo = getModeInfo(currentMode);
  const correctAnswer = modeInfo.correctAnswer;

  if (userAnswer === correctAnswer) {
    setResult('正解', true, '');
  } else {
    addMistake(currentQuestion.id);
    setResult('不正解', false, correctAnswer);
  }

  hasJudgedCurrentQuestion = true;
  answerInput.disabled = true;
  judgeButton.disabled = true;
  nextButton.disabled = false;
  mistakeCountLabel.textContent = `この問題の間違い回数: ${getMistakeCount(currentQuestion.id)}`;
  updateMenuStats();
}

async function loadQuestions() {
  const response = await fetch('data.json');
  if (!response.ok) {
    throw new Error('data.json の読み込みに失敗しました。');
  }

  questions = await response.json();
}

modeNameToFormulaButton.addEventListener('click', () => startMode('nameToFormula'));
modeFormulaToNameButton.addEventListener('click', () => startMode('formulaToName'));
modeMistakeNameToFormulaButton.addEventListener('click', () => startMode('mistakeNameToFormula'));
modeMistakeFormulaToNameButton.addEventListener('click', () => startMode('mistakeFormulaToName'));

resetMistakesButton.addEventListener('click', () => {
  const ok = confirm('間違えた履歴をすべて削除します。よろしいですか？');
  if (!ok) {
    return;
  }

  resetMistakes();
  updateMenuStats();
  alert('間違えた履歴を削除しました。');
});

judgeButton.addEventListener('click', judgeAnswer);

nextButton.addEventListener('click', () => {
  startMode(currentMode);
});

backToMenuButton.addEventListener('click', () => {
  showMenu();
});

answerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !judgeButton.disabled) {
    judgeAnswer();
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadQuestions();
    updateMenuStats();
    showMenu();
  } catch (error) {
    console.error(error);
    alert('問題データの読み込みに失敗しました。ファイル構成を確認してください。');
  }
});
