// Game configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

// Set canvas to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Handle window resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Recreate starfield for new dimensions
    createStarfield();
    
    // Update player position if it's off screen (only if player exists)
    if (typeof player !== 'undefined' && player && player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
    }
}

window.addEventListener('resize', resizeCanvas);

// Create starfield background function
function createStarfield() {
    // Clear existing stars
    const existingStars = document.querySelectorAll('.star');
    existingStars.forEach(star => star.remove());
    
    // Create more stars for better coverage
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * window.innerWidth + 'px';
        star.style.top = Math.random() * window.innerHeight + 'px';
        star.style.animationDelay = Math.random() * 3 + 's';
        gameContainer.appendChild(star);
    }
}

// Initial starfield creation
createStarfield();

// Ship types with unique abilities
const shipTypes = {
    stealth: {
        name: 'STEALTH',
        speed: 6,
        maxHealth: 3,
        health: 3,
        fireRate: 300,
        color: '#1a1a2e',
        special: 'invisibility',
        specialDuration: 5000,
        specialCooldown: 15000,
        width: 55,
        height: 40,
        image: 'assets/ships/stealth.png',
        stats: { speed: 70, shield: 30, power: 60 },
        description: 'Becomes invisible for 5 seconds'
    },
    titan: {
        name: 'TITAN',
        speed: 3,
        maxHealth: 10,
        health: 10,
        fireRate: 400,
        color: '#ff4444',
        special: 'shield',
        shieldStrength: 5,
        specialCooldown: 10000,
        width: 75,
        height: 55,
        image: 'assets/ships/titan.png',
        stats: { speed: 30, shield: 100, power: 80 },
        description: 'Heavy armor with regenerating shield'
    },
    viper: {
        name: 'VIPER',
        speed: 10,
        maxHealth: 2,
        health: 2,
        fireRate: 200,
        color: '#ff0000',
        special: 'superSpeed',
        boostSpeed: 20,
        specialDuration: 3000,
        specialCooldown: 8000,
        width: 50,
        height: 35,
        image: 'assets/ships/viper.png',
        stats: { speed: 100, shield: 20, power: 50 },
        description: 'Super fast with speed boost'
    },
    opus: {
        name: 'OPUS',
        speed: 5,
        maxHealth: 4,
        health: 4,
        fireRate: 300,
        color: '#ff8800',
        special: 'pulseCannon',
        specialCooldown: 8000,
        width: 60,
        height: 45,
        image: 'assets/ships/opus.png',
        stats: { speed: 60, shield: 60, power: 85 },
        description: 'Fires a pulse cannon wave'
    },
    striker: {
        name: 'STRIKER',
        speed: 5,
        maxHealth: 4,
        health: 4,
        fireRate: 300,
        color: '#ff00ff',
        special: 'chargedPlasma',
        width: 60,
        height: 45,
        image: 'assets/ships/stricker.png',
        stats: { speed: 60, shield: 50, power: 90 },
        description: 'Charges powerful plasma shots'
    },
    phantom: {
        name: 'PHANTOM',
        speed: 8,
        maxHealth: 3,
        health: 3,
        fireRate: 250,
        color: '#00ffff',
        special: 'phaseShift',
        specialDuration: 2000,
        specialCooldown: 10000,
        width: 50,
        height: 35,
        image: 'assets/ships/other.png',
        stats: { speed: 90, shield: 30, power: 70 },
        description: 'Phase through enemy bullets'
    }
};

// Game state
let selectedShip = null;
let paused = false;
let introSequenceComplete = false;
let currentIntroScreen = 'intro';

// Audio context and sound system
let audioContext;
let soundEnabled = true;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(frequency, duration, type = 'square', volume = 0.1) {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playShootSound() {
    playSound(300, 0.1, 'square', 0.1);
    playSound(200, 0.1, 'square', 0.05);
}

function playChargedShot() {
    playSound(150, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playSound(300, 0.2, 'sine', 0.15), 100);
    setTimeout(() => playSound(600, 0.1, 'square', 0.1), 200);
}

function playExplosionSound() {
    playSound(100, 0.2, 'sawtooth', 0.2);
    setTimeout(() => playSound(50, 0.3, 'sawtooth', 0.15), 50);
}

function playPowerUpSound() {
    playSound(400, 0.1, 'sine', 0.15);
    setTimeout(() => playSound(600, 0.1, 'sine', 0.15), 100);
    setTimeout(() => playSound(800, 0.1, 'sine', 0.15), 200);
}

function playHitSound() {
    playSound(150, 0.2, 'sawtooth', 0.3);
}

function playShieldHit() {
    playSound(500, 0.1, 'sine', 0.1);
    playSound(250, 0.15, 'triangle', 0.08);
}

function playInvisibilitySound() {
    playSound(1000, 0.5, 'sine', 0.1);
    playSound(1500, 0.3, 'sine', 0.05);
}

function playPulseCannonSound() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => playSound(200 + i * 100, 0.2, 'sawtooth', 0.2), i * 50);
    }
}

// Enhanced level-specific background music
function playBackgroundMusic(level) {
    if (!soundEnabled || !audioContext) return;
    
    const musicData = {
        1: { // Level 1 - Heroic theme
            melody: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63],
            bass: [65.41, 73.42, 82.41, 87.31, 98.00, 110.00, 123.47, 130.81],
            harmony: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99, 392.00],
            tempo: 220,
            waveType: 'sine'
        },
        2: { // Level 2 - Rising tension
            melody: [146.83, 164.81, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63],
            bass: [73.42, 82.41, 98.00, 110.00, 123.47, 130.81, 146.83, 164.81],
            harmony: [293.66, 329.63, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25],
            tempo: 180,
            waveType: 'triangle'
        },
        3: { // Level 3 - Boss battle (intense)
            melody: [98.00, 110.00, 123.47, 130.81, 146.83, 164.81, 196.00, 220.00],
            bass: [49.00, 55.00, 61.74, 65.41, 73.42, 82.41, 98.00, 110.00],
            harmony: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00],
            tempo: 120,
            waveType: 'sawtooth'
        },
        4: { // Shmup Stage 1 - Space adventure
            melody: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00],
            bass: [98.00, 110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00],
            harmony: [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99],
            tempo: 160,
            waveType: 'sine'
        },
        5: { // Shmup Stage 2 - Deep space
            melody: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
            bass: [110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00, 220.00],
            harmony: [440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00],
            tempo: 140,
            waveType: 'triangle'
        },
        6: { // Shmup Stage 3 - Final assault
            melody: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
            bass: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63],
            harmony: [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50],
            tempo: 110,
            waveType: 'sawtooth'
        }
    };
    
    const music = musicData[Math.min(level, 6)] || musicData[1];
    let noteIndex = 0;
    let beatCounter = 0;
    
    if (window.musicInterval) {
        clearInterval(window.musicInterval);
    }
    
    window.musicInterval = setInterval(() => {
        if (soundEnabled && gameRunning && !paused) {
            // Main melody
            playSound(music.melody[noteIndex], 0.08, music.waveType, 0.1);
            
            // Bass line (plays every other beat)
            if (beatCounter % 2 === 0) {
                playSound(music.bass[noteIndex], 0.06, 'triangle', 0.15);
            }
            
            // Harmony (plays every 4th beat)
            if (beatCounter % 4 === 0) {
                playSound(music.harmony[noteIndex], 0.04, 'sine', 0.08);
            }
            
            // Special effects for boss battle
            if (level === 3 || boss) {
                // Dramatic low frequency rumble
                playSound(music.bass[noteIndex] / 4, 0.12, 'sawtooth', 0.05);
                // Piercing high notes
                if (beatCounter % 8 === 0) {
                    playSound(music.melody[noteIndex] * 2, 0.03, 'square', 0.02);
                }
            }
            
            // Special effects for shmup mode (levels 4-6)
            if (level >= 4) {
                // Cosmic ambience
                if (beatCounter % 6 === 0) {
                    playSound(music.harmony[noteIndex] * 1.5, 0.02, 'sine', 0.2);
                }
                // Pulse effect
                if (beatCounter % 16 === 0) {
                    playSound(music.bass[noteIndex] / 2, 0.08, 'triangle', 0.3);
                }
            }
            
            noteIndex = (noteIndex + 1) % music.melody.length;
            beatCounter++;
        }
    }, music.tempo);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundToggle').textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
}

// Game variables
let score = 0;
let lives = 3;
let currentLevel = 1;
let gameRunning = false;
let gameStarted = false;
let keys = {};
let particles = [];
let powerUps = [];
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let enemyFighters = [];
let infiltrators = [];
let boss = null;
let enemyDirection = 1;
let enemySpeed = 0.5;
let dropSpeed = 10;
let chargeLevel = 0;
let charging = false;
let endlessMode = false;
let currentWave = 0;
let enemyWaveSpawnTimer = 0;
let shmupMode = false;
let shmupStage = 1;
let shmupRound = 1;
let shmupEnemies = [];
let shmupBackground = null;
let backgroundY = 0;
let backgroundStars = [];
let backgroundClouds = [];
let backgroundPlanets = [];
let backgroundDebris = [];
let shmupWaveSpawned = false;
let shmupStageTimer = 0;

// Player object
let player = {
    x: canvas.width / 2 - 30,
    y: canvas.height - 80,
    width: 60,
    height: 40,
    speed: 5,
    health: 3,
    maxHealth: 3,
    powerUps: [],
    invulnerable: false,
    invulnerableTime: 0,
    shield: 0,
    invisible: false,
    invisibleTime: 0,
    phasing: false,
    phasingTime: 0,
    shipType: 'striker',
    specialActive: false,
    specialCooldown: 0,
    image: null
};

// Now that player is defined, ensure proper canvas sizing
resizeCanvas();


// Power-up types
const powerUpTypes = {
    rapidFire: { color: '#ffff00', symbol: 'R', duration: -1 },
    tripleShot: { color: '#ff00ff', symbol: 'T', duration: -1 },
    shield: { color: '#00ff00', symbol: 'S', duration: -1 },
    laser: { color: '#ff0000', symbol: 'L', duration: -1 },
    health: { color: '#ffffff', symbol: '+', instant: true },
    damage: { color: '#ff8800', symbol: 'D', duration: -1 }
};

// Enemy types
const enemyTypes = {
    basic: { health: 1, points: 10, color: '#00ff00', speed: 1 },
    fast: { health: 1, points: 20, color: '#ffff00', speed: 2 },
    tank: { health: 3, points: 30, color: '#ff00ff', speed: 0.5 },
    shooter: { health: 2, points: 25, color: '#ff8800', speed: 1, shootRate: 0.015 }
};

