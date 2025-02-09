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
    // Initialize each game if its elements exist
    if (document.getElementById('scrambled-word')) {
        newWord();
    }
    if (document.getElementById('math-problem')) {
        newMathProblem();
    }
    if (document.getElementById('memory-game')) {
        startMemoryGame();
    }
    if (document.getElementById('spelling-hint')) {
        newSpellingWord();
    }
    if (document.getElementById('animal-image')) {
        nextAnimal();
    }
    if (document.getElementById('tic-tac-toe')) {
        resetGame();
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
    streak: 0,
    lastVisit: null,
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
            condition: (stats) => stats.streak >= 1,
            backgroundColor: 'bg-orange-100'
        },
        {
            id: 'consistent-learner',
            title: 'Consistent Learner',
            description: '3-day learning streak',
            icon: '⚡',
            condition: (stats) => stats.streak >= 3,
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
            this.streak = stats.streak_days;
            this.activities = stats.activities || [];
            this.updateDashboard();
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
        this.streak = stats.streak_days;
        this.activities = stats.activities || [];
        this.updateDashboard();
    },
    
    updateDashboard() {
        const topicsCount = document.getElementById('topics-count');
        const gamesCount = document.getElementById('games-count');
        const streakCount = document.getElementById('streak-count');
        const activityContainer = document.getElementById('recent-activity');

        if (topicsCount) topicsCount.textContent = this.topicsExplored;
        if (gamesCount) gamesCount.textContent = this.gamesPlayed;
        if (streakCount) {
            let streakText = '';
            if (this.streak === 0) {
                streakText = 'Start your streak! ✨';
            } else if (this.streak === 1) {
                streakText = '1 day 🔥';
            } else {
                streakText = `${this.streak} days 🔥`;
            }
            
            streakCount.textContent = streakText;
            
            // Add animation when streak updates
            streakCount.classList.add('streak-update');
            setTimeout(() => streakCount.classList.remove('streak-update'), 1000);
        }

        if (activityContainer && this.activities.length > 0) {
            activityContainer.innerHTML = this.activities.map(activity => `
                <div class="flex items-center space-x-4">
                    <div class="bg-blue-100 p-2 rounded-full">
                        ${activity.type === 'topic' ? '📚' : '🎮'}
                    </div>
                    <div class="flex-1">
                        <div class="font-bold">${activity.description}</div>
                        <div class="text-sm text-gray-600">${this.formatTimeAgo(new Date(activity.timestamp))}</div>
                    </div>
                </div>
            `).join('');
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

// Career paths database
const careerPaths = {
    teacher: {
        title: "Teacher",
        requirements: {
            workHours: 40,
            incomeGoal: 50000,
            familyTime: "high",
            location: "anywhere",
            stress: "medium"
        },
        path: {
            highSchool: {
                grades: "80%+ average",
                activities: "Tutoring, Volunteer teaching",
                requirements: "Strong communication skills"
            },
            university: {
                degree: "Education or Subject-specific degree",
                gpa: "3.0+ GPA",
                requirements: "Teaching certification"
            },
            career: {
                entryLevel: {
                    role: "Teacher",
                    hours: "40-45 hours/week",
                    salary: "$45,000-$55,000"
                },
                fiveYears: {
                    role: "Senior Teacher",
                    hours: "40-45 hours/week",
                    salary: "$55,000-$70,000"
                },
                tenYears: {
                    role: "Department Head",
                    hours: "40-45 hours/week",
                    salary: "$70,000-$90,000"
                }
            }
        }
    },
    nurse: {
        title: "Registered Nurse",
        requirements: {
            workHours: 40,
            incomeGoal: 75000,
            familyTime: "medium",
            location: "anywhere",
            stress: "high"
        },
        path: {
            highSchool: {
                grades: "85%+ average",
                activities: "Hospital volunteering, First Aid certification",
                requirements: "Strong Biology and Chemistry grades"
            },
            university: {
                degree: "Bachelor of Science in Nursing",
                gpa: "3.2+ GPA",
                requirements: "NCLEX-RN certification"
            },
            career: {
                entryLevel: {
                    role: "Registered Nurse",
                    hours: "36-40 hours/week",
                    salary: "$65,000-$80,000"
                },
                fiveYears: {
                    role: "Specialized Nurse",
                    hours: "36-40 hours/week",
                    salary: "$80,000-$100,000"
                },
                tenYears: {
                    role: "Nurse Practitioner",
                    hours: "40-45 hours/week",
                    salary: "$100,000-$130,000"
                }
            }
        }
    },
    accountant: {
        title: "Accountant",
        requirements: {
            workHours: 45,
            incomeGoal: 100000,
            familyTime: "medium",
            location: "anywhere",
            stress: "medium"
        },
        path: {
            highSchool: {
                grades: "85%+ average",
                activities: "Math club, Business clubs",
                requirements: "Strong Math grades"
            },
            university: {
                degree: "Accounting or Finance",
                gpa: "3.3+ GPA",
                requirements: "CPA certification"
            },
            career: {
                entryLevel: {
                    role: "Junior Accountant",
                    hours: "40-45 hours/week",
                    salary: "$55,000-$70,000"
                },
                fiveYears: {
                    role: "Senior Accountant",
                    hours: "40-50 hours/week",
                    salary: "$80,000-$110,000"
                },
                tenYears: {
                    role: "Accounting Manager",
                    hours: "45-50 hours/week",
                    salary: "$110,000-$150,000"
                }
            }
        }
    },
    lawyer: {
        title: "Lawyer",
        requirements: {
            workHours: 60,
            incomeGoal: 200000,
            familyTime: "low",
            location: "major-city",
            stress: "high"
        },
        path: {
            highSchool: {
                grades: "90%+ average",
                activities: "Debate team, Mock trial",
                requirements: "Strong English and History grades"
            },
            university: {
                degree: "Pre-Law, then Law School",
                gpa: "3.7+ GPA",
                requirements: "Pass Bar Exam"
            },
            career: {
                entryLevel: {
                    role: "Associate Attorney",
                    hours: "60-70 hours/week",
                    salary: "$125,000-$190,000"
                },
                fiveYears: {
                    role: "Senior Associate",
                    hours: "55-65 hours/week",
                    salary: "$180,000-$250,000"
                },
                tenYears: {
                    role: "Partner",
                    hours: "50-60 hours/week",
                    salary: "$250,000-$1,000,000+"
                }
            }
        }
    },
    investmentBanker: {
        title: "Investment Banker",
        requirements: {
            workHours: 80,
            incomeGoal: 500000,
            familyTime: "low",
            location: "major-city",
            stress: "high"
        },
        path: {
            highSchool: {
                grades: "95%+ average",
                activities: "Leadership roles, Math club, Debate team",
                requirements: "Advanced Math and Economics courses"
            },
            university: {
                degree: "Economics, Finance, or Business",
                gpa: "3.7+ GPA",
                internships: "Summer internships at top banks required"
            },
            career: {
                entryLevel: {
                    role: "Analyst",
                    hours: "80-100 hours/week",
                    salary: "$150,000-$200,000"
                },
                fiveYears: {
                    role: "Associate",
                    hours: "70-80 hours/week",
                    salary: "$300,000-$500,000"
                },
                tenYears: {
                    role: "Vice President",
                    hours: "60-70 hours/week",
                    salary: "$500,000-$2M+"
                }
            }
        }
    },
    hedgeFundManager: {
        title: "Hedge Fund Manager",
        requirements: {
            workHours: 70,
            incomeGoal: 1000000,
            familyTime: "low",
            location: "major-city",
            stress: "high"
        },
        path: {
            highSchool: {
                grades: "95%+ average",
                activities: "Math competitions, Trading club",
                requirements: "Advanced Math and Computer Science"
            },
            university: {
                degree: "Mathematics, Physics, or Quantitative Finance",
                gpa: "3.8+ GPA",
                internships: "Quant trading internships"
            },
            career: {
                entryLevel: {
                    role: "Quantitative Analyst",
                    hours: "60-70 hours/week",
                    salary: "$200,000-$300,000"
                },
                fiveYears: {
                    role: "Portfolio Manager",
                    hours: "60-70 hours/week",
                    salary: "$500,000-$2M"
                },
                tenYears: {
                    role: "Fund Manager",
                    hours: "50-60 hours/week",
                    salary: "$2M-$10M+"
                }
            }
        }
    },
    surgeonSpecialist: {
        title: "Specialized Surgeon",
        requirements: {
            workHours: 60,
            incomeGoal: 500000,
            familyTime: "medium",
            location: "major-city",
            stress: "high"
        },
        path: {
            highSchool: {
                grades: "95%+ average",
                activities: "Hospital volunteering, Research projects",
                requirements: "Advanced Biology and Chemistry"
            },
            university: {
                degree: "Pre-Med + Medical School + Specialization",
                gpa: "3.8+ GPA",
                requirements: "MCAT 515+, Residency, Fellowship"
            },
            career: {
                entryLevel: {
                    role: "Resident",
                    hours: "80+ hours/week",
                    salary: "$60,000-$70,000"
                },
                fiveYears: {
                    role: "Specialized Surgeon",
                    hours: "60-70 hours/week",
                    salary: "$400,000-$600,000"
                },
                tenYears: {
                    role: "Chief Surgeon",
                    hours: "50-60 hours/week",
                    salary: "$600,000-$1.5M+"
                }
            }
        }
    },
    techExecutive: {
        title: "Tech Executive",
        requirements: {
            workHours: 60,
            incomeGoal: 500000,
            familyTime: "medium",
            location: "major-city",
            stress: "high"
        },
        path: {
            highSchool: {
                grades: "90%+ average",
                activities: "Coding projects, Hackathons",
                requirements: "Computer Science, Math"
            },
            university: {
                degree: "Computer Science or Software Engineering",
                gpa: "3.5+ GPA",
                internships: "FAANG company internships"
            },
            career: {
                entryLevel: {
                    role: "Software Engineer",
                    hours: "40-50 hours/week",
                    salary: "$150,000-$200,000"
                },
                fiveYears: {
                    role: "Engineering Manager",
                    hours: "50-60 hours/week",
                    salary: "$300,000-$500,000"
                },
                tenYears: {
                    role: "CTO/VP Engineering",
                    hours: "50-60 hours/week",
                    salary: "$500,000-$2M+"
                }
            }
        }
    },
    privateEquityPartner: {
        title: "Private Equity Partner",
        requirements: {
            workHours: 70,
            incomeGoal: 1000000,
            familyTime: "low",
            location: "major-city",
            stress: "high"
        },
        path: {
            highSchool: {
                grades: "95%+ average",
                activities: "Business competitions, Leadership roles",
                requirements: "Advanced Math and Economics"
            },
            university: {
                degree: "Business, Economics, or Finance",
                gpa: "3.8+ GPA",
                internships: "Investment Banking internships"
            },
            career: {
                entryLevel: {
                    role: "Investment Banking Analyst",
                    hours: "80-100 hours/week",
                    salary: "$150,000-$200,000"
                },
                fiveYears: {
                    role: "Private Equity Associate",
                    hours: "70-80 hours/week",
                    salary: "$300,000-$600,000"
                },
                tenYears: {
                    role: "Partner",
                    hours: "60-70 hours/week",
                    salary: "$1M-$10M+"
                }
            }
        }
    }
};

function analyzePath() {
    const workHours = parseInt(document.getElementById('work-hours').value);
    const incomeGoal = parseInt(document.getElementById('income-goal').value);
    const familyTime = document.getElementById('family-time').value;
    const location = document.getElementById('location').value;
    const stress = document.getElementById('stress').value;

    const matches = findMatchingCareers(workHours, incomeGoal, familyTime, location, stress);
    displayResults(matches);
}

function findMatchingCareers(workHours, incomeGoal, familyTime, location, stress) {
    return Object.values(careerPaths).filter(career => {
        const req = career.requirements;
        
        // More nuanced matching
        const hoursMatch = workHours >= req.workHours - 10; // More flexibility in hours
        const incomeMatch = incomeGoal <= req.incomeGoal * 1.5; // More flexibility in income
        const lifestyleMatch = 
            familyTime === req.familyTime || 
            location === req.location || 
            stress === req.stress;
        
        // Weight different factors
        const hoursFit = 1 - Math.abs(workHours - req.workHours) / 100;
        const incomeFit = 1 - Math.abs(incomeGoal - req.incomeGoal) / incomeGoal;
        const lifestyleFit = (
            (familyTime === req.familyTime ? 1 : 0) +
            (location === req.location ? 1 : 0) +
            (stress === req.stress ? 1 : 0)
        ) / 3;
        
        // Calculate overall match score
        const matchScore = (hoursFit + incomeFit + lifestyleFit) / 3;
        
        // Store match score for sorting
        career.matchScore = matchScore;
        
        return hoursMatch && incomeMatch && lifestyleMatch;
    }).sort((a, b) => {
        // Sort by match score
        return b.matchScore - a.matchScore;
    });
}

function displayResults(matches) {
    const resultsDiv = document.getElementById('life-path-results');
    const pathsDiv = document.getElementById('career-paths');
    
    resultsDiv.classList.remove('hidden');
    
    if (matches.length === 0) {
        pathsDiv.innerHTML = `
            <div class="text-center text-gray-600">
                <p>No exact matches found for your criteria.</p>
                <p>Try adjusting your preferences to see more options.</p>
            </div>
        `;
        return;
    }

    pathsDiv.innerHTML = matches.map(career => `
        <div class="border rounded-lg p-6 space-y-4">
            <h4 class="text-xl font-bold text-indigo-600">${career.title}</h4>
            
            <div class="space-y-2">
                <h5 class="font-bold">High School Requirements</h5>
                <ul class="list-disc list-inside text-gray-600">
                    <li>Grades: ${career.path.highSchool.grades}</li>
                    <li>Activities: ${career.path.highSchool.activities}</li>
                    <li>Courses: ${career.path.highSchool.requirements}</li>
                </ul>
            </div>

            <div class="space-y-2">
                <h5 class="font-bold">University Path</h5>
                <ul class="list-disc list-inside text-gray-600">
                    <li>Degree: ${career.path.university.degree}</li>
                    <li>GPA: ${career.path.university.gpa}</li>
                    ${career.path.university.internships ? 
                        `<li>Internships: ${career.path.university.internships}</li>` : ''}
                </ul>
            </div>

            <div class="space-y-2">
                <h5 class="font-bold">Career Progression</h5>
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div class="p-3 bg-gray-50 rounded">
                        <div class="font-bold">Entry Level</div>
                        <div>${career.path.career.entryLevel.role}</div>
                        <div>${career.path.career.entryLevel.hours}</div>
                        <div>${career.path.career.entryLevel.salary}</div>
                    </div>
                    <div class="p-3 bg-gray-50 rounded">
                        <div class="font-bold">5 Years</div>
                        <div>${career.path.career.fiveYears.role}</div>
                        <div>${career.path.career.fiveYears.hours}</div>
                        <div>${career.path.career.fiveYears.salary}</div>
                    </div>
                    <div class="p-3 bg-gray-50 rounded">
                        <div class="font-bold">10 Years</div>
                        <div>${career.path.career.tenYears.role}</div>
                        <div>${career.path.career.tenYears.hours}</div>
                        <div>${career.path.career.tenYears.salary}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
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