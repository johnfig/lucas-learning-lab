// Money Game State
let gameState = {
    money: 0,
    savings: 0,
    investments: 0,
    history: [],
    daysPassed: 0,
    chartData: {
        cash: [],
        savings: [],
        investments: [],
        total: []
    },
    tips: [
        "Saving early helps your money grow more over time! 🌱",
        "Compound interest means you earn interest on your interest! 🔄",
        "Investing usually gives higher returns than savings, but with more risk! 📈",
        "It's good to have both savings and investments! 🎯",
        "Regular small savings can grow into big amounts over time! 💰"
    ]
};

// Initialize Chart.js
let moneyChart;

function initializeMoneyGame() {
    // Initialize the chart with multiple datasets
    const ctx = document.getElementById('money-chart').getContext('2d');
    moneyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Total Worth',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Cash',
                    data: [],
                    borderColor: 'rgb(34, 197, 94)',
                    borderDash: [5, 5],
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Savings',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    borderDash: [5, 5],
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Investments',
                    data: [],
                    borderColor: 'rgb(168, 85, 247)',
                    borderDash: [5, 5],
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Days'
                    },
                    ticks: {
                        callback: function(value) {
                            return 'Day ' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.raw.toFixed(2);
                        }
                    }
                }
            }
        }
    });

    updateDisplay();
    showRandomTip();
}

function earnMoney(type) {
    if (gameState.daysPassed === 0) {
        // Initialize day 0 with zeros
        gameState.chartData.cash.push(0);
        gameState.chartData.savings.push(0);
        gameState.chartData.investments.push(0);
        gameState.chartData.total.push(0);
    }

    let amount = 0;
    let message = '';
    
    switch(type) {
        case 'chores':
            amount = 5;
            message = 'You earned $5 doing chores! 🧹';
            break;
        case 'homework':
            amount = 10;
            message = 'You earned $10 completing homework! 📚';
            break;
        case 'help':
            amount = 15;
            message = 'You earned $15 helping neighbors! 🏠';
            break;
    }
    
    gameState.money += amount;
    gameState.daysPassed += 1;
    
    gameState.history.push({
        day: gameState.daysPassed,
        action: 'earned',
        amount: amount
    });
    
    updateFinancialGrowth();
    updateDisplay();
    showTip(message);
}

function saveAmount() {
    if (gameState.money < 10) {
        showTip("You need at least $10 to start saving! 💰");
        return;
    }

    if (gameState.daysPassed === 0) {
        // Initialize day 0 with zeros
        gameState.chartData.cash.push(0);
        gameState.chartData.savings.push(0);
        gameState.chartData.investments.push(0);
        gameState.chartData.total.push(0);
    }

    const saveAmount = Math.min(gameState.money, 50);
    gameState.money -= saveAmount;
    gameState.savings += saveAmount;
    gameState.daysPassed += 1;
    
    gameState.history.push({
        day: gameState.daysPassed,
        action: 'saved',
        amount: saveAmount
    });
    
    updateFinancialGrowth();
    updateDisplay();
    showTip(`You saved $${saveAmount}! Your savings will grow with 3% interest! 🏦`);
}

function invest() {
    if (gameState.money < 50) {
        showTip("You need at least $50 to start investing! 📈");
        return;
    }

    if (gameState.daysPassed === 0) {
        // Initialize day 0 with zeros
        gameState.chartData.cash.push(0);
        gameState.chartData.savings.push(0);
        gameState.chartData.investments.push(0);
        gameState.chartData.total.push(0);
    }

    const investAmount = Math.min(gameState.money, 100);
    gameState.money -= investAmount;
    gameState.investments += investAmount;
    gameState.daysPassed += 1;
    
    gameState.history.push({
        day: gameState.daysPassed,
        action: 'invested',
        amount: investAmount
    });
    
    updateFinancialGrowth();
    updateDisplay();
    showTip(`You invested $${investAmount}! Watch it grow over time! 📈`);
}

