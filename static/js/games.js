function initializeGames() {
    // Initialize all games when the games tab is shown
    if (document.getElementById('games')) {
        try {
            // Word Scramble initialization
            if (document.getElementById('word-guess') && typeof newWord === 'function') {
                newWord();
            }

            // Math Challenge initialization
            if (document.getElementById('math-problem') && typeof newMathProblem === 'function') {
                newMathProblem();
            }

            // Memory Match initialization
            if (document.getElementById('memory-game') && typeof startMemoryGame === 'function') {
                startMemoryGame();
            }

            // Spelling Bee initialization
            if (document.getElementById('spelling-hint') && typeof newSpellingWord === 'function') {
                newSpellingWord();
            }

            // Animal Quiz initialization
            if (document.getElementById('animal-options') && typeof startAnimalQuiz === 'function') {
                startAnimalQuiz();
            }

            // Tic Tac Toe initialization
            if (document.getElementById('ttt-board') && typeof resetGame === 'function') {
                resetGame();
            }
        } catch (error) {
            console.error('Error initializing games:', error);
        }
    }
}

// Add event listener to initialize games when scripts are loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short moment for all game scripts to be properly loaded
    setTimeout(initializeGames, 100);
});

// Make the function globally available
window.initializeGames = initializeGames; 