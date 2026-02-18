/**
 * STARBUGS - 3D Space Shooter Game
 *
 * A Three.js-based space shooter with wave-based enemy spawning,
 * collision detection, scoring, and game over handling.
 * Features keyboard and touch controls.
 */
let scene, camera, renderer, player, enemies = [], bullets = [];
let score = 0;
let gameRunning = false;
let spawnInterval = null;
let animationId = null;
const loader = new THREE.GLTFLoader();

// Track held keys for smooth movement
const keysPressed = {};

document.addEventListener("DOMContentLoaded", function () {
    init();
    showModal("starbugs", "Press 'Start' to begin the game.");
});

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(0, -15, 15);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Load the skybox texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('static/models/galaxy.jpg', function (texture) {
        const skyboxGeometry = new THREE.SphereGeometry(45, 32, 32);
        const skyboxMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        scene.add(skybox);
    });

    loader.load('static/models/player.glb', function (gltf) {
        player = gltf.scene;
        player.traverse(function (node) {
            if (node.isMesh) {
                node.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
            }
        });
        player.position.set(0, -10, 0);
        player.scale.set(0.2, 0.2, 0.2);
        player.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(player);
    });

    document.getElementById('start-button').addEventListener('click', startGame);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('touchstart', onTouchStart, false);
    document.addEventListener('touchmove', onTouchMove, false);

    window.addEventListener('resize', onWindowResize);

    camera.updateProjectionMatrix();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function startGame() {
    document.getElementById('modal').style.display = 'none';
    resetGame();
    gameRunning = true;
    updateScoreDisplay();
    animate();
    startSpawningWaves();
}

function resetGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
    }

    enemies.forEach(function (enemy) { scene.remove(enemy); });
    bullets.forEach(function (bullet) { scene.remove(bullet); });
    enemies = [];
    bullets = [];
    score = 0;

    if (player) {
        player.position.set(0, -10, 0);
    }
}

/** Spawn a wave of 1-3 enemies at random X positions along the top */
function spawnWave() {
    if (!gameRunning) return;
    var numEnemies = Math.floor(Math.random() * 3) + 1;
    var usedX = [];
    var minSpacing = 2.0;

    for (var n = 0; n < numEnemies; n++) {
        var startX, attempts = 0;
        do {
            startX = (Math.random() * 20) - 10;
            attempts++;
        } while (usedX.some(function (x) { return Math.abs(x - startX) < minSpacing; }) && attempts < 25);

        usedX.push(startX);

        (function (x) {
            loader.load('static/models/enemy.glb', function (gltf) {
                var enemy = gltf.scene;
                enemy.traverse(function (node) {
                    if (node.isMesh) {
                        node.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
                    }
                });
                enemy.position.set(x, 12, 0);
                enemy.scale.set(0.1, 0.1, 0.1);
                enemy.rotation.set(Math.PI / 2, 0, 0);
                scene.add(enemy);
                enemies.push(enemy);
            });
        })(startX);
    }
}

function startSpawningWaves() {
    spawnWave();
    spawnInterval = setInterval(spawnWave, 5000);
}

function moveEnemies() {
    if (!player) return;
    for (var i = enemies.length - 1; i >= 0; i--) {
        enemies[i].position.y -= 0.03;

        // Remove enemies that move off-screen
        if (enemies[i].position.y < -12) {
            scene.remove(enemies[i]);
            enemies.splice(i, 1);
            continue;
        }

        // Check collision with player
        var dx = player.position.x - enemies[i].position.x;
        var dy = player.position.y - enemies[i].position.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.8) {
            gameOver();
            return;
        }
    }
}

function gameOver() {
    gameRunning = false;
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
    }
    showModal("Game Over", "Score: " + score + ". Press 'Start' to play again.");
}

function updateScoreDisplay() {
    var el = document.getElementById('score-display');
    if (el) {
        el.innerText = "Score: " + score;
        el.style.display = gameRunning ? 'block' : 'none';
    }
}

function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal').style.display = 'flex';
    var el = document.getElementById('score-display');
    if (el) el.style.display = 'none';
}

function animate() {
    if (!gameRunning) return;
    animationId = requestAnimationFrame(animate);
    handleSmoothMovement();
    updateBullets();
    moveEnemies();
    checkCollisions();
    renderer.render(scene, camera);
}

function handleSmoothMovement() {
    if (!player) return;
    var speed = 0.15;
    if (keysPressed['ArrowLeft'] || keysPressed['a']) {
        if (player.position.x > -9) player.position.x -= speed;
    }
    if (keysPressed['ArrowRight'] || keysPressed['d']) {
        if (player.position.x < 9) player.position.x += speed;
    }
}

function onKeyDown(event) {
    keysPressed[event.key] = true;
    if (event.key === ' ') {
        event.preventDefault();
        if (gameRunning) shootBullet();
    }
}

function onKeyUp(event) {
    keysPressed[event.key] = false;
}

function shootBullet() {
    if (!player || !gameRunning) return;
    var bulletGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    var bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    var offset = (Math.random() - 0.5) * 0.2;
    bullet.position.set(player.position.x + offset, player.position.y + 1, 0);
    bullet.userData.spawnTime = Date.now();
    scene.add(bullet);
    bullets.push(bullet);
}

function updateBullets() {
    var now = Date.now();
    for (var i = bullets.length - 1; i >= 0; i--) {
        bullets[i].position.y += 0.35;
        if (bullets[i].position.y > 20) {
            scene.remove(bullets[i]);
            bullets.splice(i, 1);
            continue;
        }
        // Fail-safe: remove bullets older than 3 seconds
        if (now - bullets[i].userData.spawnTime > 3000) {
            scene.remove(bullets[i]);
            bullets.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (var i = bullets.length - 1; i >= 0; i--) {
        for (var j = enemies.length - 1; j >= 0; j--) {
            var dx = bullets[i].position.x - enemies[j].position.x;
            var dy = bullets[i].position.y - enemies[j].position.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.6) {
                scene.remove(bullets[i]);
                bullets.splice(i, 1);
                scene.remove(enemies[j]);
                enemies.splice(j, 1);
                score++;
                updateScoreDisplay();
                break;
            }
        }
    }
}

function onTouchStart(event) {
    if (event.touches.length === 1 && gameRunning) {
        shootBullet();
    }
}

function onTouchMove(event) {
    if (event.touches.length === 1 && player && gameRunning) {
        var touch = event.touches[0];
        var x = (touch.clientX / window.innerWidth) * 2 - 1;
        player.position.x = x * 10;
    }
}
