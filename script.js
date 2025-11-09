const playerStatus = document.getElementById('playerStatus');
const botStatus = document.getElementById('botStatus');
const readyBtn = document.getElementById('readyBtn');
const countdownEl = document.getElementById('countdown');
const resultEl = document.getElementById('result');
const choicesEl = document.getElementById('choices');
const playerScoreEl = document.getElementById('playerScore');
const botScoreEl = document.getElementById('botScore');

let playerReady = false;
let botReady = false;
let playerChoice = null;
let botChoice = null;
let playerScore = 0;
let botScore = 0;
let draws = 0;

function resetMatch() {
    playerScore = botScore = draws = 0;
    playerScoreEl.textContent = botScoreEl.textContent = '0';
    resultEl.textContent = '';
}

readyBtn.addEventListener('click', () => {
    playerReady = true;
    playerStatus.className = 'status green';
    readyBtn.classList.add('green');
    readyBtn.textContent = 'Готов!';
    resultEl.textContent = '';

    // бот "думает"
    setTimeout(() => {
        botReady = true;
        botStatus.className = 'status green';
        startCountdown();
    }, 800 + Math.random() * 1000);
});

function startCountdown() {
    if (!playerReady || !botReady) return;
    let timeLeft = 10;
    countdownEl.textContent = timeLeft;
    const timer = setInterval(() => {
        timeLeft--;
        countdownEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (!playerChoice) playerChoice = 'rock';
            botChoice = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
            resolveRound();
        }
    }, 1000);
}

choicesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice');
    if (!btn) return;
    document.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    playerChoice = btn.dataset.move;
});

function resolveRound() {
    const outcome = getResult(playerChoice, botChoice);

    if (outcome === 'win') playerScore++;
    else if (outcome === 'lose') botScore++;
    else draws++;

    playerScoreEl.textContent = playerScore;
    botScoreEl.textContent = botScore;

    let text = '';
    if (outcome === 'win') text = `Ты победил! (${emoji(playerChoice)} > ${emoji(botChoice)})`;
    if (outcome === 'lose') text = `Ты проиграл! (${emoji(playerChoice)} < ${emoji(botChoice)})`;
    if (outcome === 'draw') text = `Ничья (${emoji(playerChoice)} = ${emoji(botChoice)})`;

    resultEl.textContent = text;

    if (playerScore === 2 || botScore === 2) {
        resultEl.textContent += playerScore > botScore ? ' 🏆 Победа!' : ' 💀 Поражение!';
        setTimeout(resetMatch, 3000);
    } else if (draws >= 3) {
        resultEl.textContent = 'Три ничьих подряд — матч обнулён!';
        setTimeout(resetMatch, 3000);
    }

    // сброс состояний
    playerReady = botReady = false;
    playerChoice = botChoice = null;
    document.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
    playerStatus.className = botStatus.className = 'status yellow';
    readyBtn.classList.remove('green');
    readyBtn.textContent = 'Готов';
}

function getResult(player, bot) {
    if (player === bot) return 'draw';
    if (
        (player === 'rock' && bot === 'scissors') ||
        (player === 'scissors' && bot === 'paper') ||
        (player === 'paper' && bot === 'rock')
    ) return 'win';
    return 'lose';
}

function emoji(move) {
    return move === 'rock' ? '🪨' : move === 'scissors' ? '✂️' : '📜';
}

// инициализация
playerStatus.className = 'status yellow';
botStatus.className = 'status yellow';
