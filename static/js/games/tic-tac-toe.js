document.addEventListener('DOMContentLoaded', function() {
    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;

    // Add tic-tac-toe specific styles
    const tttStyle = document.createElement('style');
    tttStyle.textContent = `
        .ttt-board {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
        }

        .ttt-cell {
            aspect-ratio: 1;
            background-color: #f3f4f6;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }

        .ttt-cell:hover:not(.ttt-played) {
            background-color: #e5e7eb;
        }

        .ttt-cell.ttt-x {
            color: #3b82f6;
        }

        .ttt-cell.ttt-o {
            color: #ef4444;
        }

        .ttt-cell.ttt-played {
            cursor: not-allowed;
        }

        .ttt-status {
            text-align: center;
            margin-bottom: 1rem;
            font-weight: bold;
            min-height: 1.5rem;
        }
    `;
    document.head.appendChild(tttStyle);

    function initializeGame() {
        const board = document.getElementById('ttt-board');
        if (!board) return;

        board.className = 'ttt-board';
        board.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'ttt-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
        updateStatus('Your turn! (X)');
    }

    function handleCellClick(e) {
        const index = e.target.dataset.index;
        if (gameBoard[index] !== '' || !gameActive) return;

        // Player's move
        makeMove(index, currentPlayer);
        
        if (checkWin()) {
            gameActive = false;
            updateStatus('You win! 🎉');
            saveTTTScore(10);
            return;
        }

        if (checkDraw()) {
            gameActive = false;
            updateStatus("It's a draw!");
            saveTTTScore(5);
            return;
        }

        // Computer's move
        currentPlayer = 'O';
        updateStatus("Computer's turn (O)");
        setTimeout(computerMove, 500);
    }

    function computerMove() {
        if (!gameActive) return;

        // Try to win
        const winMove = findBestMove('O');
        if (winMove !== -1) {
            makeMove(winMove, 'O');
            if (checkWin()) {
                gameActive = false;
                updateStatus('Computer wins!');
                return;
            }
            currentPlayer = 'X';
            updateStatus('Your turn! (X)');
            return;
        }

        // Try to block player
        const blockMove = findBestMove('X');
        if (blockMove !== -1) {
            makeMove(blockMove, 'O');
            currentPlayer = 'X';
            updateStatus('Your turn! (X)');
            return;
        }

        // Take center if available
        if (gameBoard[4] === '') {
            makeMove(4, 'O');
            currentPlayer = 'X';
            updateStatus('Your turn! (X)');
            return;
        }

        // Take random available cell
        const emptyCells = gameBoard.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);

        if (emptyCells.length > 0) {
            const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            makeMove(randomIndex, 'O');
            currentPlayer = 'X';
            updateStatus('Your turn! (X)');
        }
    }

    function makeMove(index, player) {
        gameBoard[index] = player;
        const cell = document.querySelector(`#ttt-board .ttt-cell[data-index="${index}"]`);
        cell.textContent = player;
        cell.classList.add('ttt-played', `ttt-${player.toLowerCase()}`);
    }

    function findBestMove(player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (gameBoard[a] === player && gameBoard[b] === player && gameBoard[c] === '') return c;
            if (gameBoard[a] === player && gameBoard[c] === player && gameBoard[b] === '') return b;
            if (gameBoard[b] === player && gameBoard[c] === player && gameBoard[a] === '') return a;
        }
        return -1;
    }

    function checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return gameBoard[a] !== '' &&
                   gameBoard[a] === gameBoard[b] &&
                   gameBoard[b] === gameBoard[c];
        });
    }

    function checkDraw() {
        return gameBoard.every(cell => cell !== '');
    }

    function updateStatus(message) {
        const status = document.getElementById('ttt-status');
        if (status) status.textContent = message;
    }

    function saveTTTScore(score) {
        fetch('/games/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game: 'tic-tac-toe', score: score })
        });
    }

    function resetGame() {
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        initializeGame();
    }

    // Make resetGame function available globally with unique name
    window.resetTTTGame = resetGame;

    // Initialize if we're on the games tab
    if (document.getElementById('ttt-board')) {
        initializeGame();
    }
}); 