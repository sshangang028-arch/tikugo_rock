/**
 * Game Logic: tikugo_rock
 * 2nd Class Career Consultant Exam text-based quiz game
 */

// Global State
let allQuestions = [];
let playQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let timerInterval = null;
const QUESTION_LIMIT = 10;
const LIMIT_TIME_SEC = 30.0;
let remainingMs = LIMIT_TIME_SEC * 1000;

// Web Audio API
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Generate sound effects programmatically (Fallback if correct.mp3/incorrect.mp3 are missing)
function playSound(type) {
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === 'correct') {
      // "Ping-pong" Double Tone
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      // Bell-like high frequency
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(880.00, now + 0.1); // A5
      osc2.frequency.setValueAtTime(1318.51, now + 0.1); // E6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.start(now);
      osc2.start(now + 0.1);

      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);

    } else if (type === 'wrong' || type === 'timeout') {
      // "Buzz" Low Dissonant Tone
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      // Low dissonant frequency
      osc1.frequency.setValueAtTime(125, now);
      osc2.frequency.setValueAtTime(128, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    }
  } catch (error) {
    console.error("Audio playback error: ", error);
  }
}

// Elements DOM
const screenTitle = document.getElementById('screen-title');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');

const btnStart = document.getElementById('btn-start');
const btnNext = document.getElementById('btn-next');
const btnRetry = document.getElementById('btn-retry');
const btnToTitle = document.getElementById('btn-to-title');

const csvUpload = document.getElementById('csv-upload');
const btnFileSelect = document.querySelector('.btn-file-select');
const fileNameSpan = document.getElementById('file-name');
const csvStatus = document.getElementById('csv-status');

const currentQNum = document.getElementById('current-q-num');
const gameScoreVal = document.getElementById('game-score');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');

const clientInfo = document.getElementById('client-info');
const clientSpeech = document.getElementById('client-speech');
const optionsGrid = document.getElementById('options-grid');
const optionButtons = document.querySelectorAll('.option-btn');

const explanationPanel = document.getElementById('explanation-panel');
const explResultBadge = document.getElementById('expl-result-badge');
const explResponseType = document.getElementById('expl-response-type');
const explText = document.getElementById('expl-text');
const explCorrectBox = document.getElementById('expl-correct-answer');
const correctAnswerText = document.getElementById('correct-answer-text');

const feedbackOverlay = document.getElementById('feedback-overlay');
const overlayMark = document.getElementById('overlay-mark');

// Load initial question base on start
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadDefaultCSV();
});

function setupEventListeners() {
  // Start Game click
  btnStart.addEventListener('click', () => {
    initAudio();
    startGame();
  });

  // Next Question
  btnNext.addEventListener('click', () => {
    goToNextQuestion();
  });

  // Retry
  btnRetry.addEventListener('click', () => {
    startGame();
  });

  // To Title
  btnToTitle.addEventListener('click', () => {
    switchScreen(screenTitle);
  });

  // Manual File Upload trigger
  btnFileSelect.addEventListener('click', () => {
    csvUpload.click();
  });

  csvUpload.addEventListener('change', handleCSVFileUpload);

  // Setup options click handler
  optionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      selectOption(idx);
    });
  });
}

// Switch between SPA screens with animations
function switchScreen(newScreen) {
  document.querySelectorAll('.screen').forEach(scr => {
    scr.classList.remove('active');
  });
  newScreen.classList.add('active');
}

// Load default local questions.csv
function loadDefaultCSV() {
  // Prefer JS-injected default data to avoid CORS on file:// protocol
  if (typeof DEFAULT_CSV_DATA !== 'undefined' && DEFAULT_CSV_DATA) {
    parseCSVData(DEFAULT_CSV_DATA.trim(), "デフォルト問題集");
    return;
  }

  csvStatus.textContent = "データをフェッチ中...";
  csvStatus.className = "csv-status-message";

  fetch('questions.csv')
    .then(response => {
      if (!response.ok) {
        throw new Error("CORS or Network Error reading questions.csv");
      }
      return response.text();
    })
    .then(text => {
      parseCSVData(text, "questions.csv");
    })
    .catch(error => {
      console.warn("Auto-load failed. Waiting for manual upload. Details: ", error);
      csvStatus.textContent = "※自動ロード不可。下のボタンからquestions.csvを入力してください。";
      csvStatus.className = "csv-status-message error";
      btnStart.disabled = true;
    });
}

