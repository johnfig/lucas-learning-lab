// Add at the start of the file
let selectedMicrophoneId = null;

// Add this at the very top of the file
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Polyfill for older browsers
if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
}

if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
        const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        
        if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }
        
        return new Promise(function(resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject);
        });
    }
}

// Function to check and request microphone permissions
async function requestMicrophonePermission() {
    try {
        // For Safari, skip the permissions query as it's not supported
        if (isSafari) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                return true;
            } catch {
                return false;
            }
        }

        // For other browsers, try the permissions API first
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
                if (permissionStatus.state === 'granted') {
                    return true;
                }
            } catch (e) {
                console.log('Permissions API not supported, falling back to getUserMedia');
            }
        }

        // Fallback to getUserMedia directly
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

// Function to initialize microphone
async function initializeMicrophone() {
    try {
        // Ensure browser supports required APIs
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Your browser does not support microphone access');
        }

        // Request permission and initialize
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        // Store the stream globally
        window.audioStream = stream;
        console.log('Microphone initialized successfully');

        // Get the list of audio devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');

        // Update UI to show microphone is ready
        document.getElementById('response').innerHTML = `
            <div class="bg-green-100 p-4 rounded-lg">
                <div class="font-bold">🎤 Microphone Ready!</div>
                <p>You can now use voice features.</p>
                ${audioInputs.length > 1 ? `
                    <div class="mt-2">
                        <label class="block text-sm font-medium text-gray-700">Select Microphone:</label>
                        <select id="mic-select" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            ${audioInputs.map(device => 
                                `<option value="${device.deviceId}">${device.label || 'Microphone ' + (audioInputs.indexOf(device) + 1)}</option>`
                            ).join('')}
                        </select>
                    </div>
                ` : ''}
            </div>
        `;

        // Add event listener for microphone selection if multiple devices exist
        if (audioInputs.length > 1) {
            document.getElementById('mic-select').addEventListener('change', async (e) => {
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: { exact: e.target.value },
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });
                    if (window.audioStream) {
                        window.audioStream.getTracks().forEach(track => track.stop());
                    }
                    window.audioStream = newStream;
                } catch (err) {
                    console.error('Error switching microphone:', err);
                }
            });
        }

        return true;
    } catch (error) {
        console.error('Microphone setup error:', error);
        document.getElementById('response').innerHTML = `
            <div class="bg-yellow-100 p-4 rounded-lg">
                <div class="font-bold">🎤 Microphone Access Required</div>
                <p class="mt-2">To enable your microphone:</p>
                <ol class="list-decimal list-inside mt-2 space-y-1">
                    <li>Click the camera/microphone icon in your browser's address bar</li>
                    <li>Select "Allow" for microphone access</li>
                    <li>Click the button below to try again</li>
                </ol>
                <button onclick="initializeMicrophone()" 
                        class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Enable Microphone
                </button>
            </div>
        `;
        return false;
    }
}

// Add this near the top of your file where other animations are defined
const speechBubbleCSS = `
    .speech-bubble-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
    }

    .speech-bubble {
        background: #4F46E5;
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        position: relative;
        animation: pulsate 2s ease-in-out infinite;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .speech-bubble:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 0;
        border: 20px solid transparent;
        border-top-color: #4F46E5;
        border-bottom: 0;
        margin-left: -20px;
        margin-bottom: -20px;
    }

    @keyframes pulsate {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .wave {
        width: 4px;
        height: 20px;
        background: white;
        margin-right: 3px;
        border-radius: 2px;
        animation: wave 1s ease-in-out infinite;
        display: inline-block;
    }

    .wave1 { animation-delay: 0s; }
    .wave2 { animation-delay: 0.2s; }
    .wave3 { animation-delay: 0.4s; }

    @keyframes wave {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(2); }
    }
`;

// Add the CSS to the document
const style = document.createElement('style');
style.textContent = speechBubbleCSS;
document.head.appendChild(style);

// Game CSS
const gameCSS = `
    .game-cell {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .game-cell:hover {
        background: #f1f5f9;
    }

    .game-cell.x {
        color: #3b82f6;
    }

    .game-cell.o {
        color: #ef4444;
    }

    .game-cell.winner {
        background: #bbf7d0;
        border-color: #86efac;
    }

    .memory-card {
        aspect-ratio: 1;
        perspective: 1000px;
        cursor: pointer;
    }

    .memory-card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        transition: transform 0.6s;
        transform-style: preserve-3d;
    }

    .memory-card.flipped .memory-card-inner {
        transform: rotateY(180deg);
    }

    .memory-card-front, .memory-card-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
    }

    .memory-card-back {
        transform: rotateY(180deg);
    }

    .tab-button {
        color: #6B7280;
        border-bottom: 2px solid transparent;
        position: relative;
    }

    .tab-button:hover {
        color: #4F46E5;
    }

    .tab-button.active {
        color: #4F46E5;
    }

    .tab-indicator {
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background-color: #4F46E5;
        transition: width 0.3s ease;
    }

    .tab-button.active .tab-indicator {
        width: 100%;
    }

    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: block;
    }
`;

// Add the game CSS to the document
const gameStyle = document.createElement('style');
gameStyle.textContent = gameCSS;
document.head.appendChild(gameStyle);

// Function to handle preset topic buttons
async function askPresetQuestion(question) {
    const responseDiv = document.getElementById('fun-facts-response');
    
    try {
        // Show loading animation
        responseDiv.innerHTML = `
            <div class="flex items-center space-x-2 mb-4">
                <span class="text-2xl animate-bounce">🚀</span>
                <h3 class="text-xl font-bold">Getting ready...</h3>
            </div>
            <div class="prose prose-lg max-w-none">
                <p class="text-blue-600">Preparing an amazing adventure for you...</p>
            </div>
        `;

        // Get the AI response
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: question })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Track topic exploration
        learningStats.topicsExplored++;
        learningStats.saveToServer();
        learningStats.addActivity({
            type: 'topic',
            description: `Learned about ${question.replace('Tell me about ', '')}`
        });

        // Show the response with speech bubble
        responseDiv.innerHTML = `
            <div class="flex items-center space-x-2 mb-4">
                <span class="text-2xl">🎯</span>
                <h3 class="text-xl font-bold">Here's what I found!</h3>
            </div>
            <div class="prose prose-lg max-w-none">
                ${data.response}
            </div>
            <div class="mt-4 bg-blue-50 p-4 rounded-lg flex items-center space-x-2">
                <span class="animate-pulse">🔊</span>
                <span>Listen while I explain...</span>
            </div>
        `;

        // Speak the response
        try {
            const speakResponse = await fetch('/api/speak', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: data.response })
            });

            if (!speakResponse.ok) {
                throw new Error(`HTTP error! status: ${speakResponse.status}`);
            }

            const blob = await speakResponse.blob();
            const audio = new Audio(URL.createObjectURL(blob));
            await audio.play();

            // Update display after speaking
            responseDiv.innerHTML = `
                <div class="flex items-center space-x-2 mb-4">
                    <span class="text-2xl">✨</span>
                    <h3 class="text-xl font-bold">Learning adventure complete!</h3>
                </div>
                <div class="prose prose-lg max-w-none">
                    ${data.response}
                </div>
                <div class="mt-4 bg-blue-50 p-4 rounded-lg">
                    <div class="font-bold">Want to learn more?</div>
                    <p class="text-sm text-gray-600">Try clicking another topic or ask me a specific question!</p>
                </div>
            `;
        } catch (speakError) {
            console.error('Speech error:', speakError);
            // Continue showing the text even if speech fails
        }

    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerHTML = `
            <div class="flex items-center space-x-2 mb-4">
                <span class="text-2xl">❌</span>
                <h3 class="text-xl font-bold text-red-500">Oops!</h3>
            </div>
            <div class="prose prose-lg max-w-none">
                <p class="text-red-500">Our space mission had a problem. Let's try again!</p>
                <p class="text-gray-600 mt-2">Try clicking the button again or choose a different topic.</p>
            </div>
        `;
    }
}

async function askQuestion() {
    const questionInput = document.getElementById('questionInput');
    const responseDiv = document.getElementById('response');
    
    if (!questionInput.value.trim()) {
        responseDiv.textContent = 'Please ask a question first! 🤔';
        return;
    }
    
    responseDiv.textContent = 'Thinking... 🤔';
    
    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: questionInput.value }),
        });
        
        const data = await response.json();
        responseDiv.textContent = data.response;
        
        // Speak the response
        await fetch('/api/speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: data.response }),
        });
    } catch (error) {
        console.error('Error:', error);
        responseDiv.textContent = 'Sorry, something went wrong! 😕';
    }
}

