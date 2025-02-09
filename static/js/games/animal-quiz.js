document.addEventListener('DOMContentLoaded', function() {
    const animals = [
        {
            name: 'Lion',
            emoji: '🦁',
            options: ['Tiger', 'Lion', 'Leopard', 'Cheetah'],
            correct: 1,
            fact: 'Lions are the only cats that live in groups called prides!'
        },
        {
            name: 'Elephant',
            emoji: '🐘',
            options: ['Elephant', 'Rhino', 'Hippo', 'Giraffe'],
            correct: 0,
            fact: 'Elephants are the largest land animals on Earth!'
        },
        {
            name: 'Penguin',
            emoji: '🐧',
            options: ['Seagull', 'Ostrich', 'Penguin', 'Duck'],
            correct: 2,
            fact: 'Emperor penguins can dive up to 1800 feet deep!'
        },
        {
            name: 'Dolphin',
            emoji: '🐬',
            options: ['Shark', 'Whale', 'Seal', 'Dolphin'],
            correct: 3,
            fact: 'Dolphins sleep with one half of their brain at a time!'
        }
    ];

    let currentAnimal = null;
    let score = 0;
    let correctAnswers = 0;
    let usedAnimals = new Set();

    function startAnimalQuiz() {
        score = 0;
        correctAnswers = 0;
        usedAnimals.clear();
        document.getElementById('animal-score').textContent = `Score: ${score}`;
        nextAnimal();
    }

    function getRandomUnusedAnimal() {
        const availableAnimals = animals.filter(animal => !usedAnimals.has(animal.name));
        if (availableAnimals.length === 0) {
            usedAnimals.clear(); // Reset if all animals have been used
            return animals[Math.floor(Math.random() * animals.length)];
        }
        return availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
    }

    function nextAnimal() {
        currentAnimal = getRandomUnusedAnimal();
        usedAnimals.add(currentAnimal.name);

        const optionsContainer = document.getElementById('animal-options');
        if (!optionsContainer) return;

        // Clear previous content
        optionsContainer.innerHTML = '';
        document.getElementById('animal-fact').textContent = '';

        // Update the image with a large emoji
        const imageContainer = document.getElementById('animal-image');
        imageContainer.style.fontSize = '8rem';
        imageContainer.style.display = 'flex';
        imageContainer.style.justifyContent = 'center';
        imageContainer.style.alignItems = 'center';
        imageContainer.style.background = '#f8fafc';
        imageContainer.style.borderRadius = '0.5rem';
        imageContainer.textContent = currentAnimal.emoji;

        // Create option buttons
        currentAnimal.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'w-full p-3 text-lg bg-blue-100 hover:bg-blue-200 rounded-lg mb-2 transition-colors';
            button.textContent = option;
            button.onclick = () => checkAnswer(index);
            optionsContainer.appendChild(button);
        });
    }

    function checkAnswer(selectedIndex) {
        const buttons = document.getElementById('animal-options').children;
        Array.from(buttons).forEach(button => button.disabled = true);

        if (selectedIndex === currentAnimal.correct) {
            score += 10;
            correctAnswers++;
            document.getElementById('animal-score').textContent = `Score: ${score}`;
            buttons[selectedIndex].classList.add('bg-green-500', 'text-white');
            
            if (correctAnswers >= 3) {
                // Game won!
                setTimeout(() => {
                    alert(`Congratulations! You won with a score of ${score}! 🎉`);
                    saveAnimalQuizScore(score);
                    startAnimalQuiz(); // Reset the game
                }, 1000);
                return;
            }
        } else {
            buttons[selectedIndex].classList.add('bg-red-500', 'text-white');
            buttons[currentAnimal.correct].classList.add('bg-green-500', 'text-white');
        }

        document.getElementById('animal-fact').textContent = currentAnimal.fact;
        setTimeout(nextAnimal, 2000);
    }

    function saveAnimalQuizScore(score) {
        fetch('/games/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                game: 'animal-quiz', 
                score: score,
                completed: true
            })
        });
    }

    // Make functions globally available
    window.startAnimalQuiz = startAnimalQuiz;
    window.nextAnimal = nextAnimal;
    window.checkAnswer = checkAnswer;

    // Initialize if we're on the games tab
    if (document.getElementById('animal-options')) {
        startAnimalQuiz();
    }
}); 