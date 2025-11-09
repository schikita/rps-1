// ====================
// ЭЛЕМЕНТЫ ЭКРАНОВ
// ====================

// Интро
const introScreen = document.getElementById('introScreen');
const skipIntroBtn = document.getElementById('skipIntroBtn');

// Авторизация
const authScreen = document.getElementById('authScreen');
const nicknameInput = document.getElementById('nicknameInput');
const avatarOptions = document.querySelectorAll('.avatar-option');
const avatarUpload = document.getElementById('avatarUpload');
const avatarPreview = document.getElementById('avatarPreview');
const enterArenaBtn = document.getElementById('enterArenaBtn');

// Игра
const gameScreen = document.getElementById('gameScreen');

// Старый интерфейс (индикаторы, оверлей, руки, выбор)
const playerStatus = document.getElementById('playerStatus');
const botStatus = document.getElementById('botStatus');
const readyBtn = document.getElementById('readyBtn');
const countdownEl = document.getElementById('countdown');
const resultEl = document.getElementById('result');
const choicesEl = document.getElementById('choices');
const playerScoreEl = document.getElementById('playerScore');
const botScoreEl = document.getElementById('botScore');
const botHand = document.getElementById('botHand');
const playerHand = document.getElementById('playerHand');
const overlay = document.getElementById('battleOverlay');
const overlayText = document.getElementById('overlayText');
const playerAvatarEl = document.querySelector('.avatar.player');

// Если используешь новый макет с кулаками — можно добавить:
const playerFist = document.getElementById('playerFist');
const botFist = document.getElementById('botFist');
const arenaStatus = document.getElementById('arenaStatus');
const arenaMessage = document.getElementById('arenaMessage');

// ====================
// КОНСТАНТЫ И СОСТОЯНИЕ
// ====================

const moves = ['rock', 'scissors', 'paper'];
const moveName = {
    rock: 'камень',
    scissors: 'ножницы',
    paper: 'бумага',
};

let selectedAvatarUrl = null;

let state = {
    playerReady: false,
    botReady: false,
    isChoosing: false,
    timerId: null,
    timeLeft: 0,
    playerChoice: null,
    botChoice: null,
    playerScore: 0,
    botScore: 0,
    draws: 0,
};

// ====================
// ВСПОМОГАТЕЛЬНЫЕ
// ====================

function setStatus(el, color) {
    if (!el) return;
    el.className = 'status ' + color;
}

function show(el) {
    if (!el) return;
    el.classList.remove('hidden');
}

function hide(el) {
    if (!el) return;
    el.classList.add('hidden');
}

function showOverlay(text, withCountdown = false) {
    if (!overlay || !overlayText) return;
    overlay.classList.add('visible');
    overlayText.textContent = text;
    if (countdownEl) {
        if (withCountdown) countdownEl.classList.add('active');
        else countdownEl.classList.remove('active');
    }
}

function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove('visible');
    if (countdownEl) countdownEl.classList.remove('active');
}

function resetHandsVisual() {
    if (botHand && playerHand) {
        botHand.removeAttribute('data-move');
        playerHand.removeAttribute('data-move');
        botHand.className = 'hand bot-hand idle';
        playerHand.className = 'hand player-hand idle';
    }
    if (playerFist && botFist) {
        playerFist.classList.remove('hit-win', 'hit-lose', 'hit-draw', 'fist-ready');
        botFist.classList.remove('hit-win', 'hit-lose', 'hit-draw', 'fist-ready');
        playerFist.removeAttribute('data-move');
        botFist.removeAttribute('data-move');
        // лёгкая анимация "наготове"
        playerFist.classList.add('fist-ready');
        botFist.classList.add('fist-ready');
    }
}

function resetChoicesVisual() {
    if (!choicesEl) return;
    choicesEl.querySelectorAll('.choice').forEach((c) =>
        c.classList.remove('selected')
    );
}

function setArenaText(title, text) {
    if (arenaStatus) arenaStatus.textContent = title;
    if (arenaMessage) arenaMessage.textContent = text;
}

// ====================
// ИНТРО → АВТОРИЗАЦИЯ
// ====================

function showAuth() {
    hide(introScreen);
    show(authScreen);
}

// 5 секунд интро, если не нажали "Пропустить"
if (introScreen && authScreen) {
    setTimeout(showAuth, 5000);
}

if (skipIntroBtn) {
    skipIntroBtn.addEventListener('click', showAuth);
}

// ====================
// ВЫБОР АВАТАРА
// ====================

if (avatarOptions.length) {
    avatarOptions.forEach((opt) => {
        opt.addEventListener('click', () => {
            avatarOptions.forEach((o) => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedAvatarUrl = opt.dataset.avatar;
            if (avatarPreview) {
                avatarPreview.style.backgroundImage = `url('${selectedAvatarUrl}')`;
            }
        });
    });
}

if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        selectedAvatarUrl = url;
        avatarOptions.forEach((o) => o.classList.remove('selected'));
        if (avatarPreview) {
            avatarPreview.style.backgroundImage = `url('${url}')`;
        }
    });
}

