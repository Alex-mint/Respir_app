let timerInterval;
let totalTimeRemaining = 0;
let phaseTimeRemaining = 0;
let currentPhase = 0; // 0: Idle, 1: Phase 1 (Sec 1), 2: Phase 2 (Sec 2)

const inputMin = document.getElementById('inputMin');
const inputSec1 = document.getElementById('inputSec1');
const inputSec2 = document.getElementById('inputSec2');
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

// Audio Context
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(freq, type, duration) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Smooth attack and release
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 0.05); // volume 1.0 (max)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playPhaseSound() {
    new Audio('phase.mp3').play();
}

function playEndSound() {
    new Audio('end.mp3').play();
}

// Helper to get input values safely
function getInputs() {
    return {
        min: parseInt(inputMin.value) || 0,
        s1: parseInt(inputSec1.value) || 0,
        s2: parseInt(inputSec2.value) || 0
    };
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Just show the seconds for the breathing phase, big and clear
function formatPhaseTime(seconds) {
    return String(seconds).padStart(2, '0');
}

function updateDisplay() {
    // If running, show phase time. If idle, show 00:00 or maybe specific placeholder?
    // Let's show phase time if running.
    if (currentPhase !== 0) {
        timerDisplay.textContent = formatPhaseTime(phaseTimeRemaining);
    } else {
        timerDisplay.textContent = "00";
    }
}

function updatePhaseHighlights() {
    // Remove active class from all
    inputSec1.closest('.input-group').classList.remove('active-phase');
    inputSec2.closest('.input-group').classList.remove('active-phase');

    if (currentPhase === 1) {
        inputSec1.closest('.input-group').classList.add('active-phase');
    } else if (currentPhase === 2) {
        inputSec2.closest('.input-group').classList.add('active-phase');
    }
}

function startPhase(phase) {
    currentPhase = phase;
    const { s1, s2 } = getInputs();

    if (phase === 1) {
        phaseTimeRemaining = s1;
    } else {
        phaseTimeRemaining = s2;
    }

    // Safety check to prevent infinite loop of 0s
    if (phaseTimeRemaining <= 0) {
        // If a phase has 0 seconds, skip it immediately? 
        // For now let's just force at least 1 sec or switch immediately.
        // Better: switch immediately.
        const next = phase === 1 ? 2 : 1;
        const nextVal = next === 1 ? s1 : s2;
        if (nextVal > 0) {
            startPhase(next);
            return;
        } else {
            // Both are 0? Stop.
            stopTimer();
            return;
        }
    }

    updateDisplay();
    updatePhaseHighlights();
}

function startTimer() {
    stopTimer(); // Clear existing

    const { min, s1, s2 } = getInputs();

    // Total duration in seconds
    totalTimeRemaining = min * 60;

    // Validate
    if (totalTimeRemaining <= 0 && (s1 + s2 > 0)) {
        // If user set no Min but set Secs, assume infinite loop? 
        // Let's assume Min is REQUIRED for total duration.
        alert("Please set a duration in Minutes.");
        return;
    }
    if (s1 <= 0 && s2 <= 0) {
        alert("Please set seconds for at least one phase.");
        return;
    }

    // Start with Phase 1
    startPhase(1);

    timerInterval = setInterval(() => {
        // Decrement Total Timer
        totalTimeRemaining--;
        if (totalTimeRemaining < 0) {
            playEndSound();
            stopTimer();
            return;
        }

        // Decrement Phase Timer
        phaseTimeRemaining--;

        if (phaseTimeRemaining < 0) {
            // Switch Phase
            playPhaseSound();
            const nextPhase = currentPhase === 1 ? 2 : 1;
            startPhase(nextPhase);
        } else {
            updateDisplay();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    currentPhase = 0;
    updatePhaseHighlights();
    timerDisplay.textContent = "00";
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
