export const TicTacToe = {
    currentPlayer: 'X',
    gameBoard: ['', '', '', '', '', '', '', '', ''],
    gameActive: true,
    
    init() {
        this.renderBoard();
        this.attachEventListeners();
    },

    renderBoard() {
        const board = document.getElementById('tic-tac-toe');
        if (!board) return;

        board.innerHTML = this.gameBoard.map((cell, index) => `
            <div class="game-cell" data-index="${index}"></div>
        `).join('');
    },

    // ... rest of the game logic
};

export function initTicTacToe() {
    TicTacToe.init();
} 