// ====================
// ВХОД В АРЕНУ
// ====================

if (enterArenaBtn) {
    enterArenaBtn.addEventListener('click', () => {
        const nick = (nicknameInput?.value.trim() || 'Игрок').toUpperCase();

        if (playerAvatarEl && selectedAvatarUrl) {
            playerAvatarEl.style.backgroundImage = `url('${selectedAvatarUrl}')`;
            playerAvatarEl.style.backgroundSize = 'cover';
            playerAvatarEl.style.backgroundPosition = 'center';
        }

        const playerNameEl = document.getElementById('playerName');
        if (playerNameEl) playerNameEl.textContent = nick;

        hide(authScreen);
        show(gameScreen);
        initGame();
    });
}

// ====================
// ИГРОВАЯ ЛОГИКА
// ====================

function initGame() {
    // начальное состояние
    state = {
        playerReady: false,
        botReady: false,
        isChoosing: false,
        timerId: null,
        timeLeft: 0,
        playerChoice: null,
        botChoice: null,
        playerScore: 0,
        botScore: 0,
        draws: 0,
    };

    if (playerScoreEl) playerScoreEl.textContent = '0';
    if (botScoreEl) botScoreEl.textContent = '0';
    if (countdownEl) countdownEl.textContent = '';

    resetHandsVisual();
    resetChoicesVisual();

    setStatus(playerStatus, 'yellow');
    setStatus(botStatus, 'yellow');
    if (resultEl) resultEl.textContent = '';

    showOverlay('Нажми «Готов», чтобы начать');
    setArenaText('АРЕНА ГОТОВА', 'Нажми «Готов» для начала раунда');
}

function startRound() {
    if (!state.playerReady || !state.botReady) return;

    setStatus(playerStatus, 'green');
    setStatus(botStatus, 'green');

    // анимация подготовки
    if (botHand && playerHand) {
        botHand.className = 'hand bot-hand pre-battle';
        playerHand.className = 'hand player-hand pre-battle';
    }
    if (playerFist && botFist) {
        playerFist.classList.add('fist-ready');
        botFist.classList.add('fist-ready');
    }

    state.isChoosing = true;
    state.timeLeft = 10;
    if (countdownEl) countdownEl.textContent = String(state.timeLeft);

    showOverlay('Выбери ход. Время идёт…', true);
    setArenaText('БАТЛ НАЧИНАЕТСЯ', 'Сделай свой выбор за 10 секунд');

    if (state.timerId) clearInterval(state.timerId);

    state.timerId = setInterval(() => {
        state.timeLeft -= 1;
        if (countdownEl) countdownEl.textContent = String(state.timeLeft);

        if (state.timeLeft <= 0) {
            clearInterval(state.timerId);
            state.isChoosing = false;

            if (!state.playerChoice) state.playerChoice = 'rock';
            state.botChoice = randomMove();

            revealRound();
        }
    }, 1000);
}

function randomMove() {
    return moves[Math.floor(Math.random() * moves.length)];
}

// Кнопка ГОТОВ
if (readyBtn) {
    readyBtn.addEventListener('click', () => {
        if (state.isChoosing) return;
        if (!state.playerReady) {
            state.playerReady = true;
            setStatus(playerStatus, 'green');
            readyBtn.classList.add('ready-green');
            readyBtn.textContent = 'Готов (ожидание соперника)';
            showOverlay('Ожидаем готовность соперника…');
            setArenaText('ОЖИДАЕМ БОТА', 'Бот подключается к раунду...');

            // эмуляция готовности бота
            setTimeout(() => {
                state.botReady = true;
                setStatus(botStatus, 'green');
                showOverlay('Батл начинается');
                readyBtn.textContent = 'Готов';
                setArenaText('ОБА ГОТОВЫ', 'Выбор хода начинается');
                startRound();
            }, 600 + Math.random() * 800);
        }
    });
}

// Выбор хода
if (choicesEl) {
    choicesEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.choice');
        if (!btn || !state.isChoosing) return;

        resetChoicesVisual();
        btn.classList.add('selected');
        state.playerChoice = btn.dataset.move;

        // визуал нижней руки
        if (playerHand) {
            playerHand.setAttribute('data-move', state.playerChoice);
        }
        if (playerFist) {
            playerFist.setAttribute('data-move', state.playerChoice);
        }
    });
}

function getResult(player, bot) {
    if (player === bot) return 'draw';
    if (
        (player === 'rock' && bot === 'scissors') ||
        (player === 'scissors' && bot === 'paper') ||
        (player === 'paper' && bot === 'rock')
    ) {
        return 'win';
    }
    return 'lose';
}

