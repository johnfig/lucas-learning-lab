document.addEventListener('DOMContentLoaded', function() {
    const words = [
        { word: 'elephant', hint: 'A large gray animal with a trunk' },
        { word: 'giraffe', hint: 'A tall animal with a long neck' },
        { word: 'penguin', hint: 'A flightless bird that swims well' },
        { word: 'butterfly', hint: 'A beautiful insect with colorful wings' },
        { word: 'kangaroo', hint: 'An animal that hops and has a pouch' },
        { word: 'octopus', hint: 'A sea creature with eight arms' },
        { word: 'dolphin', hint: 'A smart sea mammal that makes clicking sounds' },
        { word: 'rhinoceros', hint: 'A large animal with horns on its nose' }
    ];

    let currentWord = null;

    function newSpellingWord() {
        currentWord = words[Math.floor(Math.random() * words.length)];
        document.getElementById('spelling-hint').textContent = currentWord.hint;
        document.getElementById('spelling-input').value = '';
    }

    function speakWord() {
        if (!currentWord) return;
        
        // Use the gTTS endpoint
        const audioUrl = `/get_word_audio/${currentWord.word}`;
        const audio = new Audio(audioUrl);
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
            // Fallback message if audio fails
            alert('Could not play audio. The word is: ' + currentWord.word);
        });
    }

    function checkSpelling() {
        const input = document.getElementById('spelling-input').value.toLowerCase().trim();
        if (input === currentWord.word) {
            alert('Correct! 🎉');
            saveScore(10);
            newSpellingWord();
        } else {
            alert('Try again! 🤔');
        }
    }

    function saveScore(score) {
        fetch('/games/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game: 'spelling-bee', score: score })
        });
    }

    window.newSpellingWord = newSpellingWord;
    window.speakWord = speakWord;
    window.checkSpelling = checkSpelling;
}); 