// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let scores = {
    player: 0,
    computer: 0,
    draws: 0
};

// Player and leaderboard state
let playerName = '';
let leaderboardData = [];
const API_BASE_URL = 'http://localhost:3000/api';

// Winning combinations
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// DOM elements
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const playerScoreDisplay = document.getElementById('player-score');
const computerScoreDisplay = document.getElementById('computer-score');
const drawScoreDisplay = document.getElementById('draw-score');

// Player name elements
const playerNameInput = document.getElementById('player-name');
const saveNameBtn = document.getElementById('save-name-btn');
const currentPlayerDiv = document.getElementById('current-player');
const displayNameSpan = document.getElementById('display-name');
const changeNameBtn = document.getElementById('change-name-btn');
const playerInputDiv = document.querySelector('.player-input');

// Leaderboard elements
const leaderboardDiv = document.getElementById('leaderboard');
const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard-btn');
const leaderboardStatus = document.getElementById('leaderboard-status');

// Initialize game
function init() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    resetBtn.addEventListener('click', resetGame);
    
    // Player name event listeners
    saveNameBtn.addEventListener('click', savePlayerName);
    changeNameBtn.addEventListener('click', showNameInput);
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            savePlayerName();
        }
    });
    
    // Leaderboard event listeners
    refreshLeaderboardBtn.addEventListener('click', loadLeaderboard);
    
    updateScoreDisplay();
    loadLeaderboard();
    
    // Check if player name is saved in localStorage
    const savedName = localStorage.getItem('tictactoe-player-name');
    if (savedName) {
        playerName = savedName;
        showCurrentPlayer();
    }
}

// Handle cell click
function handleCellClick(event) {
    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    // Check if cell is already taken or game is not active
    if (board[clickedCellIndex] !== '' || !gameActive || currentPlayer !== 'X') {
        return;
    }

    // Make player move
    makeMove(clickedCellIndex, 'X');

    // Check game state after player move
    if (gameActive && currentPlayer === 'O') {
        // Computer's turn after a short delay
        setTimeout(() => {
            makeComputerMove();
        }, 500);
    }
}

// Make a move
function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add('taken', player.toLowerCase());

    checkResult();
}

// Check game result
function checkResult() {
    let roundWon = false;
    let winningCombination = null;

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] === '' || board[b] === '' || board[c] === '') {
            continue;
        }
        if (board[a] === board[b] && board[b] === board[c]) {
            roundWon = true;
            winningCombination = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        const winner = board[winningCombination[0]];
        gameActive = false;
        
        // Highlight winning cells
        winningCombination.forEach(index => {
            cells[index].classList.add('winner');
        });

        if (winner === 'X') {
            statusDisplay.textContent = 'You win! 🎉';
            scores.player++;
            if (playerName) {
                submitScore('win');
            }
        } else {
            statusDisplay.textContent = 'Computer wins! 🤖';
            scores.computer++;
            if (playerName) {
                submitScore('loss');
            }
        }
        
        updateScoreDisplay();
        return;
    }

    // Check for draw
    if (!board.includes('')) {
        gameActive = false;
        statusDisplay.textContent = "It's a draw! 🤝";
        scores.draws++;
        if (playerName) {
            submitScore('draw');
        }
        updateScoreDisplay();
        return;
    }

    // Switch player
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusDisplay.textContent = currentPlayer === 'X' ? 'Your turn (X)' : "Computer's turn (O)";
}

// Computer AI using minimax algorithm
function makeComputerMove() {
    if (!gameActive) return;

    const bestMove = getBestMove();
    makeMove(bestMove, 'O');
}