// Handle manual CSV file selected by user
function handleCSVFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  fileNameSpan.textContent = file.name;
  csvStatus.textContent = "パース中...";
  csvStatus.className = "csv-status-message";

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseCSVData(text, file.name);
  };
  reader.onerror = function() {
    csvStatus.textContent = "ファイルの読み込みに失敗しました。";
    csvStatus.className = "csv-status-message error";
  };
  reader.readAsText(file, 'UTF-8');
}

// Parse CSV content using Papaparse library
function parseCSVData(csvText, sourceName) {
  if (typeof Papa === 'undefined') {
    csvStatus.textContent = "パーサーモジュールがロードされていません。";
    csvStatus.className = "csv-status-message error";
    return;
  }

  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (results.errors.length > 0 || results.data.length === 0) {
        console.error("CSV Parse Errors: ", results.errors);
        csvStatus.textContent = `解析エラーが発生しました。列名を確認してください。`;
        csvStatus.className = "csv-status-message error";
        btnStart.disabled = true;
        return;
      }

      // Format data to fit application consumption schema
      try {
        const formatted = results.data.map((row, index) => {
          return {
            id: row.id || (index + 1),
            clientInfo: row.client_info || "",
            speech: row.speech || "",
            options: [
              {
                text: row.option1_text,
                score: parseFloat(row.option1_score) || 0,
                type: row.option1_type || "",
                feedback: row.option1_feedback || ""
              },
              {
                text: row.option2_text,
                score: parseFloat(row.option2_score) || 0,
                type: row.option2_type || "",
                feedback: row.option2_feedback || ""
              },
              {
                text: row.option3_text,
                score: parseFloat(row.option3_score) || 0,
                type: row.option3_type || "",
                feedback: row.option3_feedback || ""
              },
              {
                text: row.option4_text,
                score: parseFloat(row.option4_score) || 0,
                type: row.option4_type || "",
                feedback: row.option4_feedback || ""
              }
            ]
          };
        });

        // Ensure we actually got formatted rows
        if (formatted.length === 0 || !formatted[0].speech) {
          throw new Error("Data mapping failure - empty speech in head row");
        }

        allQuestions = formatted;
        csvStatus.textContent = `読込成功: ${sourceName} (${allQuestions.length}問)`;
        csvStatus.className = "csv-status-message success";
        btnStart.disabled = false;
      } catch (err) {
        console.error("Format schema error: ", err);
        csvStatus.textContent = "CSVのヘッダー形式が正しくありません。テンプレートをご確認ください。";
        csvStatus.className = "csv-status-message error";
        btnStart.disabled = true;
      }
    }
  });
}

// Start/Reset Game State
function startGame() {
  score = 0;
  correctCount = 0;
  currentQuestionIndex = 0;
  gameScoreVal.textContent = score;

  // Shuffle questions and select the limit
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  playQuestions = shuffled.slice(0, Math.min(QUESTION_LIMIT, shuffled.length));

  switchScreen(screenGame);
  renderQuestion();
}