// Shmup enemy types
const shmupEnemyTypes = {
    smallPlane: { 
        health: 2, points: 30, speed: 2, 
        image: 'assets/enemies/r2-small-one.png',
        movePattern: 'straight', fireRate: 0.02
    },
    bigPlane: { 
        health: 5, points: 50, speed: 1, 
        image: 'assets/enemies/r2-big-plane.png',
        movePattern: 'sine', fireRate: 0.015
    },
    circleEnemy: { 
        health: 3, points: 40, speed: 1.5, 
        image: 'assets/enemies/r2-circle.png',
        movePattern: 'circle', fireRate: 0.01
    },
    complexCircle: { 
        health: 4, points: 60, speed: 1.2, 
        image: 'assets/enemies/r2-complex-circle.png',
        movePattern: 'complex', fireRate: 0.02
    },
    blackOrange: { 
        health: 3, points: 45, speed: 2.5, 
        image: 'assets/enemies/r2-black-orange.png',
        movePattern: 'dive', fireRate: 0.025
    },
    niceRed: { 
        health: 6, points: 70, speed: 1, 
        image: 'assets/enemies/r2-nice-red.png',
        movePattern: 'hover', fireRate: 0.03
    },
    tripleEnemy: { 
        health: 4, points: 80, speed: 1.8, 
        image: 'assets/enemies/r2-the-3.png',
        movePattern: 'formation', fireRate: 0.02
    },
    spaceStation: { 
        health: 15, points: 200, speed: 0.5, 
        image: 'assets/enemies/r2-fixed-space-station.png',
        movePattern: 'station', fireRate: 0.04
    },
    sideShooter: { 
        health: 8, points: 100, speed: 1.5, 
        image: 'assets/enemies/r2-fixed-left-side-top.png',
        movePattern: 'side', fireRate: 0.035
    }
};

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
    if (e.key === 'Escape' && gameStarted) togglePause();
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize ship selection
function initializeShipSelection() {
    const shipGrid = document.getElementById('shipGrid');
    shipGrid.innerHTML = '';
    
    Object.entries(shipTypes).forEach(([key, ship]) => {
        const shipOption = document.createElement('div');
        shipOption.className = 'ship-option';
        shipOption.id = key + 'Option';
        
        shipOption.innerHTML = `
            <div class="ship-preview">
                ${ship.image ? `<img src="${ship.image}" alt="${ship.name}">` : `<canvas id="${key}Preview" width="100" height="80"></canvas>`}
            </div>
            <div class="ship-name">${ship.name}</div>
            <div class="ship-stats">
                <div>Speed: <span class="stat-bar"><span class="stat-fill" style="width: ${ship.stats.speed}%"></span></span></div>
                <div>Shield: <span class="stat-bar"><span class="stat-fill" style="width: ${ship.stats.shield}%"></span></span></div>
                <div>Power: <span class="stat-bar"><span class="stat-fill" style="width: ${ship.stats.power}%"></span></span></div>
                <div style="color: ${ship.color}; font-size: 10px;">${ship.description}</div>
            </div>
        `;
        
        shipOption.addEventListener('click', () => selectShip(key));
        shipGrid.appendChild(shipOption);
        
        // Draw canvas preview for ships without images
        if (!ship.image) {
            setTimeout(() => drawShipPreview(key, key + 'Preview'), 100);
        }
    });
}

// Draw ship preview on canvas
function drawShipPreview(shipType, canvasId) {
    const previewCanvas = document.getElementById(canvasId);
    if (!previewCanvas) return;
    
    const previewCtx = previewCanvas.getContext('2d');
    const ship = shipTypes[shipType];
    
    previewCtx.clearRect(0, 0, 100, 80);
    previewCtx.fillStyle = ship.color;
    previewCtx.strokeStyle = ship.color;
    previewCtx.lineWidth = 2;
    
    const x = 50 - ship.width / 2;
    const y = 40 - ship.height / 2;
    
    if (shipType === 'striker') {
        previewCtx.beginPath();
        previewCtx.moveTo(x + ship.width / 2, y);
        previewCtx.lineTo(x + 5, y + ship.height);
        previewCtx.lineTo(x + 15, y + ship.height - 10);
        previewCtx.lineTo(x + ship.width / 2, y + ship.height - 15);
        previewCtx.lineTo(x + ship.width - 15, y + ship.height - 10);
        previewCtx.lineTo(x + ship.width - 5, y + ship.height);
        previewCtx.closePath();
        previewCtx.fill();
        
        previewCtx.fillStyle = '#ffff00';
        previewCtx.fillRect(x + ship.width / 2 - 3, y - 5, 6, 10);
    } else if (shipType === 'phantom') {
        previewCtx.beginPath();
        previewCtx.moveTo(x + ship.width / 2, y);
        previewCtx.lineTo(x, y + ship.height);
        previewCtx.lineTo(x + ship.width / 2 - 10, y + ship.height - 5);
        previewCtx.lineTo(x + ship.width / 2, y + 20);
        previewCtx.lineTo(x + ship.width / 2 + 10, y + ship.height - 5);
        previewCtx.lineTo(x + ship.width, y + ship.height);
        previewCtx.closePath();
        previewCtx.fill();
        
        previewCtx.strokeStyle = '#00ffff';
        previewCtx.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) {
            previewCtx.beginPath();
            previewCtx.moveTo(x + 10 + i * 15, y + ship.height + 5);
            previewCtx.lineTo(x + 10 + i * 15, y + ship.height + 15);
            previewCtx.stroke();
        }
        previewCtx.globalAlpha = 1;
    }
}

// Ship selection handler (new robust version)
// Ship selection
function selectShip(type) {
    selectedShip = type;
    document.querySelectorAll('.ship-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.getElementById(type + 'Option').classList.add('selected');
    document.getElementById('startButton').disabled = false;
    document.getElementById('startButton').textContent = 'START GAME';
}

// Intro sequence
function startIntroSequence() {
    // Show Project 52 first
    setTimeout(() => {
        document.getElementById('project52Screen').style.display = 'none';
        document.getElementById('introScreen').style.display = 'flex';
        
        setTimeout(() => {
            document.getElementById('introScreen').style.display = 'none';
            document.getElementById('storyScreen').style.display = 'flex';
            
            setTimeout(() => {
                document.getElementById('storyScreen').style.display = 'none';
                document.getElementById('startScreen').style.display = 'flex';
                introSequenceComplete = true;
            }, 3000);
        }, 3000);
    }, 3000);
}

function skipToMenu() {
    document.getElementById('project52Screen').style.display = 'none';
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('storyScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    introSequenceComplete = true;
}

// Create particle effect
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 30,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// Create enemies for level
function createEnemies(level) {
    enemies = [];
    enemyFighters = [];
    infiltrators = [];
    const types = ['basic', 'fast', 'tank', 'shooter'];
    const rows = 4 + Math.floor(level / 2); // More enemies from start
    const cols = 10; // More columns
    
    enemySpeed = 0.8 + (level - 1) * 0.3; // Faster from start
    dropSpeed = 15 + (level - 1) * 5; // Faster drop
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const typeIndex = Math.min(row, types.length - 1);
            const type = types[typeIndex];
            enemies.push({
                x: col * 70 + 100,
                y: row * 50 + 50,
                width: 40,
                height: 30,
                type: type,
                health: enemyTypes[type].health,
                maxHealth: enemyTypes[type].health,
                shootTimer: Math.random() * 100
            });
        }
    }
    
    // Add enemy fighters
    const fighterCount = Math.min(level, 3);
    for (let i = 0; i < fighterCount; i++) {
        enemyFighters.push({
            x: 100 + i * 200,
            y: 100,
            width: 45,
            height: 35,
            health: 3,
            speed: 2,
            shootTimer: 0,
            movePattern: i % 3,
            color: '#ff00ff'
        });
    }
    
    // Add infiltrators on level 2+
    if (level >= 2) {
        const infiltratorCount = level - 1; // Level 2: 1 infiltrator, Level 3: 2 infiltrators
        for (let i = 0; i < infiltratorCount; i++) {
            infiltrators.push({
                x: canvas.width / 2 + (i - 0.5) * 100,
                y: -50 - i * 100,
                width: 50,
                height: 40,
                health: 3 + level,
                speed: 1.5,
                state: 'entering',
                shootTimer: 0,
                rapidFireTime: 0,
                burstCount: 0,
                targetingEnemies: true,
                color: '#8800ff',
                image: 'assets/enemies/infiltrator.png',
                weaponLevel: level
            });
        }
    }
}

// Create boss for level 3
function createBoss() {
    boss = {
        x: canvas.width / 2 - 150,
        y: -200,
        width: 300,
        height: 250,
        health: 120,
        maxHealth: 120,
        speed: 1.5,
        direction: 1,
        shootTimer: 0,
        tentacleTimer: 0,
        phase: 1,
        color: '#00ff00',
        image: 'assets/enemies/octopus_boss.png',
        tentacles: [],
        entering: true,
        powerUpTimer: 0
    };
    
    // Create tentacles
    for (let i = 0; i < 8; i++) {
        boss.tentacles.push({
            angle: (i / 8) * Math.PI * 2,
            length: 100,
            targetLength: 100 + Math.random() * 50,
            speed: 0.02 + Math.random() * 0.02
        });
    }
}

// Shooting functions
function playerShoot() {
    if (player.shipType === 'striker' && charging) return;
    
    playShootSound();
    
    const hasTripleShot = player.powerUps.includes('tripleShot');
    const hasLaser = player.powerUps.includes('laser');
    const hasDamage = player.powerUps.includes('damage');
    const damage = hasDamage ? 2 : 1;
    
    if (hasLaser) {
        playerBullets.push({
            x: player.x + player.width / 2 - 10,
            y: 0,
            width: 20,
            height: player.y,
            speed: 0,
            damage: damage * 2,
            laser: true,
            life: 15
        });
    } else if (hasTripleShot) {
        playerBullets.push(
            { x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10, speed: 10, damage: damage },
            { x: player.x + 10, y: player.y, width: 4, height: 10, speed: 10, damage: damage, angle: -0.2 },
            { x: player.x + player.width - 10, y: player.y, width: 4, height: 10, speed: 10, damage: damage, angle: 0.2 }
        );
    } else {
        playerBullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 10,
            damage: damage
        });
    }
}

function fireChargedPlasma() {
    playChargedShot();
    const size = 10 + chargeLevel * 15;
    const damage = 1 + Math.floor(chargeLevel / 20);
    
    playerBullets.push({
        x: player.x + player.width / 2 - size / 2,
        y: player.y,
        width: size,
        height: size,
        speed: 8,
        damage: damage,
        charged: true,
        color: `hsl(${280 + chargeLevel * 2}, 100%, 50%)`
    });
    
    chargeLevel = 0;
    document.getElementById('specialAbilityFill').style.width = '0%';
}

function firePulseCannon() {
    playPulseCannonSound();
    
    // Fire 3 pulse shots in a spread
    for (let i = -1; i <= 1; i++) {
        playerBullets.push({
            x: player.x + player.width / 2 - 10,
            y: player.y,
            width: 20,
            height: 20,
            speed: 10,
            damage: 2,
            pulse: true,
            color: '#ff8800',
            angle: i * 0.3
        });
    }
}