async function startListening() {
    const responseDiv = document.getElementById('response');
    
    try {
        // Ensure microphone is initialized
        if (!window.audioStream) {
            const success = await initializeMicrophone();
            if (!success) {
                return;
            }
        }

        // Show recording animation
        responseDiv.innerHTML = `
            <div class="flex items-center space-x-2 mb-4 bg-red-100 p-3 rounded-lg animate-pulse">
                <span class="text-2xl">🎤</span>
                <div>
                    <div class="font-bold">Recording...</div>
                    <div class="text-sm">Please speak now! I'm listening...</div>
                    <div class="flex space-x-1 mt-1">
                        <div class="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-red-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        <div class="w-2 h-2 bg-red-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                    </div>
                </div>
            </div>
        `;

        const response = await fetch('/api/listen', {
            method: 'POST',
        });
        
        const data = await response.json();
        
        if (data.status === 'no_speech_detected') {
            responseDiv.innerHTML = `
                <div class="flex items-center space-x-2 mb-4 bg-yellow-100 p-3 rounded-lg">
                    <span class="text-2xl">🔇</span>
                    <div>
                        <div class="font-bold">No speech detected</div>
                        <div class="text-sm">
                            Please check:
                            <ul class="list-disc list-inside">
                                <li>Your microphone is connected and selected</li>
                                <li>Your browser has microphone permissions</li>
                                <li>Try speaking louder or closer to the mic</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        if (data.text) {
            // Show what was heard with typing animation
            const questionInput = document.getElementById('questionInput');
            questionInput.value = data.text;
            responseDiv.innerHTML = `
                <div class="flex items-center space-x-2 mb-4 bg-green-100 p-3 rounded-lg">
                    <span class="text-2xl">👂</span>
                    <div>
                        <div class="font-bold">I heard:</div>
                        <div class="text-lg typewriter">"${data.text}"</div>
                    </div>
                </div>
            `;
            
            // Wait a moment to show what was heard
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Show thinking animation
            responseDiv.innerHTML = `
                <div class="flex items-center space-x-2 mb-4 bg-blue-100 p-3 rounded-lg">
                    <span class="text-2xl animate-bounce">🤔</span>
                    <div>
                        <div class="font-bold">Thinking...</div>
                        <div class="text-sm">Preparing your answer...</div>
                    </div>
                </div>
            `;
            
            // Get AI response
            const aiResponse = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: data.text }),
            });
            
            const aiData = await aiResponse.json();
            
            // Show speaking animation
            responseDiv.innerHTML = `
                <div class="flex items-center space-x-2 mb-4 bg-blue-100 p-3 rounded-lg">
                    <span class="text-2xl animate-pulse">🔊</span>
                    <div>
                        <div class="font-bold">Speaking...</div>
                        <div class="text-sm">Listen carefully!</div>
                        <div class="flex space-x-1 mt-1">
                            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                        </div>
                    </div>
                </div>
                <div class="mt-2">${aiData.response}</div>
            `;
            
            // Speak the response
            await fetch('/api/speak', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: aiData.response }),
            });
            
            // Show completion state
            responseDiv.innerHTML = `
                <div class="flex items-center space-x-2 mb-4 bg-green-100 p-3 rounded-lg">
                    <span class="text-2xl">✨</span>
                    <div>
                        <div class="font-bold">All done!</div>
                        <div class="text-sm">Here's what I explained:</div>
                    </div>
                </div>
                <div class="mt-2">${aiData.response}</div>
            `;
        } else {
            responseDiv.innerHTML = `
                <div class="flex items-center space-x-2 mb-4 bg-yellow-100 p-3 rounded-lg">
                    <span class="text-2xl">😕</span>
                    <div>
                        <div class="font-bold">Couldn't understand</div>
                        <div class="text-sm">Please try speaking more clearly!</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error in startListening:', error);
        responseDiv.innerHTML = `
            <div class="bg-red-100 p-4 rounded-lg">
                <div class="font-bold">❌ Error</div>
                <p>Could not start listening. Please try again.</p>
            </div>
        `;
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        askQuestion();
    } else if (e.key === 'l' && e.ctrlKey) {
        startListening();
    }
});

// Remove all existing DOMContentLoaded event listeners and replace with this one
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    
    // Initialize the UI first
    initializeUI();
    
    // Then restore the last active tab
    const lastActiveTab = localStorage.getItem('currentTab') || 'fun-facts';
    const tabToActivate = document.querySelector(`[onclick="switchTab('${lastActiveTab}')"]`);
    if (tabToActivate) {
        tabToActivate.click();
    }
    
    // Initialize Life Path tab
    initializeLifePathTab();
    
    // Initialize Game of Life if we're on that tab
    const gameOfLifeTab = document.getElementById('game-of-life-tab');
    if (gameOfLifeTab && !gameOfLifeTab.classList.contains('hidden')) {
        if (!gameOfLife) {  // Only initialize if not already initialized
            initializeGameOfLife();
        }
    }
});

function initializeUI() {
    // Initialize tutor response area
    const responseElement = document.getElementById('response');
    if (responseElement) {
        responseElement.innerHTML = `
            <div class="bg-blue-100 p-4 rounded-lg">
                <div class="font-bold">👋 Welcome!</div>
                <p>Click the "Start Speaking" button to enable your microphone.</p>
            </div>
        `;
    }

    // Initialize games if we're on the games tab
    const gamesTab = document.getElementById('games');
    if (gamesTab && !gamesTab.classList.contains('hidden')) {
        initializeGames();
    }

    // Initialize dashboard if visible
    const dashboardTab = document.getElementById('dashboard');
    if (dashboardTab && !dashboardTab.classList.contains('hidden')) {
        learningStats.loadFromServer();
    }
}

function initializeGames() {
    try {
        // Only initialize games if we're on the games tab
        const gamesSection = document.getElementById('games');
        if (!gamesSection || gamesSection.classList.contains('hidden')) {
            return; // Don't initialize if not on games tab
        }

        // Initialize each game only if their elements exist
        if (document.getElementById('scrambled-word')) {
            newWord();
        }
        if (document.getElementById('math-problem')) {
            newMathProblem();
        }
        if (document.getElementById('memory-game')) {
            startMemoryGame();
        }
        if (document.getElementById('spelling-input')) {
            newSpellingWord();
        }
        if (document.getElementById('animal-options')) {
            startAnimalQuiz();
        }
        if (document.getElementById('ttt-board')) {
            initializeTicTacToe(); // Changed from resetTTTGame
        }
    } catch (error) {
        console.error('Error initializing games:', error);
    }
}

// Update the tab switching function
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Update tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.remove('hidden');
    selectedTab.classList.add('active');

    // Initialize content based on tab
    if (tabId === 'games') {
        initializeGames();
    } else if (tabId === 'dashboard') {
        learningStats.loadFromServer();
    } else if (tabId === 'game-of-life-tab' && !window.gameOfLife) {
        initializeGameOfLife();
    }

    // Save the current tab
    localStorage.setItem('currentTab', tabId);
}

// Update the API URL to use port 3000
// const API_BASE = 'http://localhost:3000';

const teacherCSS = `
    .teacher-container {
        position: fixed;
        z-index: 10;
        transform: scale(1.5);
        right: 80px;
        top: 40%;
    }

    .teacher {
        position: relative;
        animation: float 3s ease-in-out infinite;
        transition: transform 0.3s ease;
        cursor: pointer;
    }

    .teacher:hover {
        transform: scale(1.1);
    }

    .head {
        width: 70px;
        height: 70px;
        background: #FFD3B6;
        border-radius: 50%;
        position: relative;
        margin: 0 auto;
        box-shadow: inset -8px -8px 12px rgba(0,0,0,0.1);
        z-index: 2;
    }

    .hair {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 85px;
        height: 45px;
        background: #4A3219;
        border-radius: 40px 40px 0 0;
        box-shadow: inset -5px -5px 10px rgba(0,0,0,0.2);
    }

    .face {
        position: relative;
        top: 25px;
    }

    .eyes {
        position: relative;
        display: flex;
        justify-content: space-around;
        width: 40px;
        margin: 0 auto;
    }

    .eyes:before, .eyes:after {
        content: '';
        width: 8px;
        height: 8px;
        background: #333;
        border-radius: 50%;
        position: absolute;
        animation: blink 3s ease-in-out infinite;
    }

    .eyes:before { left: 0; }
    .eyes:after { right: 0; }

    .glasses {
        position: absolute;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        width: 54px;
        height: 20px;
    }

    .glasses:before, .glasses:after {
        content: '';
        position: absolute;
        width: 22px;
        height: 22px;
        border: 3px solid #333;
        border-radius: 50%;
        background: rgba(255,255,255,0.1);
    }

    .glasses:before { left: 0; }
    .glasses:after { right: 0; }

    .glasses-bridge {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 3px;
        background: #333;
    }

    .smile {
        width: 20px;
        height: 8px;
        border-bottom: 3px solid #333;
        border-radius: 50%;
        margin: 10px auto 0;
    }

    .body {
        width: 100px;
        height: 130px;
        background: #2563EB;
        border-radius: 20px 20px 30px 30px;
        margin: -15px auto 0;
        position: relative;
        box-shadow: inset -10px -10px 15px rgba(0,0,0,0.15);
        z-index: 1;
    }

    .collar {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 15px;
        background: white;
        border-radius: 0 0 10px 10px;
    }

    .tie {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 35px;
        background: #DC2626;
        clip-path: polygon(50% 0%, 100% 25%, 50% 100%, 0% 25%);
    }

    .arm-left, .arm-right {
        width: 25px;
        height: 80px;
        background: #2563EB;
        position: absolute;
        top: 10px;
        border-radius: 12px;
        box-shadow: inset -4px -4px 8px rgba(0,0,0,0.15);
    }

    .arm-left {
        left: -15px;
        transform-origin: top;
        animation: wave-left 2s ease-in-out infinite;
    }

    .arm-right {
        right: -15px;
        transform-origin: top;
        animation: wave-right 2s ease-in-out infinite;
    }

    .hand-left, .hand-right {
        width: 25px;
        height: 25px;
        background: #FFD3B6;
        border-radius: 50%;
        position: absolute;
        bottom: -12px;
        box-shadow: inset -2px -2px 4px rgba(0,0,0,0.1);
    }

    .legs {
        position: relative;
        margin-top: -10px;
    }

    .leg-left, .leg-right {
        width: 25px;
        height: 80px;
        background: #1F2937;
        position: absolute;
        top: 0;
        border-radius: 12px;
        z-index: 0;
    }

    .leg-left {
        left: 25px;
        animation: walk-left 2s ease-in-out infinite;
    }

    .leg-right {
        right: 25px;
        animation: walk-right 2s ease-in-out infinite;
    }

    .foot-left, .foot-right {
        width: 35px;
        height: 15px;
        background: #111827;
        position: absolute;
        bottom: -10px;
        border-radius: 10px 15px 5px 5px;
    }

    .foot-left { left: 20px; }
    .foot-right { right: 20px; }

    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    @keyframes blink {
        0%, 90%, 100% { transform: scaleY(1); }
        95% { transform: scaleY(0.1); }
    }

    @keyframes wave-left {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(15deg); }
    }

    @keyframes wave-right {
        0%, 100% { transform: rotate(5deg); }
        50% { transform: rotate(-15deg); }
    }

    @keyframes walk-left {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
    }

    @keyframes walk-right {
        0%, 100% { transform: rotate(5deg); }
        50% { transform: rotate(-5deg); }
    }

    /* Click animations */
    .teacher.jumping {
        animation: jump 0.5s ease-in-out;
    }

    .teacher.spinning {
        animation: spin 1s ease-in-out;
    }

    .teacher.dancing {
        animation: dance 1s ease-in-out infinite;
    }

    @keyframes jump {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-50px) scale(1.1); }
    }

    @keyframes spin {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(0.8); }
        100% { transform: rotate(360deg) scale(1); }
    }

    @keyframes dance {
        0% { transform: rotate(0deg) translateY(0); }
        25% { transform: rotate(-15deg) translateY(-20px); }
        50% { transform: rotate(0deg) translateY(0); }
        75% { transform: rotate(15deg) translateY(-20px); }
        100% { transform: rotate(0deg) translateY(0); }
    }
`;