// Show a single question
function renderQuestion() {
  // Reset UI status
  explanationPanel.classList.remove('show');
  
  // Clear classes on buttons and enable
  optionButtons.forEach(btn => {
    btn.className = "option-btn";
    btn.disabled = false;
  });

  const q = playQuestions[currentQuestionIndex];
  
  // Set current HUD
  currentQNum.textContent = currentQuestionIndex + 1;
  clientInfo.textContent = q.clientInfo;
  clientSpeech.textContent = q.speech;

  // Shuffle the options within themselves to prevent answers being fixed on option 1
  const shuffledOptions = q.options.map((opt, i) => ({...opt, originalIndex: i}))
                                    .sort(() => 0.5 - Math.random());

  // Render option texts on button grids
  optionButtons.forEach((btn, index) => {
    const optData = shuffledOptions[index];
    btn.textContent = optData.text;
    btn.setAttribute('data-score', optData.score);
    btn.setAttribute('data-type', optData.type);
    btn.setAttribute('data-feedback', optData.feedback);
  });

  // Start question timer
  startTimer();
}

// Start progress countdown timer (5000ms limit, 100ms updates)
function startTimer() {
  clearInterval(timerInterval);
  remainingMs = LIMIT_TIME_SEC * 1000;
  
  updateTimerUI();

  timerInterval = setInterval(() => {
    remainingMs -= 100;
    
    if (remainingMs <= 0) {
      remainingMs = 0;
      updateTimerUI();
      triggerTimeout();
    } else {
      updateTimerUI();
    }
  }, 100);
}

// Update timer bar width & colors dynamically
function updateTimerUI() {
  const percent = (remainingMs / (LIMIT_TIME_SEC * 1000)) * 100;
  timerBar.style.width = `${percent}%`;
  timerText.textContent = (remainingMs / 1000).toFixed(1);

  // Dynamic visual indicators
  timerBar.classList.remove('warning', 'danger');
  if (percent < 20) {
    timerBar.classList.add('danger');
  } else if (percent < 50) {
    timerBar.classList.add('warning');
  }
}

// Select an option clicked by user
function selectOption(btnIndex) {
  // Lock choices and timer
  clearInterval(timerInterval);
  disableAllOptions();

  const clickedBtn = optionButtons[btnIndex];
  const choiceScore = parseFloat(clickedBtn.getAttribute('data-score'));
  const choiceType = clickedBtn.getAttribute('data-type');
  const choiceFeedback = clickedBtn.getAttribute('data-feedback');

  const isCorrect = choiceScore > 0;

  // Show OX overlay feedback
  showOXOverlay(isCorrect);

  // Apply visual correctness classes to buttons and get correct text
  let correctTextStr = "";
  optionButtons.forEach(btn => {
    const btnScore = parseFloat(btn.getAttribute('data-score'));
    if (btnScore > 0) {
      btn.classList.add('selected-correct');
      correctTextStr = btn.textContent;
    }
  });

  if (!isCorrect) {
    clickedBtn.classList.add('selected-wrong');
  } else {
    correctCount++;
  }

  // Update Score
  score += choiceScore;
  gameScoreVal.textContent = score;

  // Show sliding explanation panel
  showExplanation(isCorrect, choiceType, choiceFeedback, correctTextStr);
}

// Stop inputs on options grid
function disableAllOptions() {
  optionButtons.forEach(btn => {
    btn.disabled = true;
  });
}

// Visual O/X popup marker
function showOXOverlay(isCorrect) {
  feedbackOverlay.className = "feedback-overlay show " + (isCorrect ? "correct" : "wrong");
  overlayMark.textContent = isCorrect ? "〇" : "×";
  playSound(isCorrect ? 'correct' : 'wrong');

  setTimeout(() => {
    feedbackOverlay.classList.remove('show');
  }, 900);
}

// Play timeout penalty and trigger slide-up explanation
function triggerTimeout() {
  clearInterval(timerInterval);
  disableAllOptions();

  // Show huge red X, decrease points
  showOXOverlay(false);
  
  // Highlight correct choice
  let correctTextStr = "";
  optionButtons.forEach(btn => {
    const btnScore = parseFloat(btn.getAttribute('data-score'));
    if (btnScore > 0) {
      btn.classList.add('selected-correct');
      correctTextStr = btn.textContent;
    }
  });

  score -= 10; // Penalty for timeout
  gameScoreVal.textContent = score;

  playSound('timeout');
  showExplanation(false, "時間切れ (30秒経過)", "30秒以内に判断を下すことができませんでした。実際のカウンセリングの実技面接でも、クライアントの発言に対して沈黙しすぎたり間が空きすぎたりすると、関係構築の姿勢やカウンセラー主導の詰まりとしてマイナス材料になり得ます。迅速かつ適切な受容対応を行いましょう。", correctTextStr);
}