// Special abilities
function activateSpecialAbility() {
    if (player.specialCooldown > 0) return;
    
    const ship = shipTypes[player.shipType];
    
    switch (ship.special) {
        case 'invisibility':
            player.invisible = true;
            player.invisibleTime = Date.now();
            player.specialCooldown = ship.specialCooldown;
            playInvisibilitySound();
            break;
            
        case 'shield':
            player.shield = Math.min(player.shield + ship.shieldStrength, ship.shieldStrength);
            player.specialCooldown = ship.specialCooldown;
            playSound(200, 0.3, 'sine', 0.1);
            break;
            
        case 'superSpeed':
            player.superSpeed = true;
            player.superSpeedTime = Date.now();
            player.specialCooldown = ship.specialCooldown;
            playSound(800, 0.2, 'sawtooth', 0.1);
            break;
            
        case 'pulseCannon':
            firePulseCannon();
            player.specialCooldown = ship.specialCooldown;
            break;
            
        case 'chargedPlasma':
            charging = true;
            document.getElementById('specialAbilityBar').style.display = 'block';
            break;
            
        case 'phaseShift':
            player.phasing = true;
            player.phasingTime = Date.now();
            player.specialCooldown = ship.specialCooldown;
            playSound(1200, 0.3, 'triangle', 0.1);
            break;
    }
}

// Update functions
function updateHealthBar() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('healthFill').style.width = healthPercent + '%';
    
    if (healthPercent > 60) {
        document.getElementById('healthFill').style.background = 'linear-gradient(90deg, #00ff00, #00ff00)';
    } else if (healthPercent > 30) {
        document.getElementById('healthFill').style.background = 'linear-gradient(90deg, #ffff00, #ffff00)';
    } else {
        document.getElementById('healthFill').style.background = 'linear-gradient(90deg, #ff0000, #ff0000)';
    }
}

function updatePowerUpIndicator() {
    const indicator = document.getElementById('powerUpIndicator');
    if (player.powerUps.length > 0) {
        indicator.style.display = 'block';
        indicator.innerHTML = `Power-ups: ${player.powerUps.map(p => powerUpTypes[p].symbol).join(' ')}`;
    } else {
        indicator.style.display = 'none';
    }
}

