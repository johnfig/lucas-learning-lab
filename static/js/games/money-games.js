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
    ],
    isSimulating: false,
    simulationSpeed: 100, // faster speed for longer simulation
    simulationMonths: 60, // 5 years
    monthlyData: {
        basic: [],
        savings: [],
        investment: []
    },
    scenarios: {
        basic: {
            money: 0,
            savings: 0,
            investments: 0,
            total: 0,
            data: []
        },
        savings: {
            money: 0,
            savings: 0,
            investments: 0,
            total: 0,
            data: []
        },
        investment: {
            money: 0,
            savings: 0,
            investments: 0,
            total: 0,
            data: []
        }
    }
};

// Initialize Chart.js
let moneyChart;

function initializeMoneyGame() {
    const ctx = document.getElementById('money-chart').getContext('2d');
    moneyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 61}, (_, i) => `Month ${i}`), // 0-60 months
            datasets: [
                {
                    label: 'Basic Strategy',
                    data: [],
                    borderColor: 'rgb(156, 163, 175)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    tension: 0.1
                },
                {
                    label: 'Savings Strategy',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1
                },
                {
                    label: 'Investment Strategy',
                    data: [],
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    tension: 0.1
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
                        text: 'Total Worth ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time (Months)'
                    },
                    ticks: {
                        callback: function(value) {
                            const years = Math.floor(value / 12);
                            const months = value % 12;
                            if (months === 0) {
                                return `Year ${years}`;
                            }
                            return ``;
                        },
                        autoSkip: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            });
                            return `${context.dataset.label}: ${value}`;
                        },
                        title: function(context) {
                            const monthNum = parseInt(context[0].label.split(' ')[1]);
                            const years = Math.floor(monthNum / 12);
                            const months = monthNum % 12;
                            return `Year ${years}, Month ${months}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });

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

async function startSimulation(scenario = 'basic') {
    if (gameState.isSimulating) return;
    
    // Reset game state
    gameState.money = 0;
    gameState.savings = 0;
    gameState.investments = 0;
    gameState.daysPassed = 0;
    gameState.chartData = {
        cash: [],
        savings: [],
        investments: [],
        total: []
    };
    gameState.history = [];
    gameState.isSimulating = true;
    gameState.simulationScenario = scenario;

    const simulationBtn = document.getElementById(`simulate-${scenario}`);
    if (simulationBtn) {
        simulationBtn.disabled = true;
        simulationBtn.innerHTML = `<span class="animate-pulse">Simulating...</span>`;
    }

    showTip("Starting simulation... Watch how money grows! 🚀");
    
    try {
        switch(scenario) {
            case 'basic':
                await simulateBasicStrategy();
                break;
            case 'savings':
                await simulateSavingsStrategy();
                break;
            case 'investment':
                await simulateInvestmentStrategy();
                break;
        }
    } finally {
        gameState.isSimulating = false;
        if (simulationBtn) {
            simulationBtn.disabled = false;
            simulationBtn.textContent = simulationBtn.getAttribute('data-original-text');
        }
    }
}

async function simulateBasicStrategy() {
    // Simulate doing only basic chores
    for (let i = 0; i < 30 && gameState.isSimulating; i++) {
        earnMoney('chores');
        await new Promise(resolve => setTimeout(resolve, gameState.simulationSpeed));
    }
    showTip("Basic strategy complete! Notice how the money grows slowly with just chores. 📊");
}

async function simulateSavingsStrategy() {
    // Simulate doing homework (better paying) and saving
    for (let i = 0; i < 30 && gameState.isSimulating; i++) {
        earnMoney('homework');
        if (gameState.money >= 50) {
            saveAmount();
        }
        await new Promise(resolve => setTimeout(resolve, gameState.simulationSpeed));
    }
    showTip("Savings strategy complete! See how interest helps your money grow! 💰");
}

async function simulateInvestmentStrategy() {
    // Simulate doing highest paying tasks and investing
    for (let i = 0; i < 30 && gameState.isSimulating; i++) {
        earnMoney('help');
        if (gameState.money >= 100) {
            invest();
        }
        await new Promise(resolve => setTimeout(resolve, gameState.simulationSpeed));
    }
    showTip("Investment strategy complete! Notice the power of higher returns! 📈");
}

function stopSimulation() {
    gameState.isSimulating = false;
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

// New function to simulate all strategies simultaneously
async function simulateAllStrategies() {
    if (gameState.isSimulating) return;
    
    // Reset scenarios
    gameState.monthlyData = {
        basic: [0],
        savings: [0],
        investment: [0]
    };

    gameState.isSimulating = true;

    // Disable simulation button
    const simulationBtn = document.getElementById('simulate-comparison');
    simulationBtn.disabled = true;
    simulationBtn.innerHTML = `<span class="animate-pulse">Simulating 5 Years...</span>`;

    showTip("Starting 5-year comparison simulation... Watch how different strategies grow! 🚀");

    try {
        let basic = { money: 0 };
        let savings = { money: 0, savings: 0 };
        let investment = { money: 0, investments: 0 };

        // Simulate 60 months (5 years)
        for (let month = 1; month <= gameState.simulationMonths; month++) {
            // Monthly income (assuming 20 working days per month)
            basic.money += 5 * 20; // $5/day from chores
            savings.money += 10 * 20; // $10/day from homework
            investment.money += 15 * 20; // $15/day from helping

            // Apply savings strategy
            if (savings.money >= 50) {
                const saveAmount = Math.min(savings.money, 200); // Save up to $200/month
                savings.money -= saveAmount;
                savings.savings += saveAmount;
            }
            // Monthly compound interest on savings (3% annual)
            savings.savings *= (1 + (0.03 / 12));

            // Apply investment strategy
            if (investment.money >= 100) {
                const investAmount = Math.min(investment.money, 300); // Invest up to $300/month
                investment.money -= investAmount;
                investment.investments += investAmount;
            }
            // Monthly compound returns on investments (7% annual)
            investment.investments *= (1 + (0.07 / 12));

            // Calculate monthly totals
            const basicTotal = basic.money;
            const savingsTotal = savings.money + savings.savings;
            const investmentTotal = investment.money + investment.investments;

            // Store monthly data
            gameState.monthlyData.basic.push(basicTotal);
            gameState.monthlyData.savings.push(savingsTotal);
            gameState.monthlyData.investment.push(investmentTotal);

            // Update chart
            updateComparisonChart();
            
            // Update progress message every year
            if (month % 12 === 0) {
                const year = month / 12;
                showTip(`Simulating Year ${year} of 5... 📊`);
            }

            await new Promise(resolve => setTimeout(resolve, gameState.simulationSpeed));
        }

        // Show final comparison
        const basicTotal = gameState.monthlyData.basic[gameState.simulationMonths];
        const savingsTotal = gameState.monthlyData.savings[gameState.simulationMonths];
        const investmentTotal = gameState.monthlyData.investment[gameState.simulationMonths];

        showTip(`
            <div class="font-bold">5-Year Comparison Results:</div>
            <div class="mt-2">
                <div>Basic Strategy: ${formatCurrency(basicTotal)}</div>
                <div>Savings Strategy: ${formatCurrency(savingsTotal)} 
                    (${((savingsTotal/basicTotal - 1) * 100).toFixed(1)}% better than basic)</div>
                <div>Investment Strategy: ${formatCurrency(investmentTotal)}
                    (${((investmentTotal/basicTotal - 1) * 100).toFixed(1)}% better than basic)</div>
            </div>
            <div class="mt-2 text-sm text-gray-600">
                💡 Over 5 years, the power of compound growth becomes very clear!
                The investment strategy earned ${formatCurrency(investmentTotal - basicTotal)} more than the basic strategy.
            </div>
        `);

    } finally {
        gameState.isSimulating = false;
        simulationBtn.disabled = false;
        simulationBtn.textContent = simulationBtn.getAttribute('data-original-text');
    }
}

function formatCurrency(amount) {
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    });
}

function updateComparisonChart() {
    moneyChart.data.datasets[0].data = gameState.monthlyData.basic;
    moneyChart.data.datasets[1].data = gameState.monthlyData.savings;
    moneyChart.data.datasets[2].data = gameState.monthlyData.investment;
    moneyChart.update();
} 