// Add the CSS to the document
const teacherStyle = document.createElement('style');
teacherStyle.textContent = teacherCSS;
document.head.appendChild(teacherStyle);

// Game state
let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;

// Winning combinations
const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.game-cell');
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(cell, index));
    });
});

function handleCellClick(cell, index) {
    if (gameBoard[index] !== '' || !gameActive) return;

    gameBoard[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());

    if (checkWinner()) {
        const status = document.getElementById('game-status');
        status.textContent = `Player ${currentPlayer} wins! 🎉`;
        status.classList.add('celebration');
        gameActive = false;
        highlightWinningCells();
        return;
    }

    if (gameBoard.every(cell => cell !== '')) {
        document.getElementById('game-status').textContent = "It's a tie! 🤝";
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('game-status').textContent = `Player ${currentPlayer}'s turn!`;

    // If it's O's turn, make AI move
    if (currentPlayer === 'O' && gameActive) {
        setTimeout(makeAIMove, 500);
    }
}

function makeAIMove() {
    // Simple AI: Find first empty cell
    const emptyIndexes = gameBoard.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    if (emptyIndexes.length > 0) {
        const randomIndex = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
        const cells = document.querySelectorAll('.game-cell');
        handleCellClick(cells[randomIndex], randomIndex);
    }
}

function checkWinner() {
    return winningCombos.some(combo => {
        return combo.every(index => {
            return gameBoard[index] === currentPlayer;
        });
    });
}

function highlightWinningCells() {
    winningCombos.forEach(combo => {
        if (combo.every(index => gameBoard[index] === currentPlayer)) {
            combo.forEach(index => {
                document.querySelectorAll('.game-cell')[index].classList.add('winner');
            });
        }
    });
}

function resetGame() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    
    const cells = document.querySelectorAll('.game-cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner');
    });

    const status = document.getElementById('game-status');
    status.textContent = "Your turn! (X)";
    status.classList.remove('celebration');
}

const tabsCSS = `
    .tab-button {
        color: #6B7280;
        border-bottom: 2px solid transparent;
        position: relative;
    }

    .tab-button:hover {
        color: #4F46E5;
    }

    .tab-button.active {
        color: #4F46E5;
    }

    .tab-indicator {
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background-color: #4F46E5;
        transition: width 0.3s ease;
    }

    .tab-button.active .tab-indicator {
        width: 100%;
    }

    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: block;
    }
`;

// Add the tabs CSS to the document
const tabsStyle = document.createElement('style');
tabsStyle.textContent = tabsCSS;
document.head.appendChild(tabsStyle);

// Add this near your other tab-related code
function saveCurrentTab(tabId) {
    localStorage.setItem('currentTab', tabId);
}

// Updated tab switching function
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Update tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.remove('hidden');
    selectedTab.classList.add('active');

    // Initialize content based on tab
    if (tabId === 'games') {
        initializeGames();
    } else if (tabId === 'dashboard') {
        learningStats.loadFromServer();
    } else if (tabId === 'game-of-life-tab' && !window.gameOfLife) {
        initializeGameOfLife();
    }

    // Save the current tab
    saveCurrentTab(tabId);
}

// View initialization
function initializeView(viewId) {
    switch(viewId) {
        case 'games':
            initializeGames();
            break;
        case 'dashboard':
            initializeDashboard();
            break;
        case 'life-path':
            initializeLifePath();
            break;
        // ... other views
    }
}

// Load required scripts dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function initializeGames() {
    try {
        await Promise.all([
            loadScript('/static/js/games/tic-tac-toe.js'),
            loadScript('/static/js/games/word-scramble.js'),
            loadScript('/static/js/games/math-quiz.js'),
            loadScript('/static/js/games/memory-match.js'),
            loadScript('/static/js/games/spelling-bee.js'),
            loadScript('/static/js/games/animal-quiz.js')
        ]);
        
        // Initialize each game
        initTicTacToe();
        initWordScramble();
        initMathQuiz();
        initMemoryMatch();
        initSpellingBee();
        initAnimalQuiz();
    } catch (error) {
        console.error('Error loading game scripts:', error);
    }
}

// Word Scramble Game
const words = [
    { word: 'LEARN', hint: 'Something you do at school' },
    { word: 'SCIENCE', hint: 'Study of nature and the world' },
    { word: 'MATH', hint: 'Numbers and calculations' },
    { word: 'BOOK', hint: 'Contains stories and information' },
    { word: 'PENCIL', hint: 'Used for writing' }
];

let currentWord = '';

function scrambleWord(word) {
    return word.split('').sort(() => Math.random() - 0.5).join('');
}

function newWord() {
    const wordObj = words[Math.floor(Math.random() * words.length)];
    currentWord = wordObj.word;
    document.getElementById('scrambled-word').textContent = scrambleWord(currentWord);
    document.getElementById('word-guess').value = '';
    document.querySelector('#word-guess + p')?.remove(); // Remove previous result
}

function checkWord() {
    const guess = document.getElementById('word-guess').value.toUpperCase();
    const resultElement = document.createElement('p');
    resultElement.className = 'mt-2 text-center font-bold spelling-result';
    
    if (guess === currentWord) {
        resultElement.className += ' text-green-600';
        resultElement.textContent = '🎉 Correct! Well done!';
        // Track game completion
        learningStats.gamesPlayed++;
        learningStats.saveToServer();
        learningStats.addActivity({
            type: 'game',
            description: 'Completed Word Scramble!'
        });
    } else {
        resultElement.className += ' text-red-600';
        resultElement.textContent = '❌ Try again!';
    }
    
    const guessInput = document.getElementById('word-guess');
    guessInput.parentNode.appendChild(resultElement);
}