function update() {
    if (!gameRunning || paused) return;
    
    // Update special ability cooldown
    if (player.specialCooldown > 0) {
        player.specialCooldown -= 16;
        const cooldownPercent = Math.max(0, player.specialCooldown / shipTypes[player.shipType].specialCooldown);
        document.getElementById('specialAbilityFill').style.width = (100 - cooldownPercent * 100) + '%';
    }
    
    // Update player
    let currentSpeed = player.speed;
    if (player.superSpeed && Date.now() - player.superSpeedTime < shipTypes[player.shipType].specialDuration) {
        currentSpeed = shipTypes[player.shipType].boostSpeed;
    } else {
        player.superSpeed = false;
    }
    
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= currentSpeed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += currentSpeed;
    }
    
    // Special abilities
    if (keys['0']) {
        if (player.shipType === 'striker' && !charging) {
            activateSpecialAbility();
        } else if (player.shipType !== 'striker') {
            activateSpecialAbility();
        }
    } else if (player.shipType === 'striker' && charging) {
        chargeLevel = Math.min(chargeLevel + 2, 100);
        document.getElementById('specialAbilityFill').style.width = chargeLevel + '%';
        
        if (!keys['0'] && chargeLevel > 10) {
            fireChargedPlasma();
            charging = false;
            document.getElementById('specialAbilityBar').style.display = 'block';
            player.specialCooldown = shipTypes.striker.specialCooldown;
        }
    }
    
    // Update invisibility
    if (player.invisible && Date.now() - player.invisibleTime > shipTypes.stealth.specialDuration) {
        player.invisible = false;
    }
    
    // Update phasing
    if (player.phasing && Date.now() - player.phasingTime > shipTypes.phantom.specialDuration) {
        player.phasing = false;
    }
    
    // Shooting
    if (keys[' '] && !charging) {
        const fireRate = player.powerUps.includes('rapidFire') ? 100 : player.fireRate || 300;
        if (!player.lastShot || Date.now() - player.lastShot > fireRate) {
            playerShoot();
            player.lastShot = Date.now();
        }
    }
    
    // Update invulnerability
    if (player.invulnerable && Date.now() - player.invulnerableTime > 2000) {
        player.invulnerable = false;
    }
    
    // Update player bullets
    playerBullets = playerBullets.filter(bullet => {
        if (bullet.laser) {
            bullet.life--;
            return bullet.life > 0;
        } else {
            bullet.y -= bullet.speed;
            if (bullet.angle) {
                bullet.x += bullet.angle * bullet.speed;
            }
            return bullet.y > -10;
        }
    });
    
    // Update enemy bullets
    enemyBullets = enemyBullets.filter(bullet => {
        if (bullet.vx && bullet.vy) {
            // Handle infiltrator bullets with velocity components
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
        } else if (bullet.angleY) {
            bullet.y += bullet.angleY;
            if (bullet.angle) {
                bullet.x += bullet.angle;
            }
        } else {
            bullet.y += bullet.speed;
            if (bullet.angle) {
                bullet.x += bullet.angle;
            }
        }
        if (bullet.homing && !player.invisible) {
            const dx = player.x + player.width / 2 - bullet.x;
            const dy = player.y + player.height / 2 - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                bullet.x += (dx / dist) * 2;
            }
        }
        return bullet.y < canvas.height + 10 && bullet.y > -10 && bullet.x > -10 && bullet.x < canvas.width + 10;
    });
    
    // Handle shmup mode
    if (shmupMode) {
        updateShmupMode();
        return; // Skip normal enemy updates
    }
    
    // Update enemies
    if (currentLevel < 3) {
        let shouldDrop = false;
        
        enemies.forEach(enemy => {
            // Endless enemies have different movement
            if (enemy.endlessEnemy) {
                enemy.y += enemyTypes[enemy.type].speed;
                
                // Special behaviors for new enemy types
                if (enemy.type === 'kamikaze' && !player.invisible) {
                    // Kamikaze enemies track player
                    const dx = player.x - enemy.x;
                    enemy.x += Math.sign(dx) * Math.min(Math.abs(dx), enemyTypes.kamikaze.speed);
                }
                
                if (enemy.type === 'sniper') {
                    // Snipers stop and shoot
                    if (enemy.y > 100 && enemy.y < 200) {
                        enemy.y += 0; // Stop moving
                    }
                }
                
                // Remove if off screen
                if (enemy.y > canvas.height + 50) {
                    enemy.toRemove = true;
                }
            } else {
                // Normal enemy movement
                enemy.x += enemyTypes[enemy.type].speed * enemyDirection * enemySpeed;
                
                if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                    shouldDrop = true;
                }
                
                if (enemy.y + enemy.height >= canvas.height - 100) {
                    gameOver('The aliens have invaded!');
                }
            }
            
            // Enemy shooting patterns
            if (enemy.type === 'shooter' && Math.random() < 0.008) {
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 4,
                    y: enemy.y + enemy.height,
                    width: 6,
                    height: 6,
                    speed: 2,
                    circular: true
                });
            } else if (enemy.type === 'sniper' && enemy.y > 100 && enemy.y < 200 && Math.random() < 0.02) {
                // Sniper shoots accurate shots at player
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height,
                    width: 8,
                    height: 8,
                    speed: 4,
                    angle: Math.cos(angle) * 4,
                    angleY: Math.sin(angle) * 4,
                    circular: true,
                    color: '#ffffff'
                });
            } else if (Math.random() < 0.0005 * currentLevel) {
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 3,
                    y: enemy.y + enemy.height,
                    width: 6,
                    height: 6,
                    speed: 2,
                    circular: true
                });
            }
        });
        
        if (shouldDrop) {
            enemyDirection *= -1;
            enemies.forEach(enemy => {
                enemy.y += dropSpeed;
                enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
            });
        }
        
        // Update enemy fighters
        enemyFighters.forEach(fighter => {
            // Movement patterns
            if (fighter.movePattern === 0) {
                fighter.x += fighter.speed;
                if (fighter.x <= 0 || fighter.x >= canvas.width - fighter.width) {
                    fighter.speed *= -1;
                }
            } else if (fighter.movePattern === 1) {
                fighter.x += Math.sin(Date.now() * 0.002) * 3;
                fighter.y = 100 + Math.sin(Date.now() * 0.004) * 50;
            } else {
                fighter.x += fighter.speed;
                fighter.y = 100 + Math.sin(fighter.x * 0.01) * 30;
                if (fighter.x <= 0 || fighter.x >= canvas.width - fighter.width) {
                    fighter.speed *= -1;
                }
            }
            
            // Fighter shooting
            fighter.shootTimer++;
            if (fighter.shootTimer > 80 && !player.invisible) {
                enemyBullets.push({
                    x: fighter.x + fighter.width / 2,
                    y: fighter.y + fighter.height,
                    width: 6,
                    height: 6,
                    speed: 4,
                    circular: true,
                    homing: true,
                    color: '#ff00ff'
                });
                fighter.shootTimer = 0;
            }
        });
        
        // Update infiltrators
        infiltrators.forEach(infiltrator => {
            if (infiltrator.state === 'entering') {
                infiltrator.y += infiltrator.speed;
                if (infiltrator.y >= canvas.height * 0.7) {
                    infiltrator.state = 'positioning';
                }
            } else if (infiltrator.state === 'positioning') {
                // Move to behind player formation (behind means further down the screen)
                const targetX = player.x + player.width / 2 - infiltrator.width / 2;
                const targetY = player.y + 80; // Position behind player
                
                const dx = targetX - infiltrator.x;
                const dy = targetY - infiltrator.y;
                
                infiltrator.x += Math.sign(dx) * Math.min(Math.abs(dx), infiltrator.speed * 1.5);
                infiltrator.y += Math.sign(dy) * Math.min(Math.abs(dy), infiltrator.speed);
                
                if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
                    infiltrator.state = 'combat';
                    infiltrator.rapidFireTime = 0;
                }
            } else if (infiltrator.state === 'combat') {
                // Stay behind player but maintain tactical position
                const targetX = player.x + player.width / 2 - infiltrator.width / 2;
                const targetY = player.y + 80; // Stay behind player
                const dx = targetX - infiltrator.x;
                const dy = targetY - infiltrator.y;
                
                // Follow player more closely
                infiltrator.x += Math.sign(dx) * Math.min(Math.abs(dx), infiltrator.speed * 1.2);
                infiltrator.y += Math.sign(dy) * Math.min(Math.abs(dy), infiltrator.speed * 0.5);
                
                // Smart shooting system - try to hit player while avoiding friendly fire
                infiltrator.rapidFireTime++;
                
                if (infiltrator.rapidFireTime % 30 === 0 && !player.invisible) {
                    // Calculate angle to player
                    const angleToPlayer = Math.atan2(player.y - infiltrator.y, player.x + player.width/2 - infiltrator.x - infiltrator.width/2);
                    
                    // Check if there are enemies in the line of fire
                    let clearShot = true;
                    const shotPath = {
                        x1: infiltrator.x + infiltrator.width / 2,
                        y1: infiltrator.y,
                        x2: player.x + player.width / 2,
                        y2: player.y + player.height / 2
                    };
                    
                    // Check if any enemy is in the line of fire
                    enemies.forEach(enemy => {
                        const enemyCenter = {
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y + enemy.height / 2
                        };
                        
                        // Simple line-circle intersection check
                        const dist = Math.abs((shotPath.y2 - shotPath.y1) * enemyCenter.x - (shotPath.x2 - shotPath.x1) * enemyCenter.y + shotPath.x2 * shotPath.y1 - shotPath.y2 * shotPath.x1) / 
                                    Math.sqrt(Math.pow(shotPath.y2 - shotPath.y1, 2) + Math.pow(shotPath.x2 - shotPath.x1, 2));
                        
                        if (dist < 30) { // Enemy is too close to shot path
                            clearShot = false;
                        }
                    });
                    
                    // Calculate aggression based on remaining enemies (fewer enemies = more aggressive)
                    const maxEnemies = 20; // Approximate max enemies per level
                    const aggressionBonus = (maxEnemies - enemies.length) / maxEnemies;
                    const baseChance = 0.3 + aggressionBonus * 0.7; // 30% to 100% chance
                    
                    if (clearShot || Math.random() < baseChance) {
                        // Take the shot!
                        const bulletSpeed = 5;
                        enemyBullets.push({
                            x: infiltrator.x + infiltrator.width / 2,
                            y: infiltrator.y,
                            width: 8,
                            height: 8,
                            speed: bulletSpeed,
                            vx: Math.cos(angleToPlayer) * bulletSpeed,
                            vy: Math.sin(angleToPlayer) * bulletSpeed,
                            circular: true,
                            color: '#ff0066',
                            fromInfiltrator: true
                        });
                        
                        // More aggressive when fewer enemies (rapid fire)
                        if (enemies.length < 5 && Math.random() < 0.5) {
                            setTimeout(() => {
                                if (infiltrator.health > 0) {
                                    enemyBullets.push({
                                        x: infiltrator.x + infiltrator.width / 2,
                                        y: infiltrator.y,
                                        width: 8,
                                        height: 8,
                                        speed: bulletSpeed,
                                        vx: Math.cos(angleToPlayer + 0.1) * bulletSpeed,
                                        vy: Math.sin(angleToPlayer + 0.1) * bulletSpeed,
                                        circular: true,
                                        color: '#ff0066',
                                        fromInfiltrator: true
                                    });
                                }
                            }, 100);
                        }
                    }
                }
            }
        });
    }
    
    // Update boss
    if (boss) {
        if (boss.entering) {
            boss.y += 2;
            if (boss.y >= 50) {
                boss.entering = false;
            }
        } else {
            boss.x += boss.speed * boss.direction;
            if (boss.x <= 0 || boss.x >= canvas.width - boss.width) {
                boss.direction *= -1;
            }
            
            // Update tentacles
            boss.tentacles.forEach((tentacle, i) => {
                tentacle.angle += tentacle.speed;
                tentacle.length += (tentacle.targetLength - tentacle.length) * 0.1;
                
                if (Math.random() < 0.01) {
                    tentacle.targetLength = 100 + Math.random() * 100;
                }
                
                // Tentacle collision with player
                const tentacleX = boss.x + boss.width / 2 + Math.cos(tentacle.angle) * tentacle.length;
                const tentacleY = boss.y + boss.height / 2 + Math.sin(tentacle.angle) * tentacle.length;
                
                if (!player.invulnerable && !player.phasing &&
                    Math.abs(tentacleX - (player.x + player.width / 2)) < 30 &&
                    Math.abs(tentacleY - (player.y + player.height / 2)) < 30) {
                    playerHit();
                }
            });
            
            boss.shootTimer++;
            if (boss.shootTimer > 90) { // More frequent but weaker attacks
                const healthRatio = boss.health / boss.maxHealth;
                
                if (healthRatio > 0.66) {
                    // Phase 1: Wave patterns
                    for (let i = 0; i < 7; i++) {
                        const angle = (i / 7) * Math.PI + Math.PI * 0.5 + Math.sin(Date.now() * 0.001) * 0.3;
                        enemyBullets.push({
                            x: boss.x + boss.width / 2,
                            y: boss.y + boss.height / 2,
                            width: 8,
                            height: 8,
                            speed: 1.5,
                            angle: Math.cos(angle) * 1.5,
                            circular: true,
                            color: '#00ff00'
                        });
                    }
                } else if (healthRatio > 0.33) {
                    // Phase 2: Spiral pattern
                    for (let i = 0; i < 3; i++) {
                        const baseAngle = Date.now() * 0.002 + i * 2.094;
                        enemyBullets.push({
                            x: boss.x + boss.width / 2,
                            y: boss.y + boss.height / 2,
                            width: 10,
                            height: 10,
                            speed: 1.8,
                            angle: Math.cos(baseAngle) * 2,
                            angleY: Math.sin(baseAngle) * 2,
                            circular: true,
                            color: '#88ff00'
                        });
                    }
                } else {
                    // Phase 3: Chaotic patterns but dodgeable
                    for (let i = 0; i < 10; i++) {
                        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
                        enemyBullets.push({
                            x: boss.x + boss.width / 2,
                            y: boss.y + boss.height / 2,
                            width: 5,
                            height: 5,
                            speed: 2 + Math.random(),
                            angle: Math.cos(angle) * 2,
                            angleY: Math.sin(angle) * 2,
                            circular: true,
                            color: '#ffff00'
                        });
                    }
                }
                boss.shootTimer = 0;
            }
            
            // Boss spawns power-ups occasionally
            boss.powerUpTimer++;
            if (boss.powerUpTimer > 600) { // Every 10 seconds
                const types = ['shield', 'rapidFire', 'damage'];
                const type = types[Math.floor(Math.random() * types.length)];
                powerUps.push({
                    x: boss.x + boss.width / 2 - 15,
                    y: boss.y + boss.height,
                    width: 30,
                    height: 30,
                    type: type,
                    speed: 1
                });
                boss.powerUpTimer = 0;
            }
        }
    }
    
    // Collision detection - Player bullets vs enemies
    playerBullets.forEach((bullet, bulletIndex) => {
        if (bullet.fromInfiltrator) {
            if (bullet.vx && bullet.vy) {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
            } else {
                bullet.x += bullet.angle || 0;
                bullet.y += bullet.angleY || -bullet.speed;
            }
        } else if (bullet.angle && !bullet.laser && !bullet.pulse) {
            bullet.x += bullet.angle * bullet.speed;
        }
        
        // Check normal enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                // Handle shielder's shield
                if (enemy.type === 'shielder' && enemy.shield > 0) {
                    enemy.shield--;
                    createParticles(bullet.x, bullet.y, '#0088ff', 5);
                    playShieldHit();
                } else {
                    enemy.health -= bullet.damage || 1;
                }
                
                if (!bullet.laser && !bullet.pulse) {
                    playerBullets.splice(bulletIndex, 1);
                }
                
                if (enemy.health <= 0) {
                    score += enemyTypes[enemy.type].points;
                    createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemyTypes[enemy.type].color);
                    
                    // Splitter enemy splits into smaller enemies
                    if (enemy.type === 'splitter') {
                        for (let i = 0; i < 3; i++) {
                            enemies.push({
                                x: enemy.x + (i - 1) * 20,
                                y: enemy.y,
                                width: 25,
                                height: 20,
                                type: 'basic',
                                health: 1,
                                maxHealth: 1,
                                shootTimer: 0,
                                endlessEnemy: enemy.endlessEnemy
                            });
                        }
                    }
                    
                    enemies.splice(enemyIndex, 1);
                    playExplosionSound();
                    
                    // Power-up drop (higher chance in endless mode)
                    const dropChance = endlessMode ? 0.3 : 0.2;
                    if (Math.random() < dropChance) {
                        const types = Object.keys(powerUpTypes);
                        const type = types[Math.floor(Math.random() * types.length)];
                        powerUps.push({
                            x: enemy.x,
                            y: enemy.y,
                            width: 30,
                            height: 30,
                            type: type,
                            speed: 2
                        });
                    }
                }
            }
        });
        
        // Check shmup enemies
        if (shmupMode) {
            shmupEnemies.forEach((enemy, enemyIndex) => {
                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    
                    enemy.health -= bullet.damage || 1;
                    if (!bullet.laser && !bullet.pulse) {
                        playerBullets.splice(bulletIndex, 1);
                    }
                    createParticles(bullet.x, bullet.y, enemy.color, 10);
                    
                    if (enemy.health <= 0) {
                        score += enemy.points || 100;
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 30);
                        shmupEnemies.splice(enemyIndex, 1);
                        playExplosionSound();
                        
                        // Special death effects
                        if (enemy.type === 'station') {
                            // Big explosion for space station
                            for (let i = 0; i < 50; i++) {
                                particles.push({
                                    x: enemy.x + enemy.width / 2,
                                    y: enemy.y + enemy.height / 2,
                                    vx: (Math.random() - 0.5) * 15,
                                    vy: (Math.random() - 0.5) * 15,
                                    life: 40,
                                    size: Math.random() * 6 + 2,
                                    color: '#ff8800'
                                });
                            }
                        }
                        
                        // Power-up drops
                        if (Math.random() < 0.4) {
                            const types = Object.keys(powerUpTypes);
                            const type = types[Math.floor(Math.random() * types.length)];
                            powerUps.push({
                                x: enemy.x + enemy.width / 2 - 15,
                                y: enemy.y,
                                width: 30,
                                height: 30,
                                type: type,
                                speed: 2
                            });
                        }
                    }
                }
            });
        }
        
        // Check enemy fighters
        enemyFighters.forEach((fighter, fighterIndex) => {
            if (bullet.x < fighter.x + fighter.width &&
                bullet.x + bullet.width > fighter.x &&
                bullet.y < fighter.y + fighter.height &&
                bullet.y + bullet.height > fighter.y) {
                
                fighter.health -= bullet.damage || 1;
                if (!bullet.laser && !bullet.pulse) {
                    playerBullets.splice(bulletIndex, 1);
                }
                
                if (fighter.health <= 0) {
                    score += 50;
                    createParticles(fighter.x + fighter.width / 2, fighter.y + fighter.height / 2, fighter.color, 20);
                    enemyFighters.splice(fighterIndex, 1);
                    playExplosionSound();
                }
            }
        });
        
        // Check infiltrators
        infiltrators.forEach((infiltrator, infiltratorIndex) => {
            if (!bullet.fromInfiltrator &&
                bullet.x < infiltrator.x + infiltrator.width &&
                bullet.x + bullet.width > infiltrator.x &&
                bullet.y < infiltrator.y + infiltrator.height &&
                bullet.y + bullet.height > infiltrator.y) {
                
                infiltrator.health -= bullet.damage || 1;
                if (!bullet.laser && !bullet.pulse) {
                    playerBullets.splice(bulletIndex, 1);
                }
                
                if (infiltrator.health <= 0) {
                    score += 100;
                    createParticles(infiltrator.x + infiltrator.width / 2, infiltrator.y + infiltrator.height / 2, infiltrator.color, 25);
                    infiltrators.splice(infiltratorIndex, 1);
                    playExplosionSound();
                    
                    // Always drop power-up
                    const types = Object.keys(powerUpTypes);
                    const type = types[Math.floor(Math.random() * types.length)];
                    powerUps.push({
                        x: infiltrator.x,
                        y: infiltrator.y,
                        width: 30,
                        height: 30,
                        type: type,
                        speed: 2
                    });
                }
            }
        });
        
        // Check boss
        if (boss) {
            if (bullet.x < boss.x + boss.width &&
                bullet.x + bullet.width > boss.x &&
                bullet.y < boss.y + boss.height &&
                bullet.y + bullet.height > boss.y) {
                
                boss.health -= bullet.damage || 1;
                if (!bullet.laser && !bullet.pulse) {
                    playerBullets.splice(bulletIndex, 1);
                }
                createParticles(bullet.x, bullet.y, '#00ff00', 5);
                
                if (boss.health <= 0) {
                    score += 1000;
                    createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, '#00ff00', 100);
                    playExplosionSound();
                    boss = null;
                    
                    // Show blackhole screen and transition to endless mode
                    showBlackholeTransition();
                }
            }
        }
    });
    
    // Collision detection - Enemy bullets vs player
    if (!player.invulnerable && !player.invisible) {
        enemyBullets.forEach((bullet, index) => {
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y) {
                
                if (player.phasing) {
                    // Phase through bullets
                    return;
                }
                
                if (player.shield > 0) {
                    player.shield--;
                    playShieldHit();
                } else if (!player.powerUps.includes('shield')) {
                    playerHit();
                } else {
                    // Remove shield power-up
                    const shieldIndex = player.powerUps.indexOf('shield');
                    if (shieldIndex > -1) {
                        player.powerUps.splice(shieldIndex, 1);
                        updatePowerUpIndicator();
                        playShieldHit();
                    }
                }
                enemyBullets.splice(index, 1);
            }
        });
    }
    
    // Friendly fire - Infiltrator bullets vs regular enemies
    enemyBullets.forEach((bullet, bulletIndex) => {
        if (bullet.fromInfiltrator) {
            enemies.forEach((enemy, enemyIndex) => {
                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    
                    enemy.health -= 1;
                    enemyBullets.splice(bulletIndex, 1);
                    createParticles(bullet.x, bullet.y, '#ff0066', 8);
                    
                    if (enemy.health <= 0) {
                        score += enemyTypes[enemy.type].points;
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemyTypes[enemy.type].color);
                        enemies.splice(enemyIndex, 1);
                        playExplosionSound();
                        
                        // Power-up drop from friendly fire kills
                        if (Math.random() < 0.15) {
                            const types = Object.keys(powerUpTypes);
                            const type = types[Math.floor(Math.random() * types.length)];
                            powerUps.push({
                                x: enemy.x,
                                y: enemy.y,
                                width: 30,
                                height: 30,
                                type: type,
                                speed: 2
                            });
                        }
                    }
                }
            });
        }
    });
    
    // Collision detection - Enemy bullets vs player
    if (!player.invulnerable && !player.invisible) {
        // Collision detection - Normal enemies vs player
        if (!shmupMode) {
            enemies.forEach((enemy, index) => {
                if (enemy.x < player.x + player.width &&
                    enemy.x + enemy.width > player.x &&
                    enemy.y < player.y + player.height &&
                    enemy.y + enemy.height > player.y) {
                    
                    if (player.phasing) {
                        return;
                    }
                    
                    // Damage player
                    if (player.shield > 0) {
                        player.shield--;
                        playShieldHit();
                    } else if (!player.powerUps.includes('shield')) {
                        playerHit();
                    } else {
                        const shieldIndex = player.powerUps.indexOf('shield');
                        if (shieldIndex > -1) {
                            player.powerUps.splice(shieldIndex, 1);
                            updatePowerUpIndicator();
                            playShieldHit();
                        }
                    }
                    
                    // Damage enemy on collision
                    enemy.health -= 2; // Collision does significant damage
                    createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color || '#ff0000', 20);
                    
                    if (enemy.health <= 0) {
                        score += enemyTypes[enemy.type].points;
                        enemies.splice(index, 1);
                        playExplosionSound();
                    }
                }
            });
            
            // Collision detection - Enemy fighters vs player
            enemyFighters.forEach((fighter, index) => {
                if (fighter.x < player.x + player.width &&
                    fighter.x + fighter.width > player.x &&
                    fighter.y < player.y + player.height &&
                    fighter.y + fighter.height > player.y) {
                    
                    if (player.phasing) {
                        return;
                    }
                    
                    // Damage player
                    if (player.shield > 0) {
                        player.shield--;
                        playShieldHit();
                    } else if (!player.powerUps.includes('shield')) {
                        playerHit();
                    } else {
                        const shieldIndex = player.powerUps.indexOf('shield');
                        if (shieldIndex > -1) {
                            player.powerUps.splice(shieldIndex, 1);
                            updatePowerUpIndicator();
                            playShieldHit();
                        }
                    }
                    
                    // Destroy fighter on collision
                    createParticles(fighter.x + fighter.width / 2, fighter.y + fighter.height / 2, fighter.color, 30);
                    enemyFighters.splice(index, 1);
                    score += 50;
                    playExplosionSound();
                }
            });
            
            // Collision detection - Infiltrators vs player
            infiltrators.forEach((infiltrator, index) => {
                if (infiltrator.x < player.x + player.width &&
                    infiltrator.x + infiltrator.width > player.x &&
                    infiltrator.y < player.y + player.height &&
                    infiltrator.y + infiltrator.height > player.y) {
                    
                    if (player.phasing) {
                        return;
                    }
                    
                    // Damage player
                    if (player.shield > 0) {
                        player.shield--;
                        playShieldHit();
                    } else if (!player.powerUps.includes('shield')) {
                        playerHit();
                    } else {
                        const shieldIndex = player.powerUps.indexOf('shield');
                        if (shieldIndex > -1) {
                            player.powerUps.splice(shieldIndex, 1);
                            updatePowerUpIndicator();
                            playShieldHit();
                        }
                    }
                    
                    // Damage infiltrator on collision
                    infiltrator.health -= 1;
                    createParticles(infiltrator.x + infiltrator.width / 2, infiltrator.y + infiltrator.height / 2, infiltrator.color, 25);
                    
                    if (infiltrator.health <= 0) {
                        score += 100;
                        infiltrators.splice(index, 1);
                        playExplosionSound();
                    }
                }
            });
        }
        
        // Collision detection - Shmup enemies vs player
        if (shmupMode) {
            shmupEnemies.forEach((enemy, index) => {
                if (enemy.x < player.x + player.width &&
                    enemy.x + enemy.width > player.x &&
                    enemy.y < player.y + player.height &&
                    enemy.y + enemy.height > player.y) {
                    
                    if (player.phasing) {
                        return;
                    }
                    
                    // Damage player
                    if (player.shield > 0) {
                        player.shield--;
                        playShieldHit();
                    } else if (!player.powerUps.includes('shield')) {
                        playerHit();
                    } else {
                        const shieldIndex = player.powerUps.indexOf('shield');
                        if (shieldIndex > -1) {
                            player.powerUps.splice(shieldIndex, 1);
                            updatePowerUpIndicator();
                            playShieldHit();
                        }
                    }
                    
                    // Destroy enemy on collision (kamikaze style)
                    createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 40);
                    shmupEnemies.splice(index, 1);
                    playExplosionSound();
                }
            });
        }
    }
    
    // Power-up collection
    powerUps = powerUps.filter(powerUp => {
        powerUp.y += powerUp.speed;
        
        if (powerUp.x < player.x + player.width &&
            powerUp.x + powerUp.width > player.x &&
            powerUp.y < player.y + player.height &&
            powerUp.y + powerUp.height > player.y) {
            
            if (powerUp.type === 'health') {
                player.health = Math.min(player.health + 1, player.maxHealth);
                updateHealthBar();
            } else {
                // Stack power-ups
                if (!player.powerUps.includes(powerUp.type)) {
                    player.powerUps.push(powerUp.type);
                }
            }
            score += 50;
            createParticles(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUpTypes[powerUp.type].color);
            playPowerUpSound();
            updatePowerUpIndicator();
            return false;
        }
        
        return powerUp.y < canvas.height;
    });
    
    // Update particles
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.5;
        particle.life--;
        return particle.life > 0;
    });
    
    // Remove enemies marked for removal
    enemies = enemies.filter(enemy => !enemy.toRemove);
    
    // Check level completion
    if (currentLevel < 3 && enemies.length === 0 && enemyFighters.length === 0 && infiltrators.length === 0 && !endlessMode) {
        showLevelComplete();
    }
    
    // Remove automatic victory in endless mode - game continues until death
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('lives').textContent = lives;
}

