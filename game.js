// Game configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

// Set canvas to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Create starfield background
for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = Math.random() * 3 + 'px';
    star.style.height = star.style.width;
    star.style.left = Math.random() * window.innerWidth + 'px';
    star.style.top = Math.random() * window.innerHeight + 'px';
    star.style.animationDelay = Math.random() * 3 + 's';
    gameContainer.appendChild(star);
}

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

// Level-specific background music
function playBackgroundMusic(level) {
    if (!soundEnabled || !audioContext) return;
    
    const levelPatterns = [
        [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63], // Level 1
        [146.83, 164.81, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63], // Level 2
        [98.00, 110.00, 123.47, 130.81, 146.83, 164.81, 196.00, 220.00]   // Level 3 (boss)
    ];
    
    const notes = levelPatterns[Math.min(level - 1, 2)];
    let noteIndex = 0;
    
    if (window.musicInterval) {
        clearInterval(window.musicInterval);
    }
    
    window.musicInterval = setInterval(() => {
        if (soundEnabled && gameRunning && !paused) {
            playSound(notes[noteIndex], 0.1, 'sine', 0.05);
            if (level === 3) {
                playSound(notes[noteIndex] / 2, 0.15, 'triangle', 0.03);
            }
            noteIndex = (noteIndex + 1) % notes.length;
        }
    }, 200);
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

// Player object
let player = {
    x: window.innerWidth / 2 - 30,
    y: window.innerHeight - 80,
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
    setTimeout(() => {
        document.getElementById('introScreen').style.display = 'none';
        document.getElementById('storyScreen').style.display = 'flex';
        
        setTimeout(() => {
            document.getElementById('storyScreen').style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';
            introSequenceComplete = true;
        }, 3000);
    }, 3000);
}

function skipToMenu() {
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
    const rows = 3 + Math.floor(level / 2);
    const cols = 8;
    
    enemySpeed = 0.5 + (level - 1) * 0.2;
    dropSpeed = 10 + (level - 1) * 5;
    
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
        const infiltratorCount = level - 1;
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
        health: 60,
        maxHealth: 60,
        speed: 1,
        direction: 1,
        shootTimer: 0,
        tentacleTimer: 0,
        phase: 1,
        color: '#00ff00',
        image: 'assets/enemies/octopus_boss.png',
        tentacles: [],
        entering: true
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
        bullet.y += bullet.speed;
        if (bullet.angle) {
            bullet.x += bullet.angle * bullet.speed;
        }
        if (bullet.homing && !player.invisible) {
            const dx = player.x + player.width / 2 - bullet.x;
            const dy = player.y + player.height / 2 - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                bullet.x += (dx / dist) * 2;
            }
        }
        return bullet.y < canvas.height + 10;
    });
    
    // Update enemies
    if (currentLevel < 3) {
        let shouldDrop = false;
        
        enemies.forEach(enemy => {
            enemy.x += enemyTypes[enemy.type].speed * enemyDirection * enemySpeed;
            
            if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                shouldDrop = true;
            }
            
            if (enemy.y + enemy.height >= canvas.height - 100) {
                gameOver('The aliens have invaded!');
            }
            
            // Enemy shooting (reduced frequency)
            if (enemy.type === 'shooter' && Math.random() < 0.008) {
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 4,
                    y: enemy.y + enemy.height,
                    width: 6,
                    height: 6,
                    speed: 2,
                    circular: true
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
                // Move to behind player formation
                const targetX = player.x + player.width / 2 - infiltrator.width / 2;
                const targetY = player.y + 50;
                
                const dx = targetX - infiltrator.x;
                const dy = targetY - infiltrator.y;
                
                infiltrator.x += Math.sign(dx) * Math.min(Math.abs(dx), infiltrator.speed * 1.5);
                infiltrator.y += Math.sign(dy) * Math.min(Math.abs(dy), infiltrator.speed);
                
                if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                    infiltrator.state = 'combat';
                    infiltrator.rapidFireTime = 0;
                }
            } else if (infiltrator.state === 'combat') {
                // Stay behind player but maintain some distance
                const targetX = player.x + player.width / 2 - infiltrator.width / 2;
                const dx = targetX - infiltrator.x;
                infiltrator.x += Math.sign(dx) * Math.min(Math.abs(dx), infiltrator.speed * 0.8);
                
                // Smart targeting system
                infiltrator.rapidFireTime++;
                
                if (infiltrator.targetingEnemies && enemies.length > 0) {
                    // Target middle enemies first (most dangerous to player)
                    const centerEnemies = enemies.filter(enemy => 
                        enemy.x > canvas.width * 0.3 && enemy.x < canvas.width * 0.7
                    );
                    const targets = centerEnemies.length > 0 ? centerEnemies : enemies;
                    
                    if (infiltrator.rapidFireTime % 20 === 0) {
                        // Pick closest enemy to player
                        let closestEnemy = targets[0];
                        let minDist = Infinity;
                        
                        targets.forEach(enemy => {
                            const dist = Math.abs(enemy.y - player.y);
                            if (dist < minDist) {
                                minDist = dist;
                                closestEnemy = enemy;
                            }
                        });
                        
                        if (closestEnemy) {
                            // Fire weapon based on weapon level
                            if (infiltrator.weaponLevel >= 3) {
                                // Level 3: Spread shot
                                for (let i = -1; i <= 1; i++) {
                                    playerBullets.push({
                                        x: infiltrator.x + infiltrator.width / 2,
                                        y: infiltrator.y,
                                        width: 8,
                                        height: 8,
                                        speed: 12,
                                        damage: 2,
                                        angle: i * 0.2,
                                        fromInfiltrator: true,
                                        color: '#ff0066'
                                    });
                                }
                            } else {
                                // Level 2: Single shot
                                const angle = Math.atan2(closestEnemy.y - infiltrator.y, closestEnemy.x - infiltrator.x);
                                playerBullets.push({
                                    x: infiltrator.x + infiltrator.width / 2,
                                    y: infiltrator.y,
                                    width: 6,
                                    height: 6,
                                    speed: 10,
                                    damage: 1,
                                    angle: Math.cos(angle) * 10,
                                    angleY: Math.sin(angle) * 10,
                                    fromInfiltrator: true,
                                    color: '#8800ff'
                                });
                            }
                        }
                    }
                }
                
                // Occasionally attack player (less frequently)
                if (Math.random() < 0.005 && !player.invisible) {
                    enemyBullets.push({
                        x: infiltrator.x + infiltrator.width / 2,
                        y: infiltrator.y,
                        width: 6,
                        height: 6,
                        speed: 3,
                        circular: true,
                        color: '#ff0066'
                    });
                }
                
                // Switch targeting if no enemies left
                if (enemies.length === 0) {
                    infiltrator.targetingEnemies = false;
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
            if (boss.shootTimer > 120) { // Slower attack rate
                const healthRatio = boss.health / boss.maxHealth;
                
                if (healthRatio > 0.66) {
                    // Phase 1: Ink spray (reduced bullets)
                    for (let i = 0; i < 5; i++) {
                        const angle = (i / 5) * Math.PI + Math.PI * 0.5;
                        enemyBullets.push({
                            x: boss.x + boss.width / 2,
                            y: boss.y + boss.height / 2,
                            width: 10,
                            height: 10,
                            speed: 2,
                            angle: Math.cos(angle) * 2,
                            circular: true,
                            color: '#00ff00'
                        });
                    }
                } else if (healthRatio > 0.33) {
                    // Phase 2: Homing missiles (fewer)
                    for (let i = 0; i < 2; i++) {
                        enemyBullets.push({
                            x: boss.x + boss.width / 2 + (i - 0.5) * 80,
                            y: boss.y + boss.height,
                            width: 8,
                            height: 8,
                            speed: 1.5,
                            circular: true,
                            homing: true,
                            color: '#88ff00'
                        });
                    }
                } else {
                    // Phase 3: Spread pattern (not bullet hell)
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        enemyBullets.push({
                            x: boss.x + boss.width / 2,
                            y: boss.y + boss.height / 2,
                            width: 6,
                            height: 6,
                            speed: 2.5,
                            angle: Math.cos(angle) * 2.5,
                            circular: true,
                            color: '#ffff00'
                        });
                    }
                }
                boss.shootTimer = 0;
            }
        }
    }
    
    // Collision detection - Player bullets vs enemies
    playerBullets.forEach((bullet, bulletIndex) => {
        if (bullet.fromInfiltrator) {
            bullet.x += bullet.angle || 0;
            bullet.y += bullet.angleY || -bullet.speed;
        } else if (bullet.angle && !bullet.laser && !bullet.pulse) {
            bullet.x += bullet.angle * bullet.speed;
        }
        
        // Check normal enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                enemy.health -= bullet.damage || 1;
                if (!bullet.laser && !bullet.pulse) {
                    playerBullets.splice(bulletIndex, 1);
                }
                
                if (enemy.health <= 0) {
                    score += enemyTypes[enemy.type].points;
                    createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemyTypes[enemy.type].color);
                    enemies.splice(enemyIndex, 1);
                    playExplosionSound();
                    
                    // Power-up drop
                    if (Math.random() < 0.2) {
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
                    showVictory();
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
    
    // Check level completion
    if (currentLevel < 3 && enemies.length === 0 && enemyFighters.length === 0 && infiltrators.length === 0) {
        showLevelComplete();
    }
    
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
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render player
    if (!player.invisible || Math.floor(Date.now() / 100) % 2) {
        const alpha = (player.invulnerable && Math.floor(Date.now() / 100) % 2) ? 0.5 : 1;
        drawShip(player.x, player.y, player.shipType, player.color, alpha);
    }
    
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
    
    // Render enemies
    enemies.forEach(enemy => {
        const type = enemyTypes[enemy.type];
        ctx.fillStyle = type.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        if (enemy.maxHealth > 1) {
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
    if (!selectedShip) return;
    
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
        
        gameLoop();
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
    document.getElementById('nextLevel').textContent = currentLevel + 1;
    document.getElementById('levelComplete').style.display = 'block';
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
    
    // Restore some health for next level
    player.health = Math.min(player.health + 1, player.maxHealth);
    updateHealthBar();
    
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
    
    // Reset health
    player.health = player.maxHealth;
    updateHealthBar();
    updatePowerUpIndicator();
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
    
    playBackgroundMusic(1);
    createEnemies(1);
}

// Initialize game
window.onload = function() {
    initializeShipSelection();
    startIntroSequence();
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