// Math Quiz Game
function newMathProblem() {
    const num1 = Math.floor(Math.random() * 12) + 1;
    const num2 = Math.floor(Math.random() * 12) + 1;
    const operators = ['+', '-', 'x'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    document.getElementById('math-problem').textContent = `${num1} ${operator} ${num2} = ?`;
    document.getElementById('math-answer').value = '';
    document.querySelector('#math-answer + p')?.remove(); // Remove previous result
}

function checkMathAnswer() {
    const problem = document.getElementById('math-problem').textContent;
    const [num1, operator, num2] = problem.split(' ').filter(item => item !== '=' && item !== '?');
    
    let correctAnswer;
    switch(operator) {
        case '+': correctAnswer = parseInt(num1) + parseInt(num2); break;
        case '-': correctAnswer = parseInt(num1) - parseInt(num2); break;
        case 'x': correctAnswer = parseInt(num1) * parseInt(num2); break;
    }
    
    const userAnswer = parseInt(document.getElementById('math-answer').value);
    const resultElement = document.createElement('p');
    resultElement.className = 'mt-2 text-center';
    
    if (userAnswer === correctAnswer) {
        resultElement.className += ' text-green-600';
        resultElement.textContent = '🎉 Correct! Great job!';
        // Track game completion
        learningStats.gamesPlayed++;
        learningStats.saveToServer();
        learningStats.addActivity({
            type: 'game',
            description: 'Solved Math Problem!'
        });
    } else {
        resultElement.className += ' text-red-600';
        resultElement.textContent = `❌ Try again! The answer was ${correctAnswer}`;
    }
    
    const answerInput = document.getElementById('math-answer');
    answerInput.parentNode.appendChild(resultElement);
}

// Memory Match Game
const emojis = ['🌟', '🎈', '🎨', '🎭', '🎪', '🎠', '🎡'];
let flippedCards = [];
let matchedPairs = 0;
let memoryGameCards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

function startMemoryGame() {
    const gameBoard = document.getElementById('memory-game');
    if (!gameBoard) return;
    
    matchedPairs = 0;
    flippedCards = [];
    memoryGameCards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    
    gameBoard.innerHTML = memoryGameCards.map((emoji, index) => `
        <div class="memory-card" data-index="${index}" onclick="flipCard(${index})">
            <div class="memory-card-inner">
                <div class="memory-card-front">❓</div>
                <div class="memory-card-back">${emoji}</div>
            </div>
        </div>
    `).join('');
}

function flipCard(index) {
    const card = document.querySelector(`[data-index="${index}"]`);
    if (flippedCards.length < 2 && !flippedCards.includes(index) && !card.classList.contains('matched')) {
        card.classList.add('flipped');
        flippedCards.push(index);
        
        if (flippedCards.length === 2) {
            setTimeout(checkMatch, 1000);
        }
    }
}

function checkMatch() {
    const [first, second] = flippedCards;
    const match = memoryGameCards[first] === memoryGameCards[second];
    
    if (match) {
        document.querySelectorAll(`[data-index="${first}"], [data-index="${second}"]`)
            .forEach(card => card.classList.add('matched'));
        matchedPairs++;
        
        if (matchedPairs === emojis.length) {
            setTimeout(() => alert('Congratulations! You won! 🎉'), 500);
        }
    } else {
        document.querySelectorAll(`[data-index="${first}"], [data-index="${second}"]`)
            .forEach(card => card.classList.remove('flipped'));
    }
    
    flippedCards = [];
}

// Spelling Bee Game
const spellingWords = [
    { word: 'elephant', hint: 'A large gray animal with a trunk' },
    { word: 'butterfly', hint: 'A beautiful insect with colorful wings' },
    { word: 'rainbow', hint: 'A colorful arch in the sky after rain' },
    // Add more words as needed
];

let currentSpellingWord = null;

function newSpellingWord() {
    const hintElement = document.getElementById('spelling-hint');
    const inputElement = document.getElementById('spelling-input');
    if (!hintElement || !inputElement) return;
    
    currentSpellingWord = spellingWords[Math.floor(Math.random() * spellingWords.length)];
    hintElement.textContent = currentSpellingWord.hint;
    inputElement.value = '';
}

function speakWord() {
    if (currentSpellingWord) {
        const utterance = new SpeechSynthesisUtterance(currentSpellingWord.word);
        window.speechSynthesis.speak(utterance);
    }
}

function checkSpelling() {
    const input = document.getElementById('spelling-input').value.toLowerCase();
    if (input === currentSpellingWord.word) {
        alert('Correct! 🎉');
        newSpellingWord();
    } else {
        alert('Try again! 🤔');
    }
}

// Animal Quiz Game
const animals = [
    { name: 'Lion', image: 'lion.jpg', fact: 'Lions are the only cats that live in groups.' },
    { name: 'Elephant', image: 'elephant.jpg', fact: 'Elephants are the largest land animals.' },
    { name: 'Penguin', image: 'penguin.jpg', fact: 'Penguins can swim up to 22 mph!' },
    // Add more animals
];

let currentAnimal = null;
let score = 0;

function nextAnimal() {
    const imageElement = document.getElementById('animal-image');
    const optionsElement = document.getElementById('animal-options');
    if (!imageElement || !optionsElement) return;
    
    currentAnimal = animals[Math.floor(Math.random() * animals.length)];
    const options = generateOptions(currentAnimal.name);
    
    imageElement.src = currentAnimal.image;
    optionsElement.innerHTML = options.map(option => `
        <button onclick="checkAnimal('${option}')" 
                class="animal-option bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            ${option}
        </button>
    `).join('');
    
    const factElement = document.getElementById('animal-fact');
    if (factElement) {
        factElement.textContent = '';
    }
}

function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)].name;
        if (!options.includes(randomAnimal)) {
            options.push(randomAnimal);
        }
    }
    return options.sort(() => Math.random() - 0.5);
}

function checkAnimal(answer) {
    const isCorrect = answer === currentAnimal.name;
    if (isCorrect) {
        score++;
        document.getElementById('animal-score').textContent = `Score: ${score}`;
    }
    document.getElementById('animal-fact').textContent = currentAnimal.fact;
    setTimeout(nextAnimal, 2000);
}