function playerHit() {
    player.health--;
    player.invulnerable = true;
    player.invulnerableTime = Date.now();
    createParticles(player.x + player.width / 2, player.y + player.height / 2, player.color || '#00ffff');
    playHitSound();
    updateHealthBar();
    
    // Lose all power-ups when hit
    if (player.powerUps.length > 0) {
        player.powerUps = [];
        updatePowerUpIndicator();
    }
    
    if (player.health <= 0) {
        gameOver('Your ship was destroyed!');
    }
}

// Render functions
function drawShip(x, y, type, color, alpha = 1) {
    // Only draw ships when game is running
    if (!gameRunning) return;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    const ship = shipTypes[type];
    if (ship && ship.image && player.image) {
        ctx.drawImage(player.image, x, y, ship.width, ship.height);
    } else {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        
        // Simple triangle ship
        ctx.beginPath();
        ctx.moveTo(x + ship.width / 2, y);
        ctx.lineTo(x, y + ship.height);
        ctx.lineTo(x + ship.width, y + ship.height);
        ctx.closePath();
        ctx.fill();
    }
    
    // Shield effect
    if (player.shield > 0) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x + ship.width / 2, y + ship.height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px Arial';
        ctx.fillText(player.shield, x + ship.width / 2 - 5, y - 10);
    }
    
    // Phasing effect
    if (player.phasing) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x - 5, y - 5, ship.width + 10, ship.height + 10);
        ctx.setLineDash([]);
    }
    
    ctx.restore();
}

