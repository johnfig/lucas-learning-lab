document.addEventListener('DOMContentLoaded', function() {
    const emojis = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐔', '🐧', '🦉'];
    let cards = [...emojis.slice(0, 8), ...emojis.slice(0, 8)];
    let flippedCards = [];
    let matchedPairs = 0;
    let score = 0;
    let canFlip = true;

    function createMemoryCard(emoji, index) {
        const card = document.createElement('div');
        card.className = 'memory-card bg-gray-200 rounded-lg cursor-pointer flex items-center justify-center text-2xl transition-all transform hover:scale-105 hover:bg-gray-300 aspect-square';
        card.dataset.index = index;
        card.dataset.emoji = emoji;
        
        // Create inner card structure
        const inner = document.createElement('div');
        inner.className = 'memory-card-inner w-full h-full relative';
        
        const front = document.createElement('div');
        front.className = 'memory-card-front absolute w-full h-full flex items-center justify-center bg-gray-200 rounded-lg';
        front.textContent = '?';
        
        const back = document.createElement('div');
        back.className = 'memory-card-back absolute w-full h-full flex items-center justify-center bg-white rounded-lg';
        back.textContent = emoji;
        
        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);
        
        card.addEventListener('click', () => handleMemoryCardClick(card));
        return card;
    }

    function handleMemoryCardClick(card) {
        if (!canFlip || 
            flippedCards.length === 2 || 
            card.classList.contains('matched') || 
            card.classList.contains('flipped')) {
            return;
        }

        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            canFlip = false;
            checkMemoryMatch();
        }
    }

    function checkMemoryMatch() {
        const [card1, card2] = flippedCards;
        const match = card1.dataset.emoji === card2.dataset.emoji;

        if (match) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            score += 10;
            if (matchedPairs === 8) {
                setTimeout(() => {
                    alert(`Congratulations! You won with a score of ${score}!`);
                    saveMemoryScore(score);
                }, 500);
            }
        } else {
            score = Math.max(0, score - 1);
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
            }, 1000);
        }

        document.getElementById('memory-score').textContent = score;
        flippedCards = [];
        setTimeout(() => { canFlip = true; }, 1000);
    }

    function startMemoryGame() {
        const grid = document.getElementById('memory-game');
        if (!grid) return;

        matchedPairs = 0;
        score = 0;
        cards = shuffle([...emojis.slice(0, 8), ...emojis.slice(0, 8)]);
        grid.innerHTML = '';

        cards.forEach((emoji, index) => {
            grid.appendChild(createMemoryCard(emoji, index));
        });

        document.getElementById('memory-score').textContent = score;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function saveMemoryScore(score) {
        fetch('/games/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game: 'memory-match', score: score })
        });
    }

    // Add memory-specific styles
    const style = document.createElement('style');
    style.textContent = `
        .memory-card {
            perspective: 1000px;
        }
        .memory-card-inner {
            transition: transform 0.6s;
            transform-style: preserve-3d;
        }
        .memory-card.flipped .memory-card-inner {
            transform: rotateY(180deg);
        }
        .memory-card-front,
        .memory-card-back {
            backface-visibility: hidden;
        }
        .memory-card-back {
            transform: rotateY(180deg);
        }
        .memory-card.matched {
            background-color: #e5e7eb !important;
            cursor: default;
            opacity: 0.8;
        }
        .memory-card:hover:not(.matched):not(.flipped) {
            background-color: #d1d5db;
        }
    `;
    document.head.appendChild(style);

    // Make function globally available with unique name
    window.startMemoryGame = startMemoryGame;

    // Initialize if we're on the games tab
    if (document.getElementById('memory-game')) {
        startMemoryGame();
    }
}); 