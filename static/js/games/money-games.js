// Money Game State
let gameState = {
    money: 0,
    savings: 0,
    investments: 0,
    history: [],
    daysPassed: 0,
    dailyData: {
        labels: [],
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
    comparisonLog: []
};

// Create separate chart instances
let dailyChart;
let comparisonChart;

function initializeMoneyGame() {
    // Initialize daily chart
    const dailyCtx = document.getElementById('daily-chart').getContext('2d');
    dailyChart = createDailyChart(dailyCtx);
    
    // Initialize comparison chart
    const comparisonCtx = document.getElementById('comparison-chart').getContext('2d');
    comparisonChart = createComparisonChart(comparisonCtx);
    
    showRandomTip();
}

function createDailyChart(ctx) {
    return new Chart(ctx, {
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
                    tension: 0.1
                },
                {
                    label: 'Savings',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    borderDash: [5, 5],
                    tension: 0.1
                },
                {
                    label: 'Investments',
                    data: [],
                    borderColor: 'rgb(168, 85, 247)',
                    borderDash: [5, 5],
                    tension: 0.1
                }
            ]
        },
        options: getDailyChartOptions()
    });
}

function createComparisonChart(ctx) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Basic Strategy',
                    data: [],
                    borderColor: 'rgb(156, 163, 175)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Savings Strategy',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Investment Strategy',
                    data: [],
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    tension: 0.1,
                    fill: true
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
                        text: 'Time'
                    },
                    ticks: {
                        callback: function(value) {
                            const month = parseInt(value) + 1;
                            if (month % 12 === 0) {
                                return `Year ${month / 12}`;
                            }
                            return '';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        },
                        title: function(context) {
                            const month = parseInt(context[0].label) + 1;
                            const year = Math.floor(month / 12);
                            const monthInYear = month % 12 || 12;
                            return `Year ${year}, Month ${monthInYear}`;
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function earnMoney(type) {
    if (gameState.daysPassed === 0) {
        // Initialize day 0 with zeros
        gameState.dailyData.cash.push(0);
        gameState.dailyData.savings.push(0);
        gameState.dailyData.investments.push(0);
        gameState.dailyData.total.push(0);
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
        gameState.dailyData.cash.push(0);
        gameState.dailyData.savings.push(0);
        gameState.dailyData.investments.push(0);
        gameState.dailyData.total.push(0);
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
        gameState.dailyData.cash.push(0);
        gameState.dailyData.savings.push(0);
        gameState.dailyData.investments.push(0);
        gameState.dailyData.total.push(0);
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
    
    // Update daily data
    const totalWorth = gameState.money + gameState.savings + gameState.investments;
    
    gameState.dailyData.labels.push(`Day ${gameState.daysPassed}`);
    gameState.dailyData.cash.push(gameState.money);
    gameState.dailyData.savings.push(gameState.savings);
    gameState.dailyData.investments.push(gameState.investments);
    gameState.dailyData.total.push(totalWorth);

    // Update daily chart
    dailyChart.data.labels = gameState.dailyData.labels;
    dailyChart.data.datasets[0].data = gameState.dailyData.total;
    dailyChart.data.datasets[1].data = gameState.dailyData.cash;
    dailyChart.data.datasets[2].data = gameState.dailyData.savings;
    dailyChart.data.datasets[3].data = gameState.dailyData.investments;
    
    dailyChart.update();
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
    gameState.dailyData = {
        labels: [],
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
    addResetButton();
});

// Update the simulation function to update the graph instead of table
async function simulateAllStrategies() {
    if (gameState.isSimulating) return;
    
    gameState.isSimulating = true;

    // Reset chart data
    comparisonChart.data.labels = [];
    comparisonChart.data.datasets[0].data = [];
    comparisonChart.data.datasets[1].data = [];
    comparisonChart.data.datasets[2].data = [];

    // Disable simulation button
    const simulationBtn = document.getElementById('simulate-comparison');
    simulationBtn.disabled = true;
    simulationBtn.innerHTML = `<span class="animate-pulse">Simulating 5 Years...</span>`;

    showTip("Starting 5-year comparison simulation... Watch how different strategies grow! 🚀");

    try {
        let basic = { money: 0 };
        let savings = { money: 0, savings: 0 };
        let investment = { money: 0, investments: 0 };
        let basicTotal = 0;
        let savingsTotal = 0;
        let investmentTotal = 0;

        // Simulate 60 months (5 years)
        for (let month = 0; month < gameState.simulationMonths; month++) {
            // Monthly income (assuming 20 working days per month)
            basic.money += 5 * 20; // $5/day from chores
            savings.money += 10 * 20; // $10/day from homework
            investment.money += 15 * 20; // $15/day from helping

            // Apply savings strategy
            if (savings.money >= 50) {
                const saveAmount = Math.min(savings.money, 200);
                savings.money -= saveAmount;
                savings.savings += saveAmount;
            }
            savings.savings *= (1 + (0.03 / 12));

            // Apply investment strategy
            if (investment.money >= 100) {
                const investAmount = Math.min(investment.money, 300);
                investment.money -= investAmount;
                investment.investments += investAmount;
            }
            investment.investments *= (1 + (0.07 / 12));

            // Calculate totals
            basicTotal = basic.money;
            savingsTotal = savings.money + savings.savings;
            investmentTotal = investment.money + investment.investments;

            // Update chart data
            comparisonChart.data.labels.push(month);
            comparisonChart.data.datasets[0].data.push(basicTotal);
            comparisonChart.data.datasets[1].data.push(savingsTotal);
            comparisonChart.data.datasets[2].data.push(investmentTotal);
            
            comparisonChart.update('none'); // Update without animation for performance
            
            await new Promise(resolve => setTimeout(resolve, gameState.simulationSpeed));
        }

        // Final chart update with animation
        comparisonChart.update();

        // Update results displays
        updateSimulationResults(basicTotal, savingsTotal, investmentTotal);
        showFinalComparison(basicTotal, savingsTotal, investmentTotal);
        showPerformanceComparison(basicTotal, savingsTotal, investmentTotal);

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

function showFinalComparison(basicTotal, savingsTotal, investmentTotal) {
    const savingsImprovement = ((savingsTotal / basicTotal - 1) * 100).toFixed(1);
    const investmentImprovement = ((investmentTotal / basicTotal - 1) * 100).toFixed(1);
    const monthlyExtra = (investmentTotal - basicTotal) / 60;
    
    showTip(`
        <div class="font-bold">💡 Key Investment Lessons:</div>
        <div class="mt-2 text-sm text-gray-600">
            <ul class="list-disc list-inside space-y-1">
                <li>Investment strategy earned ${formatCurrency(investmentTotal - basicTotal)} more than basic strategy</li>
                <li>That's an extra ${formatCurrency(monthlyExtra)} per month on average</li>
                <li>Savings improved results by ${savingsImprovement}%</li>
                <li>Investing improved results by ${investmentImprovement}%</li>
                <li>The power of compound growth made the biggest difference!</li>
            </ul>
        </div>
    `);
}

// Add new function to show performance comparison
function showPerformanceComparison(basicTotal, savingsTotal, investmentTotal) {
    const performanceDiv = document.createElement('div');
    performanceDiv.className = 'mt-6 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg';
    
    const investmentVsBasic = investmentTotal - basicTotal;
    const investmentVsSavings = investmentTotal - savingsTotal;
    const monthlyInvestmentAdvantage = investmentVsBasic / 60;
    const yearlyInvestmentAdvantage = monthlyInvestmentAdvantage * 12;
    
    performanceDiv.innerHTML = `
        <h4 class="font-bold text-lg mb-3">💫 Investment Strategy Performance</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white p-3 rounded-lg">
                <h5 class="font-semibold mb-2">Compared to Basic Strategy:</h5>
                <ul class="space-y-1 text-sm">
                    <li>• Total advantage: ${formatCurrency(investmentVsBasic)}</li>
                    <li>• Per year: ${formatCurrency(yearlyInvestmentAdvantage)}</li>
                    <li>• Per month: ${formatCurrency(monthlyInvestmentAdvantage)}</li>
                    <li>• Percentage better: ${((investmentTotal/basicTotal - 1) * 100).toFixed(1)}%</li>
                </ul>
            </div>
            <div class="bg-white p-3 rounded-lg">
                <h5 class="font-semibold mb-2">Compared to Savings Strategy:</h5>
                <ul class="space-y-1 text-sm">
                    <li>• Total advantage: ${formatCurrency(investmentVsSavings)}</li>
                    <li>• Per month: ${formatCurrency(investmentVsSavings / 60)}</li>
                    <li>• Percentage better: ${((investmentTotal/savingsTotal - 1) * 100).toFixed(1)}%</li>
                </ul>
            </div>
        </div>
        <div class="mt-4 text-sm bg-white p-3 rounded-lg">
            <p class="font-semibold mb-2">🎯 Key Takeaways:</p>
            <ul class="space-y-1">
                <li>• Higher-paying work + investing earned ${formatCurrency(investmentVsBasic)} more than basic work</li>
                <li>• Investment returns added ${formatCurrency(investmentTotal - (15 * 20 * 60))} through compound growth</li>
                <li>• Starting early and staying consistent made the biggest impact</li>
                <li>• The power of compound growth increases over time</li>
            </ul>
        </div>
    `;

    // Find the comparison chart div and insert the performance comparison before it
    const comparisonChart = document.querySelector('#comparison-chart').parentElement;
    comparisonChart.parentElement.insertBefore(performanceDiv, comparisonChart);
}

// Reset function for when switching between modes
function resetGame() {
    gameState.money = 0;
    gameState.savings = 0;
    gameState.investments = 0;
    gameState.daysPassed = 0;
    gameState.dailyData = {
        labels: [],
        cash: [],
        savings: [],
        investments: [],
        total: []
    };
    updateDisplay();
    showTip("Ready to start your financial journey! 🚀");
}

// Add reset button to HTML
function addResetButton() {
    const actionsSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
    const resetButton = document.createElement('button');
    resetButton.className = 'w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-4';
    resetButton.textContent = 'Reset Game';
    resetButton.onclick = resetGame;
    actionsSection.appendChild(resetButton);
}

function getDailyChartOptions() {
    return {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Amount ($)'
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
                    text: 'Days'
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                    }
                }
            }
        }
    };
}

// Add this function to update the simulation results
function updateSimulationResults(basicTotal, savingsTotal, investmentTotal) {
    const resultsDiv = document.getElementById('simulation-results');
    resultsDiv.classList.remove('hidden');
    
    // Update totals
    document.getElementById('basic-result').textContent = formatCurrency(basicTotal);
    document.getElementById('savings-result').textContent = formatCurrency(savingsTotal);
    document.getElementById('investment-result').textContent = formatCurrency(investmentTotal);
    
    // Calculate and update differences
    const savingsDiff = savingsTotal - basicTotal;
    const investmentDiff = investmentTotal - basicTotal;
    
    document.getElementById('savings-difference').textContent = 
        `+${formatCurrency(savingsDiff)} (${((savingsTotal/basicTotal - 1) * 100).toFixed(1)}% better)`;
    document.getElementById('investment-difference').textContent = 
        `+${formatCurrency(investmentDiff)} (${((investmentTotal/basicTotal - 1) * 100).toFixed(1)}% better)`;
} 