// Learning Dashboard Management
const learningStats = {
    topicsExplored: 0,
    gamesPlayed: 0,
    streakDays: 0,
    activities: [],
    
    // Add achievements configuration
    achievements: [
        {
            id: 'first-game',
            title: 'Game Pioneer',
            description: 'Played your first game',
            icon: '🎮',
            condition: (stats) => stats.gamesPlayed >= 1,
            backgroundColor: 'bg-blue-100'
        },
        {
            id: 'game-master',
            title: 'Game Master',
            description: 'Played 5 games',
            icon: '🏆',
            condition: (stats) => stats.gamesPlayed >= 5,
            backgroundColor: 'bg-purple-100'
        },
        {
            id: 'first-topic',
            title: 'Curious Mind',
            description: 'Explored your first topic',
            icon: '📚',
            condition: (stats) => stats.topicsExplored >= 1,
            backgroundColor: 'bg-green-100'
        },
        {
            id: 'explorer',
            title: 'Knowledge Explorer',
            description: 'Explored 5 topics',
            icon: '🔭',
            condition: (stats) => stats.topicsExplored >= 5,
            backgroundColor: 'bg-yellow-100'
        },
        {
            id: 'streak-starter',
            title: 'Streak Starter',
            description: 'Started your learning streak',
            icon: '🔥',
            condition: (stats) => stats.streakDays >= 1,
            backgroundColor: 'bg-orange-100'
        },
        {
            id: 'consistent-learner',
            title: 'Consistent Learner',
            description: '3-day learning streak',
            icon: '⚡',
            condition: (stats) => stats.streakDays >= 3,
            backgroundColor: 'bg-red-100'
        },
        {
            id: 'quick-learner',
            title: 'Quick Learner',
            description: 'Completed 3 activities in one day',
            icon: '🚀',
            condition: (stats) => {
                const todayActivities = stats.activities.filter(activity => {
                    const activityDate = new Date(activity.timestamp).toDateString();
                    return activityDate === new Date().toDateString();
                });
                return todayActivities.length >= 3;
            },
            backgroundColor: 'bg-indigo-100'
        },
        {
            id: 'all-rounder',
            title: 'All-Rounder',
            description: 'Tried both games and topics',
            icon: '🌟',
            condition: (stats) => stats.gamesPlayed >= 1 && stats.topicsExplored >= 1,
            backgroundColor: 'bg-pink-100'
        }
    ],

    async loadFromServer() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to load stats');
            }
            const stats = await response.json();
            this.topicsExplored = stats.topics_explored;
            this.gamesPlayed = stats.games_played;
            this.streakDays = stats.streak_days;
            this.activities = stats.activities || [];
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },
    
    async saveToServer() {
        try {
            console.log('Saving stats:', {
                topics_explored: this.topicsExplored,
                games_played: this.gamesPlayed,
                update_streak: true  // Add this flag to trigger streak update
            });
            
            const response = await fetch('/api/stats/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topics_explored: this.topicsExplored,
                    games_played: this.gamesPlayed,
                    update_streak: true  // Add this to the request
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }
            
            const stats = await response.json();
            console.log('Received updated stats:', stats);
            this.updateFromStats(stats);
        } catch (error) {
            console.error('Error saving stats:', error);
            console.error('Full error details:', {
                message: error.message,
                stack: error.stack
            });
        }
    },
    
    async addActivity(activity) {
        try {
            console.log('Adding activity:', activity);
            
            const response = await fetch('/api/stats/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ activity: {
                    type: activity.type,
                    description: activity.description,
                    timestamp: new Date().toISOString()
                }})
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const stats = await response.json();
            console.log('Received updated stats after activity:', stats);
            this.updateFromStats(stats);
        } catch (error) {
            console.error('Error adding activity:', error);
            alert('Failed to save activity. Please try again.');
        }
    },

    updateFromStats(stats) {
        this.topicsExplored = stats.topics_explored;
        this.gamesPlayed = stats.games_played;
        this.streakDays = stats.streak_days;
        this.activities = stats.activities || [];
        this.updateDisplay();
    },
    
    updateDisplay() {
        // Update the corner progress tracker
        document.getElementById('topics-count').textContent = this.topicsExplored;
        document.getElementById('games-count').textContent = this.gamesPlayed;
        document.getElementById('streak-count').textContent = `${this.streakDays} day${this.streakDays !== 1 ? 's' : ''}`;

        // Update the progress tab displays
        const topicsExploredElement = document.getElementById('topics-explored');
        const gamesPlayedElement = document.getElementById('games-played');
        const streakElement = document.getElementById('learning-streak');

        if (topicsExploredElement) {
            topicsExploredElement.textContent = this.topicsExplored;
        }
        if (gamesPlayedElement) {
            gamesPlayedElement.textContent = this.gamesPlayed;
        }
        if (streakElement) {
            streakElement.textContent = `${this.streakDays} days`;
        }

        // Update achievements
        const achievementsGrid = document.getElementById('achievements-grid');
        if (achievementsGrid) {
            const earnedAchievements = this.achievements.filter(achievement => 
                achievement.condition(this)
            );

            achievementsGrid.innerHTML = this.achievements.map(achievement => {
                const isEarned = achievement.condition(this);
                return `
                    <div class="relative group">
                        <div class="achievement-badge ${isEarned ? achievement.backgroundColor : 'bg-gray-100'} 
                                    p-4 rounded-lg text-center transition-transform transform 
                                    ${isEarned ? 'hover:scale-105' : 'opacity-50'} cursor-help">
                            <div class="text-3xl mb-2">${achievement.icon}</div>
                            <div class="font-bold text-sm ${isEarned ? '' : 'text-gray-500'}">${achievement.title}</div>
                        </div>
                        <div class="achievement-tooltip opacity-0 group-hover:opacity-100 
                                    absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                                    px-3 py-2 bg-gray-900 text-white text-sm rounded-lg 
                                    whitespace-nowrap pointer-events-none transition-opacity">
                            ${achievement.description}
                            ${!isEarned ? '<br><span class="text-gray-300">Not earned yet</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Update recent activity
        const activityContainer = document.getElementById('recent-activity');
        if (activityContainer && this.activities.length > 0) {
            activityContainer.innerHTML = this.activities.map(activity => `
                <div class="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                    <div class="bg-blue-100 p-2 rounded-full">
                        ${activity.type === 'topic' ? '📚' : '🎮'}
                    </div>
                    <div class="flex-1">
                        <div class="font-bold">${activity.description}</div>
                        <div class="text-sm text-gray-600">${this.formatTimeAgo(new Date(activity.timestamp))}</div>
                    </div>
                </div>
            `).join('');
        } else if (activityContainer) {
            activityContainer.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    No activities yet. Start exploring and playing games!
                </div>
            `;
        }
    },
    
    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
};

// Update the streak animation CSS
const streakCSS = `
    @keyframes streak-pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }

    .streak-update {
        animation: streak-pulse 1s ease-in-out;
        color: #FF6B6B;
        text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
    }
`;

const streakStyle = document.createElement('style');
streakStyle.textContent = streakCSS;
document.head.appendChild(streakStyle);

// Add achievement animation CSS
const achievementCSS = `
    .achievement-badge {
        transition: all 0.3s ease;
    }

    .achievement-tooltip {
        z-index: 50;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .achievement-badge.earned {
        animation: achievementEarned 0.5s ease-out;
    }

    @keyframes achievementEarned {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;

const achievementStyle = document.createElement('style');
achievementStyle.textContent = achievementCSS;
document.head.appendChild(achievementStyle);

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await learningStats.loadFromServer();
});

// Career paths database with all permutations
const careerPaths = {
    categories: {
        STEM: {
            icon: '🔬',
            description: 'Science, Technology, Engineering, and Mathematics'
        },
        CREATIVE: {
            icon: '🎨',
            description: 'Arts, Design, and Creative Expression'
        },
        SOCIAL: {
            icon: '🤝',
            description: 'Working with and Helping People'
        },
        NATURE: {
            icon: '🌿',
            description: 'Environment and Natural World'
        },
        BUSINESS: {
            icon: '💼',
            description: 'Business and Enterprise'
        }
    },

    getCareersByPreferences(interests, subjects, stressLevel) {
        // Create a weighted scoring system for each career based on preferences
        return this.careers.filter(career => {
            const interestMatch = career.interests.some(i => interests.includes(i));
            const subjectMatch = career.subjects.some(s => subjects.includes(s));
            const stressMatch = career.stressLevels.includes(stressLevel);
            return interestMatch && subjectMatch && stressMatch;
        }).sort((a, b) => {
            // Sort by how well they match the preferences
            const aScore = this.calculateMatchScore(a, interests, subjects, stressLevel);
            const bScore = this.calculateMatchScore(b, interests, subjects, stressLevel);
            return bScore - aScore;
        }).slice(0, 5); // Return top 5 matches
    },

    calculateMatchScore(career, interests, subjects, stressLevel) {
        let score = 0;
        // Interest matches
        score += career.interests.filter(i => interests.includes(i)).length * 3;
        // Subject matches
        score += career.subjects.filter(s => subjects.includes(s)).length * 2;
        // Stress level match
        score += career.stressLevels.includes(stressLevel) ? 1 : 0;
        return score;
    },

    careers: [
        // STEM Careers
        {
            title: "Robotics Engineer",
            category: "STEM",
            description: "Design and build robots and robotic systems",
            interests: ["Technical", "Creative"],
            subjects: ["Math", "Science"],
            stressLevels: ["Medium", "High"],
            requirements: {
                highSchool: {
                    gpa: "3.5+",
                    courses: ["AP Physics", "AP Calculus", "Computer Science"],
                    activities: ["Robotics Club", "Science Olympiad", "Programming Club"]
                }
            },
            education: ["Bachelor's in Robotics Engineering", "Master's recommended"],
            skills: ["Programming", "Electronics", "Problem Solving"],
            certifications: ["Professional Engineer (PE)", "ROS Developer"],
            progression: {
                entryLevel: {
                    salary: 75000,
                    years: "0-2"
                },
                midLevel: {
                    salary: 110000,
                    years: "3-5"
                },
                seniorLevel: {
                    salary: 150000,
                    years: "6-10"
                },
                expertLevel: {
                    salary: 200000,
                    years: "10+"
                }
            },
            workEnvironment: {
                hours: 40,
                location: "Lab/Office",
            },
            funFact: "Some robotics engineers work on Mars rovers! 🚀",
            futureOutlook: "Growing rapidly",
            growthRate: "15% annually"
        },
        {
            title: "Data Scientist",
            category: "STEM",
            description: "Analyze complex data to help make decisions",
            interests: ["Technical", "Creative"],
            subjects: ["Math", "Science"],
            stressLevels: ["Medium"],
            requirements: {
                highSchool: {
                    gpa: "3.5+",
                    courses: ["AP Statistics", "AP Computer Science", "Calculus"],
                    activities: ["Math Club", "Coding Club", "Science Fair"]
                }
            },
            education: ["Bachelor's in Statistics", "Master's in Data Science"],
            skills: ["Programming", "Statistics", "Machine Learning"],
            certifications: ["AWS Certified Data Analytics", "TensorFlow Developer"],
            progression: {
                entryLevel: {
                    salary: 85000,
                    years: "0-2"
                },
                midLevel: {
                    salary: 120000,
                    years: "3-5"
                },
                seniorLevel: {
                    salary: 160000,
                    years: "6-8"
                },
                expertLevel: {
                    salary: 200000,
                    years: "8+"
                }
            },
            workEnvironment: {
                hours: 40,
                location: "Office/Remote",
            },
            funFact: "Data scientists can predict weather patterns! 🌦️",
            futureOutlook: "Very High Demand",
            growthRate: "22% annually"
        },
        // Creative Careers
        {
            title: "Game Designer",
            category: "CREATIVE",
            description: "Create engaging video games and interactive experiences",
            interests: ["Creative", "Technical"],
            subjects: ["Art", "Math"],
            stressLevels: ["Medium", "High"],
            requirements: {
                highSchool: {
                    gpa: "3.2+",
                    courses: ["Computer Science", "Art", "Creative Writing"],
                    activities: ["Game Development Club", "Digital Arts", "Programming"]
                }
            },
            education: ["Bachelor's in Game Design", "Computer Science"],
            skills: ["Game Development", "Storytelling", "Programming"],
            certifications: ["Unity Certified Developer", "Unreal Engine Certification"],
            progression: {
                entryLevel: {
                    salary: 60000,
                    years: "0-2"
                },
                midLevel: {
                    salary: 85000,
                    years: "3-5"
                },
                seniorLevel: {
                    salary: 120000,
                    years: "6-10"
                },
                expertLevel: {
                    salary: 150000,
                    years: "10+"
                }
            },
            workEnvironment: {
                hours: 45,
                location: "Studio",
            },
            funFact: "Some games take over 5 years to make! 🎮",
            futureOutlook: "Growing",
            growthRate: "10% annually"
        },
        // Nature-focused Careers
        {
            title: "Marine Biologist",
            category: "NATURE",
            description: "Study ocean life and marine ecosystems",
            interests: ["Nature", "Technical"],
            subjects: ["Science", "Math"],
            stressLevels: ["Low", "Medium"],
            education: ["Bachelor's in Marine Biology", "Master's recommended"],
            skills: ["Research", "Diving", "Data Analysis"],
            funFact: "Marine biologists can discover new species! 🐋",
            salary: "💰💰",
            futureOutlook: "Stable",
            dailyTasks: [
                "Conduct ocean research",
                "Study marine life",
                "Protect marine ecosystems"
            ]
        },
        // More STEM Careers
        {
            title: "AI Research Scientist",
            category: "STEM",
            description: "Develop and research artificial intelligence systems",
            interests: ["Technical", "Creative"],
            subjects: ["Math", "Science"],
            stressLevels: ["Medium", "High"],
            education: ["PhD in Computer Science", "Machine Learning"],
            skills: ["Deep Learning", "Mathematics", "Research"],
            funFact: "AI can now create art and music! 🎨",
            salary: "💰💰💰💰",
            futureOutlook: "Rapidly Growing",
            dailyTasks: [
                "Design AI algorithms",
                "Conduct experiments",
                "Write research papers"
            ]
        },
        {
            title: "Biomedical Engineer",
            category: "STEM",
            description: "Design medical devices and equipment",
            interests: ["Technical", "Social"],
            subjects: ["Science", "Math"],
            stressLevels: ["Medium"],
            education: ["Bachelor's in Biomedical Engineering"],
            skills: ["Medical Technology", "Design", "Problem Solving"],
            funFact: "Biomedical engineers helped create artificial hearts! ❤️",
            salary: "💰💰💰",
            futureOutlook: "High Growth",
            dailyTasks: [
                "Design medical devices",
                "Test equipment safety",
                "Work with doctors"
            ]
        },

        // More Creative Careers
        {
            title: "Digital Artist",
            category: "CREATIVE",
            description: "Create digital artwork for games, movies, and media",
            interests: ["Creative", "Technical"],
            subjects: ["Art"],
            stressLevels: ["Low", "Medium"],
            education: ["Bachelor's in Digital Arts", "Animation"],
            skills: ["Digital Drawing", "3D Modeling", "Animation"],
            funFact: "Digital artists can create entire virtual worlds! 🌍",
            salary: "💰💰",
            futureOutlook: "Growing",
            dailyTasks: [
                "Create digital illustrations",
                "Design characters",
                "Animate scenes"
            ]
        },
        {
            title: "Music Producer",
            category: "CREATIVE",
            description: "Create and produce music",
            interests: ["Creative", "Technical"],
            subjects: ["Art", "Math"],
            stressLevels: ["Medium"],
            education: ["Music Production", "Audio Engineering"],
            skills: ["Music Theory", "Audio Software", "Sound Design"],
            funFact: "Some songs use sounds from space! 🎵",
            salary: "💰💰",
            futureOutlook: "Stable",
            dailyTasks: [
                "Mix audio tracks",
                "Work with artists",
                "Create beats"
            ]
        },

        // Social Careers
        {
            title: "Child Psychologist",
            category: "SOCIAL",
            description: "Help children with emotional and behavioral development",
            interests: ["Social", "Technical"],
            subjects: ["Science", "Language"],
            stressLevels: ["Medium"],
            education: ["PhD in Psychology", "Child Development"],
            skills: ["Counseling", "Assessment", "Communication"],
            funFact: "Play therapy helps kids express feelings! 🎈",
            salary: "💰💰💰",
            futureOutlook: "High Demand",
            dailyTasks: [
                "Counsel children",
                "Work with families",
                "Conduct assessments"
            ]
        },
        {
            title: "Teacher",
            category: "SOCIAL",
            description: "Educate and inspire students",
            interests: ["Social", "Creative"],
            subjects: ["Language", "History", "Math", "Science"],
            stressLevels: ["Medium", "High"],
            education: ["Bachelor's in Education", "Teaching Certificate"],
            skills: ["Communication", "Organization", "Patience"],
            funFact: "Teachers influence over 3000 students in their career! 📚",
            salary: "💰💰",
            futureOutlook: "Stable",
            dailyTasks: [
                "Plan lessons",
                "Teach classes",
                "Grade assignments"
            ]
        },

        // More Nature Careers
        {
            title: "Wildlife Photographer",
            category: "NATURE",
            description: "Photograph wildlife and nature",
            interests: ["Nature", "Creative"],
            subjects: ["Art", "Science"],
            stressLevels: ["Low", "Medium"],
            education: ["Photography", "Biology helpful"],
            skills: ["Photography", "Animal Behavior", "Patience"],
            funFact: "Some wait days for the perfect shot! 📸",
            salary: "💰💰",
            futureOutlook: "Competitive",
            dailyTasks: [
                "Track wildlife",
                "Take photos",
                "Edit images"
            ]
        },

        // High Income - Technical/Math Focus ($1M+ potential)
        {
            title: "Hedge Fund Manager",
            category: "BUSINESS",
            description: "Manage investment portfolios and complex financial strategies",
            interests: ["Technical", "Creative"],
            subjects: ["Math", "Science"],
            stressLevels: ["High"],
            requirements: {
                highSchool: {
                    gpa: "4.0",
                    courses: ["AP Calculus BC", "AP Statistics", "AP Economics"],
                    activities: ["Investment Club", "Math Team", "Debate"]
                }
            },
            education: ["Bachelor's in Mathematics/Economics", "MBA from Top School", "CFA"],
            skills: ["Quantitative Analysis", "Risk Management", "Financial Modeling"],
            certifications: ["CFA", "Series 7", "Series 63"],
            progression: {
                entryLevel: {
                    salary: 150000,
                    years: "0-2"
                },
                midLevel: {
                    salary: 400000,
                    years: "3-5"
                },
                seniorLevel: {
                    salary: 1000000,
                    years: "6-10"
                },
                expertLevel: {
                    salary: 5000000,
                    years: "10+"
                }
            },
            workEnvironment: {
                hours: 70,
                location: "Office/Trading Floor"
            },
            funFact: "Top hedge fund managers can earn over $1 billion in a single year! 💰",
            futureOutlook: "Highly Competitive",
            growthRate: "10% annually"
        },

        // High Income - Creative/Technical Mix ($500k+ potential)
        {
            title: "Tech Startup Founder",
            category: "BUSINESS",
            description: "Create and grow innovative technology companies",
            interests: ["Creative", "Technical"],
            subjects: ["Math", "Science", "Art"],
            stressLevels: ["High"],
            requirements: {
                highSchool: {
                    gpa: "3.8+",
                    courses: ["AP Computer Science", "Business", "Psychology"],
                    activities: ["Entrepreneurship Club", "Coding Projects", "Leadership Roles"]
                }
            },
            education: ["Bachelor's in Computer Science or Business", "MBA advantageous"],
            skills: ["Programming", "Leadership", "Business Strategy", "Innovation"],
            certifications: ["Project Management", "Tech Certifications"],
            progression: {
                entryLevel: {
                    salary: 100000,
                    years: "0-2"
                },
                midLevel: {
                    salary: 250000,
                    years: "3-5"
                },
                seniorLevel: {
                    salary: 500000,
                    years: "6-8"
                },
                expertLevel: {
                    salary: 2000000,
                    years: "8+"
                }
            },
            workEnvironment: {
                hours: 80,
                location: "Office/Remote"
            },
            funFact: "The average age of successful startup founders is 45! 🚀",
            futureOutlook: "Highly Variable",
            growthRate: "Exponential Potential"
        },

        // High Income - Social/Creative Focus ($250k+ potential)
        {
            title: "High-End Plastic Surgeon",
            category: "MEDICAL",
            description: "Perform cosmetic and reconstructive surgery",
            interests: ["Social", "Technical", "Creative"],
            subjects: ["Science", "Art"],
            stressLevels: ["High"],
            requirements: {
                highSchool: {
                    gpa: "4.0",
                    courses: ["AP Biology", "AP Chemistry", "Art"],
                    activities: ["Pre-med Programs", "Art Classes", "Volunteer at Hospitals"]
                }
            },
            education: [
                "Bachelor's in Pre-med",
                "Medical School (MD)",
                "Plastic Surgery Residency (6 years)",
                "Fellowship in Specialized Area"
            ],
            skills: ["Surgical Expertise", "Artistic Vision", "Patient Care"],
            certifications: ["Board Certified Plastic Surgeon", "Specialized Certifications"],
            progression: {
                entryLevel: {
                    salary: 300000,
                    years: "0-2"
                },
                midLevel: {
                    salary: 500000,
                    years: "3-5"
                },
                seniorLevel: {
                    salary: 800000,
                    years: "6-10"
                },
                expertLevel: {
                    salary: 1500000,
                    years: "10+"
                }
            },
            workEnvironment: {
                hours: 55,
                location: "Private Practice/Hospital"
            },
            funFact: "Plastic surgeons train for an average of 14 years after high school! 🏥",
            futureOutlook: "Consistently Growing",
            growthRate: "15% annually"
        },
        // ULTRA HIGH INCOME ($5M+)
        {
            title: "Global Investment Firm CEO",
            category: "BUSINESS",
            description: "Lead a major global investment management firm",
            interests: ["Technical", "Social"],
            subjects: ["Math", "Economics"],
            stressLevels: ["High"],
            requirements: {
                highSchool: {
                    gpa: "4.0",
                    courses: ["AP Calculus BC", "AP Economics", "AP Statistics"],
                    activities: ["Investment Club President", "Debate Team", "Student Government"]
                }
            },
            education: [
                "Bachelor's in Economics/Mathematics from Top University",
                "MBA from Elite Business School",
                "CFA Charter"
            ],
            skills: ["Leadership", "Financial Strategy", "Risk Management"],
            certifications: ["CFA", "Series 7", "Series 63", "Series 24"],
            progression: {
                entryLevel: {
                    salary: 200000,
                    years: "0-2"
                },
                midLevel: {
                    salary: 500000,
                    years: "3-5"
                },
                seniorLevel: {
                    salary: 2000000,
                    years: "6-10"
                },
                expertLevel: {
                    salary: 10000000,
                    years: "10+"
                }
            },
            workEnvironment: {
                hours: 80,
                location: "Global Offices"
            },
            funFact: "Top CEOs often make more in a day than the average person makes in a year! 💼",
            futureOutlook: "Highly Competitive",
            growthRate: "Top 1% of earners"
        },
        {
            title: "Professional Sports Team Owner",
            category: "BUSINESS",
            description: "Own and operate professional sports franchises",
            interests: ["Business", "Social", "Creative"],
            subjects: ["Math", "Business", "Psychology"],
            stressLevels: ["High"],
            requirements: {
                highSchool: {
                    gpa: "3.8+",
                    courses: ["Business", "Economics", "Statistics"],
                    activities: ["Sports Management", "Business Club", "Team Sports"]
                }
            },
            education: [
                "Bachelor's in Business Administration",
                "MBA or Sports Management degree",
                "Significant business success required"
            ],
            skills: ["Business Strategy", "Negotiation", "Sports Management"],
            certifications: ["Sports Management", "Business Leadership"],
            progression: {
                entryLevel: {
                    salary: 500000,
                    years: "0-5"
                },
                midLevel: {
                    salary: 2000000,
                    years: "5-10"
                },
                seniorLevel: {
                    salary: 5000000,
                    years: "10-15"
                },
                expertLevel: {
                    salary: 20000000,
                    years: "15+"
                }
            },
            workEnvironment: {
                hours: 60,
                location: "Multiple Locations"
            },
            funFact: "Some sports team owners see their franchise value increase by billions! 🏆",
            futureOutlook: "Limited Opportunities",
            growthRate: "Franchise dependent"
        },

        // VERY HIGH INCOME ($1M-$5M)
        {
            title: "Quantum Computing Entrepreneur",
            category: "TECH",
            description: "Found and lead quantum computing companies",
            interests: ["Technical", "Creative"],
            subjects: ["Physics", "Math", "Computer Science"],
            stressLevels: ["High"],
            requirements: {
                highSchool: {
                    gpa: "4.0",
                    courses: ["AP Physics", "AP Computer Science", "Advanced Math"],
                    activities: ["Physics Club", "Programming Competitions", "Research Projects"]
                }
            },
            education: [
                "PhD in Quantum Physics/Computing",
                "Post-doctoral research",
                "Business education recommended"
            ],
            skills: ["Quantum Mechanics", "Programming", "Business Development"],
            certifications: ["Quantum Computing Specializations", "Tech Patents"],
            progression: {
                entryLevel: {
                    salary: 150000,
                    years: "0-3"
                },
                midLevel: {
                    salary: 400000,
                    years: "4-7"
                },
                seniorLevel: {
                    salary: 1000000,
                    years: "8-12"
                },
                expertLevel: {
                    salary: 3000000,
                    years: "12+"
                }
            },
            workEnvironment: {
                hours: 70,
                location: "Research Labs/Offices"
            },
            funFact: "Quantum computing could revolutionize everything from medicine to space travel! 🌌",
            futureOutlook: "Exponential Growth",
            growthRate: "30% annually"
        }
        // Would you like me to continue with more permutations?
    ]
};

function analyzePath() {
    try {
        const interests = Array.from(document.getElementById('interests').selectedOptions).map(opt => opt.value);
        const subjects = Array.from(document.getElementById('subjects').selectedOptions).map(opt => opt.value);
        const stress = document.getElementById('stress').value;
        const workHours = parseInt(document.getElementById('work-hours').value);
        const incomeGoal = parseInt(document.getElementById('income-goal').value);
        const location = document.getElementById('location').value;

        if (interests.length === 0 || subjects.length === 0) {
            alert('Please select at least one interest and one subject!');
            return;
        }

        const preferences = {
            interests,
            subjects,
            stress,
            workHours,
            incomeGoal,
            location
        };

        const matches = careerPaths.getCareersByPreferences(interests, subjects, stress);
        
        // Filter matches by work hours and income
        const filteredMatches = matches.filter(career => {
            // Check if career has progression data
            if (!career.progression) return false;

            // Match based on expert level salary
            const expertSalary = career.progression.expertLevel.salary;
            const salaryMatch = 
                incomeGoal >= 5000000 ? expertSalary >= 5000000 :  // $5M+
                incomeGoal >= 1000000 ? expertSalary >= 1000000 :  // $1M+
                incomeGoal >= 500000 ? expertSalary >= 500000 :    // $500K+
                incomeGoal >= 250000 ? expertSalary >= 250000 :    // $250K+
                true;                                              // Any salary
            
            // Match based on work hours and stress level
            const hoursMatch = workHours <= 40 ? 
                career.stressLevels.includes('Low') || career.stressLevels.includes('Medium') :
                workHours <= 60 ? 
                    career.stressLevels.includes('Medium') || career.stressLevels.includes('High') :
                    career.stressLevels.includes('High');
            
            return salaryMatch && hoursMatch;
        });

        displayResults(filteredMatches);
        
        // Scroll to results
        document.getElementById('career-results').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error analyzing career path:', error);
        alert('Something went wrong. Please try again!');
    }
}

function findMatchingCareers(preferences) {
    return careerPaths.careers.filter(career => {
        // Add your matching logic here
        // This is a basic example - adjust based on your needs
        const stressMatch = career.stressLevels.includes(preferences.stress);
        // Add more matching criteria as needed
        return stressMatch;
    });
}

// Add this helper function for calculating cumulative earnings
function calculateCumulativeEarnings(progression) {
    const earnings = {
        fiveYear: 0,
        tenYear: 0,
        twentyYear: 0,
        lifetime: 0
    };
    
    // Calculate 5-year earnings
    earnings.fiveYear = (progression.entryLevel.salary * 2) + // First 2 years
                       (progression.midLevel.salary * 3);      // Next 3 years
    
    // Calculate 10-year earnings
    earnings.tenYear = earnings.fiveYear +
                      (progression.midLevel.salary * 2) +     // 2 more mid-level years
                      (progression.seniorLevel.salary * 3);   // 3 senior years
    
    // Calculate 20-year earnings
    earnings.twentyYear = earnings.tenYear +
                         (progression.seniorLevel.salary * 5) +  // 5 more senior years
                         (progression.expertLevel.salary * 5);   // 5 expert years
    
    // Calculate lifetime earnings (40-year career)
    earnings.lifetime = earnings.twentyYear +
                       (progression.expertLevel.salary * 20);    // 20 more expert years
    
    return earnings;
}

// Add this helper function to calculate yearly earnings
function calculateYearlyEarnings(progression) {
    const yearlyEarnings = [];
    let currentYear = 1;
    
    // Entry Level (Years 1-2)
    for (let i = 0; i < 2; i++) {
        yearlyEarnings.push({
            year: currentYear++,
            salary: progression.entryLevel.salary,
            level: 'Entry Level'
        });
    }
    
    // Mid Level (Years 3-5)
    for (let i = 0; i < 3; i++) {
        yearlyEarnings.push({
            year: currentYear++,
            salary: progression.midLevel.salary,
            level: 'Mid Level'
        });
    }
    
    // Senior Level (Years 6-10)
    for (let i = 0; i < 5; i++) {
        yearlyEarnings.push({
            year: currentYear++,
            salary: progression.seniorLevel.salary,
            level: 'Senior Level'
        });
    }
    
    // Expert Level (Years 11+)
    for (let i = 0; i < 5; i++) { // Show next 5 years of expert level
        yearlyEarnings.push({
            year: currentYear++,
            salary: progression.expertLevel.salary,
            level: 'Expert Level'
        });
    }
    
    return yearlyEarnings;
}

// Update the Career Progression section in the template
function displayResults(matches) {
    const resultsContainer = document.getElementById('career-results');
    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }

    if (matches.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center p-4">
                <p class="text-gray-600">No exact matches found. Try adjusting your preferences!</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = matches.map(career => {
        // Add safety checks for all properties with default values
        const requirements = career.requirements || {
            highSchool: {
                gpa: 'Not specified',
                courses: ['General education courses'],
                activities: ['Relevant extracurriculars']
            }
        };
        
        const progression = career.progression || {
            entryLevel: { salary: 'Varies', years: '0-2' },
            midLevel: { salary: 'Varies', years: '3-5' },
            seniorLevel: { salary: 'Varies', years: '6-10' },
            expertLevel: { salary: 'Varies', years: '10+' }
        };
        
        const workEnvironment = career.workEnvironment || {
            hours: 'Flexible',
            location: 'Varies'
        };

        // Format salary display with safety check
        const formatSalary = (salary) => {
            return typeof salary === 'number' 
                ? `$${salary.toLocaleString()}/year`
                : salary;
        };

        // Update the Career Progression & Earnings section
        return `
            <div class="bg-white rounded-lg shadow-lg p-6 mb-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-2xl font-bold text-indigo-600">${career.title}</h3>
                    <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                        ${career.category}
                    </span>
                </div>
                
                <div class="text-gray-600 mb-6">${career.description}</div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <!-- Education Requirements -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-bold text-lg mb-2">Education Path 🎓</h4>
                        <div class="space-y-3">
                            <div>
                                <h5 class="font-semibold text-indigo-600">High School</h5>
                                <ul class="list-disc list-inside text-sm">
                                    <li>Minimum GPA: ${requirements.highSchool.gpa}</li>
                                    <li>Key Courses: ${requirements.highSchool.courses.join(', ') || 'N/A'}</li>
                                    <li>Recommended Activities: ${requirements.highSchool.activities.join(', ') || 'N/A'}</li>
                                </ul>
                            </div>
                            <div>
                                <h5 class="font-semibold text-indigo-600">College/University</h5>
                                <ul class="list-disc list-inside text-sm">
                                    ${career.education.map(edu => `<li>${edu}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Skills & Certifications -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-bold text-lg mb-2">Required Skills 🎯</h4>
                        <ul class="list-disc list-inside text-sm">
                            ${career.skills.map(skill => `<li>${skill}</li>`).join('')}
                        </ul>
                        ${career.certifications ? `
                            <h5 class="font-semibold text-indigo-600 mt-3">Certifications</h5>
                            <ul class="list-disc list-inside text-sm">
                                ${career.certifications.map(cert => `<li>${cert}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                </div>

                <!-- Career Progression & Earnings -->
                <div class="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 class="font-bold text-lg mb-3">Career Progression & Earnings 📈</h4>
                    
                    <!-- Progression Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-white p-3 rounded shadow-sm">
                            <h5 class="font-semibold text-indigo-600">Entry Level</h5>
                            <p class="text-sm">${formatSalary(progression.entryLevel.salary)}</p>
                            <p class="text-xs text-gray-600">${progression.entryLevel.years} years</p>
                        </div>
                        <div class="bg-white p-3 rounded shadow-sm">
                            <h5 class="font-semibold text-indigo-600">Mid Level</h5>
                            <p class="text-sm">${formatSalary(progression.midLevel.salary)}</p>
                            <p class="text-xs text-gray-600">${progression.midLevel.years} years</p>
                        </div>
                        <div class="bg-white p-3 rounded shadow-sm">
                            <h5 class="font-semibold text-indigo-600">Senior Level</h5>
                            <p class="text-sm">${formatSalary(progression.seniorLevel.salary)}</p>
                            <p class="text-xs text-gray-600">${progression.seniorLevel.years} years</p>
                        </div>
                        <div class="bg-white p-3 rounded shadow-sm">
                            <h5 class="font-semibold text-indigo-600">Expert Level</h5>
                            <p class="text-sm">${formatSalary(progression.expertLevel.salary)}</p>
                            <p class="text-xs text-gray-600">${progression.expertLevel.years}+ years</p>
                        </div>
                    </div>

                    <!-- Cumulative Earnings Summary -->
                    ${(() => {
                        if (typeof progression.entryLevel.salary === 'number') {
                            const earnings = calculateCumulativeEarnings(progression);
                            return `
                                <div class="bg-white p-4 rounded-lg">
                                    <h5 class="font-semibold text-lg mb-3">Potential Cumulative Earnings 💰</h5>
                                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div class="p-3 bg-green-50 rounded">
                                            <h6 class="font-semibold text-green-700">5 Years</h6>
                                            <p class="text-sm">${formatSalary(earnings.fiveYear)}</p>
                                        </div>
                                        <div class="p-3 bg-green-50 rounded">
                                            <h6 class="font-semibold text-green-700">10 Years</h6>
                                            <p class="text-sm">${formatSalary(earnings.tenYear)}</p>
                                        </div>
                                        <div class="p-3 bg-green-50 rounded">
                                            <h6 class="font-semibold text-green-700">20 Years</h6>
                                            <p class="text-sm">${formatSalary(earnings.twentyYear)}</p>
                                        </div>
                                        <div class="p-3 bg-green-50 rounded">
                                            <h6 class="font-semibold text-green-700">Career Total</h6>
                                            <p class="text-sm">${formatSalary(earnings.lifetime)}</p>
                                        </div>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-2">
                                        *Estimates based on typical career progression. Actual earnings may vary based on location, 
                                        performance, market conditions, and other factors.
                                    </p>
                                </div>
                            `;
                        }
                        return '';
                    })()}
                </div>

                <!-- Additional Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-bold text-lg mb-2">Work Environment 🏢</h4>
                        <ul class="list-disc list-inside text-sm">
                            <li>Typical Hours: ${workEnvironment.hours}/week</li>
                            <li>Location: ${workEnvironment.location}</li>
                            <li>Stress Level: ${career.stressLevels ? career.stressLevels.join(', ') : 'Varies'}</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold text-lg mb-2">Future Outlook 🔮</h4>
                        <p class="text-sm">${career.futureOutlook || 'Growing field'}</p>
                        <p class="text-sm mt-2">Growth Rate: ${career.growthRate || 'Varies by location'}</p>
                    </div>
                </div>

                <div class="mt-4 bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-bold text-lg mb-2">Fun Fact ⭐</h4>
                    <p class="text-sm">${career.funFact}</p>
                </div>
            </div>
        `;
    }).join('');
}

// View loading system
async function loadView(viewName) {
    try {
        const response = await fetch(`/static/views/${viewName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${viewName} view`);
        }
        const html = await response.text();
        const contentArea = document.getElementById('main-content');
        contentArea.innerHTML = html;

        // Initialize view-specific functionality
        switch(viewName) {
            case 'dashboard':
                await learningStats.loadFromServer();
                break;
            case 'games':
                initializeGames();
                break;
            // Add other view initializations as needed
        }

        return true;
    } catch (error) {
        console.error(`Error loading view ${viewName}:`, error);
        document.getElementById('main-content').innerHTML = 
            '<div class="error p-4 bg-red-100 text-red-700 rounded">Failed to load content</div>';
        return false;
    }
}

// Load initial view on page load
document.addEventListener('DOMContentLoaded', async () => {
    // ... other initializations ...
    
    // Restore the last active tab
    const lastActiveTab = localStorage.getItem('currentTab') || 'fun-facts';
    const tabToActivate = document.querySelector(`[onclick="switchTab('${lastActiveTab}')"]`);
    if (tabToActivate) {
        tabToActivate.click();
    }
}); 

// Add event listeners to all form inputs to trigger real-time updates
function initializeCareerPathForm() {
    const formInputs = [
        'interests',
        'subjects',
        'stress',
        'work-hours',
        'income-goal',
        'location'
    ];

    formInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', () => {
                // Only analyze if we have at least one interest and subject selected
                const interests = Array.from(document.getElementById('interests').selectedOptions).map(opt => opt.value);
                const subjects = Array.from(document.getElementById('subjects').selectedOptions).map(opt => opt.value);
                
                if (interests.length > 0 && subjects.length > 0) {
                    analyzePath(true); // true indicates this is a real-time update
                } else if (inputId === 'interests' || inputId === 'subjects') {
                    // Show gentle reminder if interests or subjects are empty
                    const resultsContainer = document.getElementById('career-results');
                    if (resultsContainer) {
                        resultsContainer.innerHTML = `
                            <div class="bg-blue-50 p-4 rounded-lg text-center">
                                <p class="text-blue-600">
                                    Please select at least one interest and one subject to see matching careers! ✨
                                </p>
                            </div>
                        `;
                    }
                }
            });
        }
    });
}