function revealRound() {
    hideOverlay();

    if (botHand && playerHand) {
        botHand.className = 'hand bot-hand';
        playerHand.className = 'hand player-hand';
    }
    if (playerFist && botFist) {
        playerFist.classList.remove('fist-ready');
        botFist.classList.remove('fist-ready');
    }

    const p = state.playerChoice;
    const b = state.botChoice;
    const outcome = getResult(p, b);

    // привязка иконок/ходов к рукам
    if (playerHand) playerHand.setAttribute('data-move', p);
    if (botHand) botHand.setAttribute('data-move', b);
    if (playerFist) playerFist.setAttribute('data-move', p);
    if (botFist) botFist.setAttribute('data-move', b);

    if (outcome === 'win') {
        state.playerScore++;
        if (playerScoreEl) playerScoreEl.textContent = String(state.playerScore);
        if (playerHand) playerHand.classList.add('hit-win');
        if (botHand) botHand.classList.add('hit-lose');
        if (playerFist) playerFist.classList.add('hit-win');
        if (botFist) botFist.classList.add('hit-lose');
    } else if (outcome === 'lose') {
        state.botScore++;
        if (botScoreEl) botScoreEl.textContent = String(state.botScore);
        if (botHand) botHand.classList.add('hit-win');
        if (playerHand) playerHand.classList.add('hit-lose');
        if (botFist) botFist.classList.add('hit-win');
        if (playerFist) playerFist.classList.add('hit-lose');
    } else {
        state.draws++;
        if (botHand) botHand.classList.add('hit-draw');
        if (playerHand) playerHand.classList.add('hit-draw');
        if (botFist) botFist.classList.add('hit-draw');
        if (playerFist) playerFist.classList.add('hit-draw');
    }

    // текст результата
    let text;
    if (outcome === 'win') {
        text = `Раунд за тобой: ${moveName[p]} сильнее, чем ${moveName[b]}.`;
    } else if (outcome === 'lose') {
        text = `Раунд за соперником: ${moveName[b]} сильнее, чем ${moveName[p]}.`;
    } else {
        text = `Ничья: ${moveName[p]} против ${moveName[b]}.`;
    }
    if (resultEl) resultEl.textContent = text;
    setArenaText('РЕЗУЛЬТАТ РАУНДА', text);

    setTimeout(() => {
        // победа матча
        if (state.playerScore === 2 || state.botScore === 2) {
            const finalWin = state.playerScore > state.botScore;
            const finalText = finalWin
                ? 'Матч выигран. Жми «Готов» для нового матча.'
                : 'Матч проигран. Жми «Готов» для реванша.';

            if (resultEl) resultEl.textContent = finalText;
            setArenaText('МАТЧ ОКОНЧЕН', finalText);
            fullResetForNextMatch();
            return;
        }

        // три ничьи
        if (state.draws >= 3 && state.playerScore < 2 && state.botScore < 2) {
            const msg = 'Три ничьи. Матч обнулён.';
            if (resultEl) resultEl.textContent = msg;
            setArenaText('МАТЧ ОБНУЛЁН', msg);
            fullResetForNextMatch();
            return;
        }

        // следующий раунд
        state.playerReady = false;
        state.botReady = false;
        state.playerChoice = null;
        state.botChoice = null;

        setStatus(playerStatus, 'yellow');
        setStatus(botStatus, 'yellow');
        resetHandsVisual();
        resetChoicesVisual();
        if (readyBtn) {
            readyBtn.classList.remove('ready-green');
            readyBtn.textContent = 'Готов';
        }
        if (countdownEl) countdownEl.textContent = '';
        showOverlay('Нажми «Готов» для следующего раунда');
        setArenaText('АРЕНА ГОТОВА', 'Нажми «Готов» для следующего раунда');
    }, 700);
}

function fullResetForNextMatch() {
    // сбрасываем только после того, как игрок снова нажмёт "Готов"
    state.playerReady = false;
    state.botReady = false;
    state.isChoosing = false;
    state.playerChoice = null;
    state.botChoice = null;
    state.playerScore = 0;
    state.botScore = 0;
    state.draws = 0;

    if (playerScoreEl) playerScoreEl.textContent = '0';
    if (botScoreEl) botScoreEl.textContent = '0';
    if (countdownEl) countdownEl.textContent = '';

    resetHandsVisual();
    resetChoicesVisual();

    setStatus(playerStatus, 'yellow');
    setStatus(botStatus, 'yellow');

    if (readyBtn) {
        readyBtn.classList.remove('ready-green');
        readyBtn.textContent = 'Готов';
    }

    showOverlay('Нажми «Готов» для нового матча');
}

// ====================
// АВТОСТАРТ, ЕСЛИ АВТОРИЗАЦИИ НЕТ
// ====================

if (!introScreen && !authScreen && gameScreen) {
    // если кто-то вырезал интро/авторизацию, просто стартуем арену
    show(gameScreen);
    initGame();
}