function render() {
    // Clear canvas completely if game not running
    if (!gameRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    // Clear canvas
    if (shmupMode) {
        // Draw shmup background
        ctx.fillStyle = shmupBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background planets (furthest back)
        backgroundPlanets.forEach(planet => {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = planet.color;
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw rings if planet has them
            if (planet.rings) {
                ctx.strokeStyle = planet.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.ellipse(planet.x, planet.y, planet.size * 1.3, planet.size * 0.3, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(planet.x, planet.y, planet.size * 1.5, planet.size * 0.4, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        });
        
        // Draw background clouds/nebula (middle layer)
        backgroundClouds.forEach(cloud => {
            ctx.save();
            ctx.globalAlpha = cloud.opacity;
            ctx.fillStyle = cloud.color;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Draw space debris (moving objects)
        backgroundDebris.forEach(debris => {
            ctx.save();
            ctx.translate(debris.x + debris.width / 2, debris.y + debris.height / 2);
            ctx.rotate(debris.rotation);
            ctx.fillStyle = debris.color;
            ctx.fillRect(-debris.width / 2, -debris.height / 2, debris.width, debris.height);
            ctx.restore();
        });
        
        // Draw background stars (closest/fastest)
        backgroundStars.forEach(star => {
            ctx.save();
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add star twinkle effect
            if (Math.random() < 0.1) {
                ctx.globalAlpha = star.brightness * 1.5;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(star.x - star.size * 2, star.y);
                ctx.lineTo(star.x + star.size * 2, star.y);
                ctx.moveTo(star.x, star.y - star.size * 2);
                ctx.lineTo(star.x, star.y + star.size * 2);
                ctx.stroke();
            }
            ctx.restore();
        });
    } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Render shmup enemies if in shmup mode
    if (shmupMode) {
        shmupEnemies.forEach(enemy => {
            ctx.save();
            
            // Handle rotation for certain enemy types
            if (enemy.type === 'station') {
                ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                ctx.rotate(enemy.rotation || 0);
                ctx.translate(-enemy.width / 2, -enemy.height / 2);
                
                if (enemy.image && enemy.imageObj) {
                    ctx.drawImage(enemy.imageObj, 0, 0, enemy.width, enemy.height);
                } else {
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(0, 0, enemy.width, enemy.height);
                }
            } else {
                // Draw enemy image or fallback shape
                if (enemy.image && enemy.imageObj) {
                    ctx.drawImage(enemy.imageObj, enemy.x, enemy.y, enemy.width, enemy.height);
                } else {
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                }
            }
            
            ctx.restore();
            
            // Health bar for enemies with more than 1 health
            if (enemy.health > 1) {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 4);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 4);
            }
            
            // Special effects for certain enemy types
            if (enemy.type === 'hover' && enemy.charging) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 40, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        });
    }
    
    // Render player (only when game is running)
    if (gameRunning && (!player.invisible || Math.floor(Date.now() / 100) % 2)) {
        const alpha = (player.invulnerable && Math.floor(Date.now() / 100) % 2) ? 0.5 : 1;
        drawShip(player.x, player.y, player.shipType, player.color, alpha);
        
        // Power-up indicators
        player.powerUps.forEach((powerUp, index) => {
            ctx.strokeStyle = powerUpTypes[powerUp].color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 35 + index * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }
    
    // Render enemies
    enemies.forEach(enemy => {
        const type = enemyTypes[enemy.type];
        ctx.fillStyle = type.color;
        
        // Special rendering for new enemy types
        if (enemy.type === 'kamikaze') {
            // Draw kamikaze with warning indicator
            ctx.fillStyle = type.color;
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
            ctx.lineTo(enemy.x, enemy.y + enemy.height);
            ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
            ctx.closePath();
            ctx.fill();
            
            // Warning circle
            ctx.strokeStyle = '#ff0000';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else if (enemy.type === 'splitter') {
            // Draw splitter with segments
            ctx.fillRect(enemy.x, enemy.y, enemy.width / 3 - 2, enemy.height);
            ctx.fillRect(enemy.x + enemy.width / 3, enemy.y, enemy.width / 3 - 2, enemy.height);
            ctx.fillRect(enemy.x + 2 * enemy.width / 3, enemy.y, enemy.width / 3, enemy.height);
        } else if (enemy.type === 'sniper') {
            // Draw sniper with crosshair
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            ctx.strokeStyle = type.color;
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height + 5);
            ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height + 15);
            ctx.stroke();
        } else if (enemy.type === 'shielder') {
            // Draw shielder
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            if (enemy.shield > 0) {
                ctx.strokeStyle = '#0088ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(enemy.x - 5, enemy.y - 5, enemy.width + 10, enemy.height + 10);
            }
        } else {
            // Normal enemy
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        
        // Health bars
        if (enemy.maxHealth > 1 || enemy.shield) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 4);
        }
    });
    
    // Render enemy fighters
    enemyFighters.forEach(fighter => {
        ctx.fillStyle = fighter.color;
        ctx.beginPath();
        ctx.moveTo(fighter.x + fighter.width / 2, fighter.y + fighter.height);
        ctx.lineTo(fighter.x, fighter.y);
        ctx.lineTo(fighter.x + fighter.width / 2, fighter.y + 10);
        ctx.lineTo(fighter.x + fighter.width, fighter.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.fillRect(fighter.x + fighter.width / 2 - 2, fighter.y + 15, 4, 10);
    });
    
    // Render infiltrators
    infiltrators.forEach(infiltrator => {
        if (infiltrator.image && infiltrator.imageObj) {
            ctx.save();
            if (infiltrator.state === 'behind') {
                ctx.globalAlpha = 0.8;
            }
            ctx.drawImage(infiltrator.imageObj, infiltrator.x, infiltrator.y, infiltrator.width, infiltrator.height);
            ctx.restore();
        } else {
            ctx.fillStyle = infiltrator.color;
            ctx.fillRect(infiltrator.x, infiltrator.y, infiltrator.width, infiltrator.height);
        }
        
        // Health bar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(infiltrator.x, infiltrator.y - 10, infiltrator.width, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(infiltrator.x, infiltrator.y - 10, infiltrator.width * (infiltrator.health / 4), 4);
    });
    
    // Render boss
    if (boss) {
        // Draw tentacles
        ctx.strokeStyle = '#008800';
        ctx.lineWidth = 10;
        boss.tentacles.forEach(tentacle => {
            ctx.beginPath();
            ctx.moveTo(boss.x + boss.width / 2, boss.y + boss.height / 2);
            const endX = boss.x + boss.width / 2 + Math.cos(tentacle.angle) * tentacle.length;
            const endY = boss.y + boss.height / 2 + Math.sin(tentacle.angle) * tentacle.length;
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Tentacle tip
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(endX, endY, 8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw boss body
        if (boss.image && boss.imageObj) {
            ctx.drawImage(boss.imageObj, boss.x, boss.y, boss.width, boss.height);
        } else {
            const healthRatio = boss.health / boss.maxHealth;
            if (healthRatio > 0.66) {
                ctx.fillStyle = '#00ff00';
            } else if (healthRatio > 0.33) {
                ctx.fillStyle = '#88ff00';
            } else {
                ctx.fillStyle = '#ffff00';
            }
            
            // Octopus body
            ctx.beginPath();
            ctx.ellipse(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.width / 2, boss.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(boss.x + boss.width / 3, boss.y + boss.height / 3, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(boss.x + boss.width * 2 / 3, boss.y + boss.height / 3, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Boss health bar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(50, 20, canvas.width - 100, 20);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(50, 20, (canvas.width - 100) * (boss.health / boss.maxHealth), 20);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(50, 20, canvas.width - 100, 20);
    }
    
    // Render game elements only when game is running
    if (!gameRunning) return;
    
    // Render bullets
    playerBullets.forEach(bullet => {
        if (bullet.laser) {
            ctx.fillStyle = '#ff0000';
            ctx.globalAlpha = bullet.life / 15;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            ctx.globalAlpha = 1;
        } else if (bullet.pulse) {
            ctx.fillStyle = bullet.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = bullet.color;
            ctx.beginPath();
            ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = bullet.color || '#00ffff';
            if (bullet.charged) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = bullet.color;
            }
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            ctx.shadowBlur = 0;
        }
    });
    
    // Render enemy bullets
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color || '#ff8800';
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (bullet.homing) {
            ctx.strokeStyle = bullet.color || '#ff8800';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    
    // Render power-ups
    powerUps.forEach(powerUp => {
        const type = powerUpTypes[powerUp.type];
        ctx.fillStyle = type.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText(type.symbol, powerUp.x + 8, powerUp.y + 22);
    });
    
    // Render particles
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life / 30;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
    
    // Danger line
    ctx.strokeStyle = '#ff0000';
    ctx.globalAlpha = 0.3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, player.y - 20);
    ctx.lineTo(canvas.width, player.y - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    
    // Pause indicator
    if (paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffff';
        ctx.font = '48px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Orbitron';
        ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
    }
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Game management functions
function startGame() {
    console.log('START GAME CLICKED! Selected ship:', selectedShip);
    
    if (!selectedShip) {
        console.error('No ship selected!');
        alert('Please select a ship first!');
        return;
    }
    
    console.log('Starting game with ship:', selectedShip);
    
    if (!audioContext) {
        initAudio();
    }
    
    // Show launch screen
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('launchScreen').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('launchScreen').style.display = 'none';
        
        // Apply ship stats
        const ship = shipTypes[selectedShip];
        player.speed = ship.speed;
        player.width = ship.width;
        player.height = ship.height;
        player.color = ship.color;
        player.shipType = selectedShip;
        player.health = ship.health;
        player.maxHealth = ship.maxHealth;
        player.shield = 0;
        player.fireRate = ship.fireRate;
        player.shieldStrength = ship.shieldStrength || 0;
        player.boostSpeed = ship.boostSpeed || 0;
        
        // Load ship image if available
        if (ship.image) {
            player.image = new Image();
            player.image.src = ship.image;
        }
        
        lives = ship.health;
        
        // Reset player position
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - player.height - 20;
        
        document.getElementById('ui').style.display = 'flex';
        document.getElementById('healthBar').style.display = 'block';
        document.getElementById('pauseMenu').style.display = 'block';
        document.getElementById('powerUpIndicator').style.display = 'block';
        document.getElementById('specialAbilityBar').style.display = 'block';
        updateHealthBar();
        updatePowerUpIndicator();
        gameRunning = true;
        gameStarted = true;
        playBackgroundMusic(1);
        createEnemies(1);
        
        // Load enemy images
        infiltrators.forEach(infiltrator => {
            if (infiltrator.image) {
                infiltrator.imageObj = new Image();
                infiltrator.imageObj.src = infiltrator.image;
            }
        });
    }, 2000);
}

function togglePause() {
    paused = !paused;
    if (paused) {
        document.querySelector('.menuButton').textContent = 'RESUME';
    } else {
        document.querySelector('.menuButton').textContent = 'PAUSE';
    }
}

function backToMenu() {
    gameRunning = false;
    gameStarted = false;
    paused = false;
    if (window.musicInterval) {
        clearInterval(window.musicInterval);
    }
    
    // Reset everything
    score = 0;
    currentLevel = 1;
    player.x = canvas.width / 2 - 30;
    player.powerUps = [];
    player.invulnerable = false;
    player.invisible = false;
    player.phasing = false;
    player.shield = 0;
    player.specialCooldown = 0;
    playerBullets = [];
    enemyBullets = [];
    powerUps = [];
    particles = [];
    enemies = [];
    enemyFighters = [];
    infiltrators = [];
    boss = null;
    chargeLevel = 0;
    charging = false;
    endlessMode = false;
    currentWave = 0;
    enemyWaveSpawnTimer = 0;
    
    // Hide game UI
    document.getElementById('ui').style.display = 'none';
    document.getElementById('healthBar').style.display = 'none';
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('powerUpIndicator').style.display = 'none';
    document.getElementById('specialAbilityBar').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    
    // Show start screen
    document.getElementById('startScreen').style.display = 'flex';
    selectedShip = null;
    document.querySelectorAll('.ship-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.getElementById('startButton').disabled = true;
    document.getElementById('startButton').textContent = 'SELECT A SHIP TO BEGIN';
}

function showLevelComplete() {
    gameRunning = false;
    
    // Show "not-thisguy.png" screen after first round
    if (currentLevel === 1) {
        showNotThisGuyScreen();
    } else {
        document.getElementById('nextLevel').textContent = currentLevel + 1;
        document.getElementById('levelComplete').style.display = 'block';
    }
}

function showNotThisGuyScreen() {
    // Create the "not-thisguy" screen
    const notThisGuyScreen = document.createElement('div');
    notThisGuyScreen.id = 'notThisGuyScreen';
    notThisGuyScreen.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #000;
        z-index: 200;
    `;
    
    const img = document.createElement('img');
    img.src = 'assets/screens/not-thisguy.png';
    img.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    `;
    
    // Add skip button like intro screens
    const skipButton = document.createElement('button');
    skipButton.textContent = 'Skip';
    skipButton.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        font-size: 16px;
        font-family: 'Orbitron', monospace;
        background: transparent;
        color: #00ffff;
        border: 2px solid #00ffff;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 2px;
        z-index: 201;
    `;
    
    skipButton.onmouseover = () => {
        skipButton.style.background = '#00ffff';
        skipButton.style.color = '#000';
        skipButton.style.boxShadow = '0 0 20px #00ffff';
        skipButton.style.transform = 'scale(1.1)';
    };
    
    skipButton.onmouseout = () => {
        skipButton.style.background = 'transparent';
        skipButton.style.color = '#00ffff';
        skipButton.style.boxShadow = 'none';
        skipButton.style.transform = 'scale(1)';
    };
    
    // Function to advance to next level directly
    function advanceToNextLevel() {
        document.getElementById('gameContainer').removeChild(notThisGuyScreen);
        nextLevel(); // Go directly to level 2
    }
    
    skipButton.onclick = advanceToNextLevel;
    
    notThisGuyScreen.appendChild(img);
    notThisGuyScreen.appendChild(skipButton);
    document.getElementById('gameContainer').appendChild(notThisGuyScreen);
    
    // Auto-advance after 3 seconds like intro screens
    setTimeout(() => {
        if (document.getElementById('notThisGuyScreen')) {
            advanceToNextLevel();
        }
    }, 3000);
}

function nextLevel() {
    currentLevel++;
    gameRunning = true;
    document.getElementById('levelComplete').style.display = 'none';
    playerBullets = [];
    enemyBullets = [];
    powerUps = [];
    particles = [];
    enemyDirection = 1;
    
    // Reset player position and ensure visibility
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 20;
    player.invisible = false;
    player.invulnerable = false;
    player.phasing = false;
    
    // Restore some health for next level
    player.health = Math.min(player.health + 1, player.maxHealth);
    updateHealthBar();
    
    // Show UI elements
    document.getElementById('ui').style.display = 'flex';
    document.getElementById('healthBar').style.display = 'block';
    
    playBackgroundMusic(currentLevel);
    
    if (currentLevel === 3) {
        createBoss();
        if (boss && boss.image) {
            boss.imageObj = new Image();
            boss.imageObj.src = boss.image;
        }
    } else {
        createEnemies(currentLevel);
    }
}

function gameOver(reason = 'Your ship was destroyed!') {
    gameRunning = false;
    if (window.musicInterval) {
        clearInterval(window.musicInterval);
    }
    document.getElementById('gameOverReason').textContent = reason;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function showVictory() {
    gameRunning = false;
    if (window.musicInterval) {
        clearInterval(window.musicInterval);
    }
    document.getElementById('victoryScore').textContent = score;
    document.getElementById('victory').style.display = 'block';
}

function showBlackholeTransition() {
    gameRunning = false;
    document.getElementById('blackholeScreen').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('blackholeScreen').style.display = 'none';
        
        // Show "Not this guy again" screen
        const notThisGuyScreen = document.createElement('div');
        notThisGuyScreen.id = 'notThisGuyScreen';
        notThisGuyScreen.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #000;
            z-index: 200;
        `;
        notThisGuyScreen.innerHTML = '<img src="assets/screens/not-thisguy.png" style="max-width: 100%; max-height: 100%;">';
        document.getElementById('gameContainer').appendChild(notThisGuyScreen);
        
        setTimeout(() => {
            notThisGuyScreen.remove();
            startShmupMode();
        }, 3000);
    }, 4000);
}

function startShmupMode() {
    currentLevel = 4;
    shmupMode = true;
    shmupStage = 1;
    shmupRound = 1;
    shmupWaveSpawned = false;
    shmupStageTimer = 0;
    gameRunning = true;
    
    // Reset variables for shmup mode
    enemies = [];
    enemyBullets = [];
    infiltrators = [];
    shmupEnemies = [];
    
    // Initialize shmup background
    initShmupBackground();
    
    // Start shmup music
    playBackgroundMusic(4);
    
    // Update UI
    document.getElementById('level').textContent = `STAGE ${shmupStage} - ROUND ${shmupRound}`;
    
    // Load enemy images
    loadShmupEnemyImages();
    
    // Start spawning shmup enemies
    spawnShmupWave();
}

// Initialize shmup background
function initShmupBackground() {
    // Create gradient background for shmup mode
    shmupBackground = ctx.createLinearGradient(0, 0, 0, canvas.height);
    shmupBackground.addColorStop(0, '#001a33');
    shmupBackground.addColorStop(0.5, '#003366');
    shmupBackground.addColorStop(1, '#004080');
    
    // Initialize scrolling background elements
    backgroundStars = [];
    backgroundClouds = [];
    backgroundPlanets = [];
    backgroundDebris = [];
    
    // Create background stars (fast moving)
    for (let i = 0; i < 100; i++) {
        backgroundStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 3 + 2,
            brightness: Math.random() * 0.8 + 0.2
        });
    }
    
    // Create background clouds/nebula (medium speed)
    for (let i = 0; i < 15; i++) {
        backgroundClouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 80 + 40,
            speed: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1,
            color: `hsl(${Math.random() * 60 + 200}, 50%, 30%)`
        });
    }
    
    // Create background planets (slow moving)
    for (let i = 0; i < 3; i++) {
        backgroundPlanets.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 2 + canvas.height, // Start below screen
            size: Math.random() * 150 + 100,
            speed: Math.random() * 0.8 + 0.2,
            color: `hsl(${Math.random() * 360}, 40%, 40%)`,
            rings: Math.random() < 0.3 // 30% chance of rings
        });
    }
    
    // Create space debris (variable speed)
    for (let i = 0; i < 20; i++) {
        backgroundDebris.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            speed: Math.random() * 2 + 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            color: '#444444'
        });
    }
}

// Load shmup enemy images
function loadShmupEnemyImages() {
    Object.entries(shmupEnemyTypes).forEach(([key, enemy]) => {
        if (enemy.image) {
            const img = new Image();
            img.src = enemy.image;
            enemy.imageObj = img;
        }
    });
}

// Spawn shmup enemies
function spawnShmupWave() {
    if (shmupStage === 1) {
        // Stage 1: Progressive difficulty with 3 rounds
        if (shmupRound === 1) {
            // Round 1: Basic enemies
            spawnShmupEnemy('smallPlane', canvas.width * 0.2, -50);
            spawnShmupEnemy('smallPlane', canvas.width * 0.8, -50);
            setTimeout(() => {
                spawnShmupEnemy('circleEnemy', canvas.width * 0.5, -100);
            }, 1500);
        } else if (shmupRound === 2) {
            // Round 2: Medium enemies
            spawnShmupEnemy('bigPlane', canvas.width * 0.3, -50);
            spawnShmupEnemy('bigPlane', canvas.width * 0.7, -50);
            setTimeout(() => {
                spawnShmupEnemy('blackOrange', canvas.width * 0.5, -100);
                spawnShmupEnemy('circleEnemy', canvas.width * 0.2, -150);
                spawnShmupEnemy('circleEnemy', canvas.width * 0.8, -150);
            }, 2000);
        } else if (shmupRound === 3) {
            // Round 3: Mixed formation
            for (let i = 0; i < 4; i++) {
                spawnShmupEnemy('smallPlane', (i + 1) * canvas.width / 5, -50 - i * 40);
            }
            setTimeout(() => {
                spawnShmupEnemy('complexCircle', canvas.width * 0.5, -200);
            }, 2500);
        }
        
    } else if (shmupStage === 2) {
        // Stage 2: Heavier enemies with 3 rounds
        if (shmupRound === 1) {
            // Round 1: Side attackers
            spawnShmupEnemy('sideShooter', -100, 150);
            spawnShmupEnemy('niceRed', canvas.width * 0.5, -100);
            setTimeout(() => {
                spawnShmupEnemy('complexCircle', canvas.width * 0.3, -50);
                spawnShmupEnemy('complexCircle', canvas.width * 0.7, -50);
            }, 2000);
        } else if (shmupRound === 2) {
            // Round 2: Space station assault
            spawnShmupEnemy('spaceStation', canvas.width * 0.5, -150);
            setTimeout(() => {
                spawnShmupEnemy('blackOrange', canvas.width * 0.2, -50);
                spawnShmupEnemy('blackOrange', canvas.width * 0.8, -50);
                spawnShmupEnemy('niceRed', canvas.width * 0.5, -100);
            }, 3000);
        } else if (shmupRound === 3) {
            // Round 3: Heavy formation
            spawnShmupEnemy('spaceStation', canvas.width * 0.3, -100);
            spawnShmupEnemy('sideShooter', canvas.width + 50, 100);
            setTimeout(() => {
                for (let i = 0; i < 3; i++) {
                    spawnShmupEnemy('niceRed', (i + 1) * canvas.width / 4, -150 - i * 50);
                }
            }, 2000);
        }
        
    } else if (shmupStage === 3) {
        // Stage 3: Final assault with 3 rounds
        if (shmupRound === 1) {
            // Round 1: Triple threat
            spawnShmupEnemy('tripleEnemy', canvas.width * 0.5, -100);
            spawnShmupEnemy('spaceStation', canvas.width * 0.2, -200);
            spawnShmupEnemy('spaceStation', canvas.width * 0.8, -200);
            setTimeout(() => {
                for (let i = 0; i < 5; i++) {
                    spawnShmupEnemy('blackOrange', (i + 1) * canvas.width / 6, -50 - i * 30);
                }
            }, 2000);
        } else if (shmupRound === 2) {
            // Round 2: Pincer attack
            spawnShmupEnemy('sideShooter', -100, 100);
            spawnShmupEnemy('sideShooter', canvas.width + 50, 150);
            spawnShmupEnemy('tripleEnemy', canvas.width * 0.5, -100);
            setTimeout(() => {
                spawnShmupEnemy('spaceStation', canvas.width * 0.5, -200);
                for (let i = 0; i < 4; i++) {
                    spawnShmupEnemy('complexCircle', (i + 1) * canvas.width / 5, -150 - i * 40);
                }
            }, 3000);
        } else if (shmupRound === 3) {
            // Round 3: Final chaos
            spawnShmupEnemy('tripleEnemy', canvas.width * 0.3, -50);
            spawnShmupEnemy('tripleEnemy', canvas.width * 0.7, -50);
            spawnShmupEnemy('spaceStation', canvas.width * 0.5, -150);
            setTimeout(() => {
                spawnShmupEnemy('sideShooter', -100, 120);
                spawnShmupEnemy('sideShooter', canvas.width + 50, 180);
                for (let i = 0; i < 6; i++) {
                    spawnShmupEnemy('niceRed', (i + 1) * canvas.width / 7, -200 - i * 35);
                }
            }, 2500);
        }
    }
}

function spawnShmupEnemy(type, x, y) {
    const enemyType = shmupEnemyTypes[type];
    shmupEnemies.push({
        type: type,
        x: x,
        y: y,
        width: 60,
        height: 50,
        health: enemyType.health,
        maxHealth: enemyType.health,
        speed: enemyType.speed,
        movePattern: enemyType.movePattern,
        fireRate: enemyType.fireRate,
        shootTimer: 0,
        moveTimer: 0,
        image: enemyType.image,
        imageObj: enemyType.imageObj,
        color: enemyType.color,
        points: enemyType.points,
        active: true
    });
}

// Update shmup mode
function updateShmupMode() {
    // Update multi-layered scrolling background
    backgroundY += 2;
    if (backgroundY > canvas.height) backgroundY = 0;
    
    // Update background stars (fastest layer)
    backgroundStars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height + star.size) {
            star.y = -star.size;
            star.x = Math.random() * canvas.width;
        }
    });
    
    // Update background clouds (medium speed)
    backgroundClouds.forEach(cloud => {
        cloud.y += cloud.speed;
        if (cloud.y > canvas.height + cloud.size) {
            cloud.y = -cloud.size;
            cloud.x = Math.random() * canvas.width;
        }
    });
    
    // Update background planets (slowest layer)
    backgroundPlanets.forEach(planet => {
        planet.y += planet.speed;
        if (planet.y > canvas.height + planet.size) {
            planet.y = -planet.size - Math.random() * canvas.height;
            planet.x = Math.random() * canvas.width;
            // Generate new planet properties
            planet.size = Math.random() * 150 + 100;
            planet.color = `hsl(${Math.random() * 360}, 40%, 40%)`;
            planet.rings = Math.random() < 0.3;
        }
    });
    
    // Update space debris (rotating and moving)
    backgroundDebris.forEach(debris => {
        debris.y += debris.speed;
        debris.rotation += debris.rotationSpeed;
        if (debris.y > canvas.height + debris.height) {
            debris.y = -debris.height;
            debris.x = Math.random() * canvas.width;
        }
    });
    
    // Update shmup enemies
    shmupEnemies = shmupEnemies.filter(enemy => {
        enemy.moveTimer++;
        
        // Movement patterns
        switch (enemy.movePattern) {
            case 'straight':
                enemy.y += enemy.speed;
                break;
            case 'sine':
                enemy.y += enemy.speed;
                enemy.x += Math.sin(enemy.moveTimer * 0.05) * 2;
                break;
            case 'circle':
                enemy.y += enemy.speed * 0.5;
                enemy.x += Math.cos(enemy.moveTimer * 0.1) * 3;
                break;
            case 'complex':
                enemy.y += enemy.speed;
                enemy.x += Math.sin(enemy.moveTimer * 0.05) * Math.cos(enemy.moveTimer * 0.02) * 4;
                break;
            case 'dive':
                if (enemy.y < canvas.height * 0.3) {
                    enemy.y += enemy.speed;
                } else {
                    enemy.y += enemy.speed * 3;
                    const dx = player.x - enemy.x;
                    enemy.x += Math.sign(dx) * Math.min(Math.abs(dx), enemy.speed);
                }
                break;
            case 'hover':
                if (enemy.y < 150) {
                    enemy.y += enemy.speed;
                } else {
                    enemy.x += Math.sin(enemy.moveTimer * 0.03) * 2;
                }
                break;
            case 'formation':
                enemy.y += enemy.speed;
                if (enemy.moveTimer % 60 < 30) {
                    enemy.x += enemy.speed;
                } else {
                    enemy.x -= enemy.speed;
                }
                break;
            case 'station':
                if (enemy.y < 100) {
                    enemy.y += enemy.speed;
                } else {
                    // Rotate slowly
                    enemy.rotation = (enemy.rotation || 0) + 0.01;
                }
                break;
            case 'side':
                if (enemy.x < 0) {
                    enemy.x += enemy.speed * 2;
                } else if (enemy.x > canvas.width - enemy.width) {
                    enemy.x -= enemy.speed * 2;
                }
                if (enemy.y < 150) {
                    enemy.y += enemy.speed;
                }
                break;
        }
        
        // Enemy shooting
        enemy.shootTimer++;
        if (enemy.shootTimer > 60 / enemy.fireRate) {
            if (enemy.type === 'tripleEnemy') {
                // Triple shot
                for (let i = -1; i <= 1; i++) {
                    enemyBullets.push({
                        x: enemy.x + enemy.width / 2,
                        y: enemy.y + enemy.height,
                        width: 6,
                        height: 12,
                        speed: 4,
                        angle: i * 0.3,
                        circular: false,
                        color: '#ff8800'
                    });
                }
            } else if (enemy.type === 'spaceStation' && enemy.rotation) {
                // Rotating shots
                for (let i = 0; i < 4; i++) {
                    const angle = enemy.rotation + (i * Math.PI / 2);
                    enemyBullets.push({
                        x: enemy.x + enemy.width / 2,
                        y: enemy.y + enemy.height / 2,
                        width: 8,
                        height: 8,
                        speed: 3,
                        angle: Math.cos(angle) * 3,
                        angleY: Math.sin(angle) * 3,
                        circular: true,
                        color: '#00ff00'
                    });
                }
            } else {
                // Normal shot
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height,
                    width: 6,
                    height: 10,
                    speed: 5,
                    circular: false,
                    color: '#ffff00'
                });
            }
            enemy.shootTimer = 0;
        }
        
        // Remove if off screen or dead
        if (enemy.y > canvas.height + 100 || enemy.health <= 0) {
            if (enemy.health <= 0) {
                score += shmupEnemyTypes[enemy.type].points;
                createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff8800', 20);
                playExplosionSound();
                
                // Drop power-ups
                if (Math.random() < 0.3) {
                    const types = Object.keys(powerUpTypes);
                    const type = types[Math.floor(Math.random() * types.length)];
                    powerUps.push({
                        x: enemy.x + enemy.width / 2 - 15,
                        y: enemy.y,
                        width: 30,
                        height: 30,
                        type: type,
                        speed: 2
                    });
                }
            }
            return false;
        }
        return true;
    });
    
    // Check for round/stage completion
    if (shmupEnemies.length === 0 && !shmupWaveSpawned) {
        shmupWaveSpawned = true;
        shmupStageTimer = 0;
        
        if (shmupRound < 3) {
            // Next round in current stage
            shmupRound++;
            document.getElementById('level').textContent = `STAGE ${shmupStage} - ROUND ${shmupRound}`;
            setTimeout(() => {
                shmupWaveSpawned = false;
                spawnShmupWave();
            }, 2000);
        } else {
            // Complete stage, move to next
            shmupStage++;
            shmupRound = 1;
            
            if (shmupStage > 3) {
                // End of shmup mode after 3 stages
                gameRunning = false;
                const endScreen = document.createElement('div');
                endScreen.style.cssText = `
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.9);
                    color: #00ffff;
                    font-family: 'Orbitron', monospace;
                    z-index: 200;
                `;
                endScreen.innerHTML = `
                    <h1 style="font-size: 48px; margin: 20px;">PILOT SURVIVED!</h1>
                    <h2 style="font-size: 32px; margin: 20px;">All Stages Completed</h2>
                    <p style="font-size: 24px; margin: 20px;">Final Score: ${score}</p>
                    <button onclick="resetGame()" style="
                        padding: 15px 30px;
                        font-size: 20px;
                        background: #00ffff;
                        border: none;
                        color: #000;
                        cursor: pointer;
                        font-family: 'Orbitron', monospace;
                        margin-top: 20px;
                    ">PLAY AGAIN</button>
                `;
                document.getElementById('gameContainer').appendChild(endScreen);
            } else {
                // Next stage
                document.getElementById('level').textContent = `STAGE ${shmupStage} - ROUND ${shmupRound}`;
                // Change music for new stage
                playBackgroundMusic(3 + shmupStage);
                setTimeout(() => {
                    shmupWaveSpawned = false;
                    spawnShmupWave();
                }, 3000);
            }
        }
    }
    
    // Timer for additional wave spawning if needed
    shmupStageTimer++;
    
    // Spawn additional enemies if taking too long (every 10 seconds)
    if (shmupEnemies.length > 0 && shmupEnemies.length < 2 && shmupStageTimer > 600 && !shmupWaveSpawned) {
        shmupStageTimer = 0;
        // Spawn a few more enemies to keep the action going
        spawnShmupEnemy('smallPlane', Math.random() * canvas.width, -50);
        spawnShmupEnemy('circleEnemy', Math.random() * canvas.width, -100);
    }
}

