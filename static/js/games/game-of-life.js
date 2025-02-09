// Game of Life CSS
const gameOfLifeCSS = `
    .gol-grid {
        display: grid;
        gap: 1px;
        background-color: #ddd;
        border: 1px solid #999;
        aspect-ratio: 1;
        width: 100%;
        max-width: min(600px, 80vw);
        margin: 0 auto;
    }

    .gol-cell {
        width: 100%;
        height: 100%;
        aspect-ratio: 1;
        background-color: white;
        transition: background-color 0.2s;
    }

    .gol-cell.gol-alive {
        background-color: #4F46E5;
    }

    .gol-controls {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 1rem 0;
    }
`;

// Add the CSS to document
const gameOfLifeStyle = document.createElement('style');
gameOfLifeStyle.textContent = gameOfLifeCSS;
document.head.appendChild(gameOfLifeStyle);

// Game of Life class
class GameOfLife {
    constructor(size = 30) {
        this.size = size;
        this.grid = Array(size).fill().map(() => Array(size).fill(false));
        this.isRunning = false;
        this.generation = 0;
        this.population = 0;
        this.interval = null;
    }

    initialize() {
        // Random initialization
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.grid[i][j] = Math.random() < 0.3;
            }
        }
        this.updateStats();
    }

    getNeighbors(x, y) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newX = (x + i + this.size) % this.size;
                const newY = (y + j + this.size) % this.size;
                if (this.grid[newX][newY]) count++;
            }
        }
        return count;
    }

    nextGeneration() {
        const newGrid = Array(this.size).fill().map(() => Array(this.size).fill(false));
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const neighbors = this.getNeighbors(i, j);
                if (this.grid[i][j]) {
                    newGrid[i][j] = neighbors === 2 || neighbors === 3;
                } else {
                    newGrid[i][j] = neighbors === 3;
                }
            }
        }
        
        this.grid = newGrid;
        this.generation++;
        this.updateStats();
    }

    updateStats() {
        this.population = this.grid.flat().filter(cell => cell).length;
        
        // Update UI
        const generationEl = document.getElementById('generation');
        const populationEl = document.getElementById('population');
        if (generationEl) generationEl.textContent = this.generation;
        if (populationEl) populationEl.textContent = this.population;
    }

    updateGrid() {
        const gridElement = document.getElementById('life-grid');
        if (!gridElement) return;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = gridElement.children[i * this.size + j];
                if (this.grid[i][j]) {
                    cell.classList.add('gol-alive');
                } else {
                    cell.classList.remove('gol-alive');
                }
            }
        }
    }

    showResults() {
        const resultsElement = document.getElementById('results');
        if (!resultsElement) return;

        resultsElement.innerHTML = `
            <div class="bg-indigo-100 p-4 rounded-lg mt-4">
                <h3 class="text-xl font-bold text-indigo-800 mb-2">Simulation Complete!</h3>
                <ul class="list-disc list-inside space-y-2">
                    <li>Final Generation: ${this.generation}</li>
                    <li>Final Population: ${this.population}</li>
                    <li>Status: ${this.population === 0 ? 'Extinction' : 'Stable Pattern'}</li>
                </ul>
            </div>
        `;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => {
                this.nextGeneration();
                this.updateGrid();
                
                // Check if simulation should stop
                if (this.population === 0) {
                    this.stop();
                    this.showResults();
                }
            }, 100);
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.interval);
        }
    }

    reset() {
        this.stop();
        this.generation = 0;
        this.initialize();
        this.updateGrid();
        document.getElementById('results').innerHTML = '';
    }
}

// Global game instance
window.gameOfLife = null;

// Initialization function
function initializeGameOfLife() {
    const container = document.getElementById('game-of-life');
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    // Create grid
    const gridElement = document.createElement('div');
    gridElement.id = 'life-grid';
    gridElement.className = 'gol-grid';
    
    // Set grid template for both rows and columns
    const size = 30;
    gridElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    // Add cells
    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'gol-cell';
        gridElement.appendChild(cell);
    }

    container.appendChild(gridElement);

    // Initialize game
    window.gameOfLife = new GameOfLife(size);
    window.gameOfLife.initialize();
    window.gameOfLife.updateGrid();
}

// Control functions
function startSimulation() {
    if (window.gameOfLife) {
        window.gameOfLife.start();
        document.getElementById('start-btn').disabled = true;
        document.getElementById('stop-btn').disabled = false;
    }
}

function stopSimulation() {
    if (window.gameOfLife) {
        window.gameOfLife.stop();
        document.getElementById('start-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
    }
}

function resetSimulation() {
    if (window.gameOfLife) {
        window.gameOfLife.reset();
        document.getElementById('start-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
    }
}

// Export functions for global use
window.initializeGameOfLife = initializeGameOfLife;
window.startSimulation = startSimulation;
window.stopSimulation = stopSimulation;
window.resetSimulation = resetSimulation; 