function updateFinancialGrowth() {
    // Update savings (3% annual interest)
    if (gameState.savings > 0) {
        const dailyInterestRate = 0.03 / 365;
        const interest = gameState.savings * dailyInterestRate;
        gameState.savings += interest;
    }
    
    // Update investments (7% average annual return)
    if (gameState.investments > 0) {
        const dailyReturnRate = 0.07 / 365;
        const return_ = gameState.investments * dailyReturnRate;
        gameState.investments += return_;
    }
}

function updateDisplay() {
    // Update balances
    document.getElementById('money-balance').textContent = gameState.money.toFixed(2);
    document.getElementById('savings-balance').textContent = gameState.savings.toFixed(2);
    document.getElementById('investment-balance').textContent = gameState.investments.toFixed(2);
    
    // Store current values in chart data arrays
    gameState.chartData.cash.push(gameState.money);
    gameState.chartData.savings.push(gameState.savings);
    gameState.chartData.investments.push(gameState.investments);
    gameState.chartData.total.push(gameState.money + gameState.savings + gameState.investments);

    // Update chart with complete history
    moneyChart.data.labels = Array.from({length: gameState.daysPassed + 1}, (_, i) => i);
    moneyChart.data.datasets[0].data = gameState.chartData.total;
    moneyChart.data.datasets[1].data = gameState.chartData.cash;
    moneyChart.data.datasets[2].data = gameState.chartData.savings;
    moneyChart.data.datasets[3].data = gameState.chartData.investments;
    
    moneyChart.update();
}

function showTip(message) {
    const tipElement = document.getElementById('money-tip');
    tipElement.innerHTML = `<div class="font-bold">Day ${gameState.daysPassed}</div>${message}`;
}

function showRandomTip() {
    const randomTip = gameState.tips[Math.floor(Math.random() * gameState.tips.length)];
    showTip(randomTip);
}

function checkProgress() {
    const totalWorth = gameState.money + gameState.savings + gameState.investments;
    let message = `<div class="font-bold">Financial Report - Day ${gameState.daysPassed}</div>`;
    message += `<div class="mt-2">Your total worth is $${totalWorth.toFixed(2)}!</div>`;
    
    if (gameState.savings > 0) {
        const totalSaved = gameState.history
            .filter(h => h.action === 'saved')
            .reduce((sum, h) => sum + h.amount, 0);
        const interestEarned = gameState.savings - totalSaved;
        message += `<div class="mt-2">💰 Your savings have earned $${interestEarned.toFixed(2)} in interest!</div>`;
    }
    
    if (gameState.investments > 0) {
        const totalInvested = gameState.history
            .filter(h => h.action === 'invested')
            .reduce((sum, h) => sum + h.amount, 0);
        const investmentGains = gameState.investments - totalInvested;
        message += `<div class="mt-2">📈 Your investments have grown by $${investmentGains.toFixed(2)}!</div>`;
    }
    
    // Add some financial advice based on the current state
    message += `<div class="mt-4 text-sm text-gray-600">`;
    if (gameState.money > 100 && gameState.savings === 0) {
        message += `<div>💡 Tip: You have a lot of cash! Consider saving some for the future.</div>`;
    }
    if (gameState.savings > 200 && gameState.investments === 0) {
        message += `<div>💡 Tip: With good savings, you might want to try investing for higher returns.</div>`;
    }
    message += `</div>`;
    
    showTip(message);
}

// Initialize game when tab is shown
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'money-games' && !mutation.target.classList.contains('hidden')) {
                initializeMoneyGame();
            }
        });
    });

    const moneyGamesTab = document.getElementById('money-games');
    if (moneyGamesTab) {
        observer.observe(moneyGamesTab, { attributes: true, attributeFilter: ['class'] });
        // Initialize immediately if the tab is already visible
        if (!moneyGamesTab.classList.contains('hidden')) {
            initializeMoneyGame();
        }
    }
}); 