function resetGame() {
    score = 0;
    currentLevel = 1;
    gameRunning = true;
    player.x = canvas.width / 2 - player.width / 2;
    player.powerUps = [];
    player.invulnerable = false;
    player.invisible = false;
    player.phasing = false;
    player.shield = 0;
    player.specialCooldown = 0;
    playerBullets = [];
    enemyBullets = [];
    powerUps = [];
    particles = [];
    boss = null;
    enemyDirection = 1;
    enemySpeed = 0.5;
    dropSpeed = 10;
    chargeLevel = 0;
    charging = false;
    endlessMode = false;
    currentWave = 0;
    enemyWaveSpawnTimer = 0;
    
    // Reset shmup mode
    shmupMode = false;
    shmupStage = 1;
    shmupRound = 1;
    shmupEnemies = [];
    backgroundY = 0;
    shmupWaveSpawned = false;
    shmupStageTimer = 0;
    
    // Reset health
    player.health = player.maxHealth;
    updateHealthBar();
    updatePowerUpIndicator();
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
    
    // Remove any custom end screens
    const endScreens = document.querySelectorAll('#gameContainer > div[style*="z-index: 200"]');
    endScreens.forEach(screen => screen.remove());
    
    playBackgroundMusic(1);
    createEnemies(1);
}

// Initialize game
window.onload = function() {
    initializeShipSelection();
    startIntroSequence();
    gameLoop();
};

// Make functions globally accessible
window.selectShip = selectShip;
window.startGame = startGame;
window.togglePause = togglePause;
window.backToMenu = backToMenu;
window.nextLevel = nextLevel;
window.resetGame = resetGame;
window.toggleSound = toggleSound;
window.skipToMenu = skipToMenu;

// Test function to debug UI interactions
window.debugClick = function() {
    console.log('Testing UI interactions...');
    const startButton = document.getElementById('startButton');
    const shipGrid = document.getElementById('shipGrid');
    const startScreen = document.getElementById('startScreen');
    
    console.log('Start button:', startButton, 'Disabled:', startButton?.disabled);
    console.log('Ship grid:', shipGrid, 'Children:', shipGrid?.children.length);
    console.log('Start screen display:', startScreen?.style.display);
    console.log('Start screen visibility:', getComputedStyle(startScreen).display);
    
    // Test ship selection
    console.log('Available ships:', Object.keys(shipTypes));
    if (shipGrid?.children.length > 0) {
        console.log('First ship element:', shipGrid.children[0]);
        console.log('First ship data-ship:', shipGrid.children[0].getAttribute('data-ship'));
    }
};