(function () {
  'use strict';

  const HISTORY_KEY = 'pandaChineseGameHistory';
  const PLAYER_KEY = 'pandaChinesePlayerName';
  const level = window.GAME_LEVEL || 'Easy';
  let playerName = '';
  let resultSaved = false;
  let revealed = false;

  function gameState() {
    return typeof state !== 'undefined' ? state : null;
  }

  function bosses() {
    return typeof bossData !== 'undefined' ? bossData : [];
  }

  function totalBosses() {
    return typeof TOTAL_BOSSES !== 'undefined' ? TOTAL_BOSSES : bosses().length;
  }

  function readHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function maxScore() {
    const gameBosses = bosses();
    const questions = Array.isArray(gameBosses)
      ? gameBosses.reduce((total, boss) => total + ((boss.questions || []).length), 0)
      : 75;
    let combo = 0;
    let total = 0;
    for (let i = 0; i < questions; i += 1) {
      combo += 1;
      total += 100 * (combo >= 5 ? 3 : combo >= 3 ? 2 : 1);
    }
    return total;
  }

  function saveResult() {
    const currentState = gameState();
    if (resultSaved || !currentState || !playerName) return;
    resultSaved = true;
    const history = readHistory();
    history.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: playerName,
      level,
      score: Number(currentState.score) || 0,
      maxScore: maxScore(),
      date: new Date().toISOString()
    });
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      localStorage.setItem(PLAYER_KEY, playerName);
    } catch (_) {
      resultSaved = false;
    }
  }

  function pauseForName() {
    const currentState = gameState();
    if (currentState) currentState.paused = true;
    if (typeof window.stopTimer === 'function') window.stopTimer();
    else if (currentState && currentState.timer) clearInterval(currentState.timer);
  }

  function resumeAfterName() {
    const currentState = gameState();
    if (currentState) currentState.paused = false;
    if (level === 'Normal') {
      if (typeof window.startTimer === 'function') window.startTimer();
    } else if (typeof window.startTimer === 'function') {
      window.startTimer(true);
    }
  }

  function updatePlayerDisplay() {
    const display = document.getElementById('player-display-name');
    if (display) display.textContent = `Panda ${playerName}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function currentQuestion() {
    const currentState = gameState();
    return currentState && currentState.currentQuestions
      ? currentState.currentQuestions[currentState.questionIndex]
      : null;
  }

  function disableCurrentAnswer() {
    document.querySelectorAll('.choice-btn').forEach((button) => { button.disabled = true; });
    const input = document.getElementById('answer-input');
    if (input) input.disabled = true;
  }

  function nextQuestion() {
    const currentState = gameState();
    if (!revealed || !currentState) return;
    revealed = false;
    const panel = document.getElementById('test-answer-panel');
    if (panel) panel.classList.add('hidden');
    currentState.questionIndex += 1;
    if (currentState.questionIndex >= currentState.currentQuestions.length) {
      const boss = bosses()[currentState.bossIndex];
      currentState.currentQuestions = typeof window.shuffle === 'function'
        ? window.shuffle(boss.questions)
        : typeof window.shuffleArray === 'function'
          ? window.shuffleArray(boss.questions)
          : boss.questions.slice();
      currentState.questionIndex = 0;
    }
    currentState.answered = false;
    if (typeof window.loadQuestion === 'function') window.loadQuestion();
  }

  function revealAnswer() {
    const question = currentQuestion();
    const currentState = gameState();
    if (!question || !currentState || currentState.answered) return;
    revealed = true;
    const panel = document.getElementById('test-answer-panel');
    panel.innerHTML = `
      <p class="font-thai text-xs font-bold text-purple-700">เฉลยสำหรับทดสอบ</p>
      <p class="font-hanzi text-2xl font-bold text-gray-800 mt-1">${escapeHtml(question.aHanzi)}</p>
      <p class="text-sm text-gray-600">${escapeHtml(question.aPinyin)}</p>
      <p class="font-thai text-sm text-emerald-700 mt-1">${escapeHtml(question.meaning)}</p>`;
    panel.classList.remove('hidden');
    const revealButton = document.getElementById('test-reveal-btn');
    revealButton.disabled = true;
    revealButton.textContent = 'นับเป็นตอบถูกแล้ว';
    document.getElementById('test-next-btn').textContent = 'กำลังไปข้อถัดไป…';

    // Use each mode's original answer logic, so the reveal is scored exactly as a
    // correct response: boss HP falls, combo/score update, and normal flow advances.
    if (level === 'Easy') {
      const correctChoice = `${question.aHanzi} (${question.aPinyin})`;
      const button = Array.from(document.querySelectorAll('.choice-btn'))
        .find((item) => item.dataset.choice === correctChoice);
      if (button) button.click();
    } else if (typeof window.submitAnswer === 'function') {
      window.submitAnswer(question.aHanzi);
    }
  }

  function addTestControls() {
    const card = document.querySelector('.speech-bubble');
    if (!card || document.getElementById('test-answer-panel')) return;
    const controls = document.createElement('div');
    controls.className = 'mt-3 border-t border-dashed border-purple-200 pt-3';
    controls.innerHTML = `
      <div id="test-answer-panel" class="hidden rounded-xl bg-violet-50 px-3 py-2 text-center"></div>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <button id="test-reveal-btn" type="button" disabled class="cursor-not-allowed rounded-xl bg-violet-100 py-2 text-xs font-thai font-bold text-violet-400 opacity-50">เฉลย (ปิดใช้งาน)</button>
        <button id="test-next-btn" type="button" disabled class="rounded-xl bg-sky-500 py-2 text-xs font-thai font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">ตอบถูกแล้วจะไปข้อต่อไป</button>
      </div>`;
    card.appendChild(controls);
    document.getElementById('test-reveal-btn').addEventListener('click', revealAnswer);
  }

  function wrapGameEnd() {
    const originalLoadQuestion = window.loadQuestion;
    if (typeof originalLoadQuestion === 'function') {
      window.loadQuestion = function () {
        revealed = false;
        const panel = document.getElementById('test-answer-panel');
        if (panel) panel.classList.add('hidden');
        const revealButton = document.getElementById('test-reveal-btn');
        if (revealButton) {
          revealButton.disabled = true;
          revealButton.textContent = 'เฉลย (ปิดใช้งาน)';
        }
        const nextButton = document.getElementById('test-next-btn');
        if (nextButton) nextButton.textContent = 'ตอบถูกแล้วจะไปข้อต่อไป';
        return originalLoadQuestion.apply(this, arguments);
      };
    }
    const originalLoadBoss = window.loadBoss;
    if (typeof originalLoadBoss === 'function') {
      window.loadBoss = function () {
        // Easy/Hardcore restart the current boss after Game Over without reloading.
        // Treat that action as the start of a new scored round.
        if (resultSaved) {
          resultSaved = false;
          revealed = false;
        }
        return originalLoadBoss.apply(this, arguments);
      };
    }
    const originalGameOver = window.gameOver;
    if (typeof originalGameOver === 'function') {
      window.gameOver = function () {
        saveResult();
        return originalGameOver.apply(this, arguments);
      };
    }
    const originalBossDefeated = window.bossDefeated;
    if (typeof originalBossDefeated === 'function') {
      window.bossDefeated = function () {
        const currentState = gameState();
        if (currentState && currentState.bossIndex + 1 >= totalBosses()) saveResult();
        return originalBossDefeated.apply(this, arguments);
      };
    }
    const originalVictory = window.victory;
    if (typeof originalVictory === 'function') {
      window.victory = function () {
        saveResult();
        return originalVictory.apply(this, arguments);
      };
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    playerName = (localStorage.getItem(PLAYER_KEY) || '').trim();
    if (!playerName) {
      window.location.replace('index.html');
      return;
    }
    addTestControls();
    wrapGameEnd();
    updatePlayerDisplay();
  });
}());
