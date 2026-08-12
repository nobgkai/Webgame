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

  function wrapGameEnd() {
    const originalLoadQuestion = window.loadQuestion;
    if (typeof originalLoadQuestion === 'function') {
      window.loadQuestion = function () {
        revealed = false;
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
    wrapGameEnd();
    updatePlayerDisplay();
  });
}());