// Minimax algorithm to find best move
function minimax(newBoard, player) {
    const availableSpots = newBoard.reduce((acc, cell, index) => {
        if (cell === '') acc.push(index);
        return acc;
    }, []);

    // Check for terminal states
    if (checkWin(newBoard, 'X')) {
        return { score: -10 };
    } else if (checkWin(newBoard, 'O')) {
        return { score: 10 };
    } else if (availableSpots.length === 0) {
        return { score: 0 };
    }

    const moves = [];

    for (let i = 0; i < availableSpots.length; i++) {
        const move = {};
        move.index = availableSpots[i];
        newBoard[availableSpots[i]] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availableSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

// Get best move for computer
function getBestMove() {
    const newBoard = [...board];
    return minimax(newBoard, 'O').index;
}

// Check if a player has won
function checkWin(board, player) {
    return winningConditions.some(combination => {
        return combination.every(index => board[index] === player);
    });
}

// Update score display
function updateScoreDisplay() {
    playerScoreDisplay.textContent = scores.player;
    computerScoreDisplay.textContent = scores.computer;
    drawScoreDisplay.textContent = scores.draws;
}

// Reset game
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    statusDisplay.textContent = 'Your turn (X)';

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });
}

// Player name functions
function savePlayerName() {
    const name = playerNameInput.value.trim();
    if (name.length === 0) {
        alert('Please enter a valid name');
        return;
    }
    if (name.length > 20) {
        alert('Name must be 20 characters or less');
        return;
    }
    
    playerName = name;
    localStorage.setItem('tictactoe-player-name', playerName);
    showCurrentPlayer();
}

function showCurrentPlayer() {
    displayNameSpan.textContent = playerName;
    playerInputDiv.style.display = 'none';
    currentPlayerDiv.style.display = 'flex';
}

function showNameInput() {
    playerInputDiv.style.display = 'flex';
    currentPlayerDiv.style.display = 'none';
    playerNameInput.value = playerName;
    playerNameInput.focus();
}

// Leaderboard API functions
async function submitScore(result) {
    if (!playerName) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerName: playerName,
                result: result
            })
        });
        
        if (response.ok) {
            // Automatically refresh leaderboard after submitting score
            setTimeout(() => {
                loadLeaderboard();
            }, 500);
        } else {
            console.error('Failed to submit score');
        }
    } catch (error) {
        console.error('Error submitting score:', error);
    }
}

async function loadLeaderboard() {
    try {
        leaderboardStatus.textContent = 'Loading...';
        
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        if (response.ok) {
            leaderboardData = await response.json();
            displayLeaderboard();
            leaderboardStatus.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        } else {
            throw new Error('Failed to fetch leaderboard');
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardStatus.textContent = 'Failed to load leaderboard';
        displayLeaderboardError();
    }
}

function displayLeaderboard() {
    if (leaderboardData.length === 0) {
        leaderboardDiv.innerHTML = '<div class="leaderboard-empty">No players yet. Be the first to play!</div>';
        return;
    }
    
    let html = `
        <div class="leaderboard-header">
            <div>Rank</div>
            <div>Player</div>
            <div>Wins</div>
            <div>Losses</div>
            <div class="total-games">Games</div>
            <div>Win Rate</div>
        </div>
    `;
    
    leaderboardData.forEach((player, index) => {
        const isCurrentPlayer = player.name.toLowerCase() === playerName.toLowerCase();
        const rowClass = isCurrentPlayer ? 'leaderboard-row current-player-row' : 'leaderboard-row';
        
        html += `
            <div class="${rowClass}">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name" title="${player.name}">${player.name}${isCurrentPlayer ? ' (You)' : ''}</div>
                <div class="leaderboard-stat leaderboard-wins">${player.wins}</div>
                <div class="leaderboard-stat">${player.losses}</div>
                <div class="leaderboard-stat total-games">${player.totalGames}</div>
                <div class="leaderboard-stat leaderboard-winrate">${player.winRate}%</div>
            </div>
        `;
    });
    
    leaderboardDiv.innerHTML = html;
}

function displayLeaderboardError() {
    leaderboardDiv.innerHTML = `
        <div class="leaderboard-empty">
            Unable to load leaderboard. Make sure the server is running.
            <br><br>
            <button onclick="loadLeaderboard()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Try Again
            </button>
        </div>
    `;
}

// Initialize the game when page loads
init();