// Update analyzePath to support real-time updates
function analyzePath(isRealTimeUpdate = false) {
    try {
        const interests = Array.from(document.getElementById('interests').selectedOptions).map(opt => opt.value);
        const subjects = Array.from(document.getElementById('subjects').selectedOptions).map(opt => opt.value);
        const stress = document.getElementById('stress').value;
        const workHours = parseInt(document.getElementById('work-hours').value);
        const incomeGoal = parseInt(document.getElementById('income-goal').value);
        const location = document.getElementById('location').value;

        if (interests.length === 0 || subjects.length === 0) {
            if (!isRealTimeUpdate) {
                alert('Please select at least one interest and one subject!');
            }
            return;
        }

        const matches = careerPaths.getCareersByPreferences(interests, subjects, stress);
        
        // Filter matches by work hours and income
        const filteredMatches = matches.filter(career => {
            if (!career.progression) return false;

            const expertSalary = career.progression.expertLevel.salary;
            const salaryMatch = 
                incomeGoal >= 5000000 ? expertSalary >= 5000000 :
                incomeGoal >= 1000000 ? expertSalary >= 1000000 :
                incomeGoal >= 500000 ? expertSalary >= 500000 :
                incomeGoal >= 250000 ? expertSalary >= 250000 :
                true;
            
            const hoursMatch = workHours <= 40 ? 
                career.stressLevels.includes('Low') || career.stressLevels.includes('Medium') :
                workHours <= 60 ? 
                    career.stressLevels.includes('Medium') || career.stressLevels.includes('High') :
                    career.stressLevels.includes('High');
            
            return salaryMatch && hoursMatch;
        });

        displayResults(filteredMatches);
        
        // Only scroll to results on initial submission, not during real-time updates
        if (!isRealTimeUpdate) {
            document.getElementById('career-results').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error analyzing career path:', error);
        if (!isRealTimeUpdate) {
            alert('Something went wrong. Please try again!');
        }
    }
}

// Initialize the form when the life path tab is shown
function initializeLifePathTab() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'life-path' && !mutation.target.classList.contains('hidden')) {
                initializeCareerPathForm();
            }
        });
    });

    const lifePathTab = document.getElementById('life-path');
    if (lifePathTab) {
        observer.observe(lifePathTab, { attributes: true, attributeFilter: ['class'] });
        // Initialize immediately if the tab is already visible
        if (!lifePathTab.classList.contains('hidden')) {
            initializeCareerPathForm();
        }
    }
}

// Add to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    initializeLifePathTab();
}); 