// Populate slide up card content
function showExplanation(isCorrect, responseType, feedbackText, correctTextStr = "") {
  explResultBadge.textContent = isCorrect ? "正解" : "解説";
  explResultBadge.className = "result-badge " + (isCorrect ? "correct" : "wrong");
  
  explResponseType.textContent = responseType || "不明";
  explText.textContent = feedbackText || "解説はありません。";

  if (!isCorrect && correctTextStr) {
    correctAnswerText.textContent = correctTextStr;
    explCorrectBox.style.display = "block";
  } else {
    explCorrectBox.style.display = "none";
  }

  // Slide up panel
  setTimeout(() => {
    explanationPanel.classList.add('show');
  }, 400);
}

// Move step by step through loaded slice
function goToNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < playQuestions.length) {
    renderQuestion();
  } else {
    showResultScreen();
  }
}

// Final Game Stats compilation
function showResultScreen() {
  clearInterval(timerInterval);
  
  // Final Score
  const finalScoreSpan = document.getElementById('final-score');
  finalScoreSpan.textContent = score;

  // Accuracy Calculation
  const finalAccuracySpan = document.getElementById('final-accuracy');
  const accuracy = Math.round((correctCount / playQuestions.length) * 100);
  finalAccuracySpan.textContent = `${accuracy}%`;

  // Determine carrier level rank
  const rankDiv = document.getElementById('result-rank');
  const rankDescP = document.getElementById('result-rank-desc');
  
  let rankTitle = "";
  let rankDesc = "";

  if (score >= 40) {
    rankTitle = "【合格】伝説のスーパーキャリアコンサルタント";
    rankDesc = "抜群の応答力と判断スピードです！クライアントの心情に非言語的にも、また言語的にも瞬時に寄り添うことができ、信頼関係の構築（ラポール）が完璧に行われています。実技・面接ともに高得点合格間違いなし！";
  } else if (score >= 25) {
    rankTitle = "【合格圏内】2級技能検定 合格基準レベル";
    rankDesc = "合格基準ラインをクリアしています！不適切な相槌や余計な自分語りをほぼ選択せず、クライアントの主訴の受け止めを優先できました。5秒以内の判断も良好です。この調子で本番に備えましょう。";
  } else if (score >= 10) {
    rankTitle = "【努力必要】駆け出し相談員 (養成修了レベル)";
    rankDesc = "基礎知識はありますが、反射的な対応で「余計なアドバイス」や「表面的な相槌」を挟みやすい傾向があります。実技試験ではクライアントの話を『聞き切る』受容・共感姿勢が不可欠です。模範回答の意図を見直しましょう。";
  } else if (score >= 0) {
    rankTitle = "【勉強不足】形骸化した聞き手";
    rankDesc = "時間切れのペナルティが多かったか、時期尚早な提案や形式的なオウム返しを選択しています。相手に寄り添い、感情の動くところを拾うカウンセリングスキルを意識し、再度逐語録を確認してみてください。";
  } else {
    rankTitle = "【激辛】自意識過剰な説教役員";
    rankDesc = "スコアがマイナスです！クライアントの語るスペースを奪う『自分語り（余計な話）』や、一方的な『具体的方策の押し付け』、冷たい突き放しが多すぎたようです。まずは相手を主役に据え、自分の話したい衝動をこらえましょう。";
  }

  rankDiv.textContent = rankTitle;
  rankDescP.textContent = rankDesc;

  switchScreen(screenResult);
}
