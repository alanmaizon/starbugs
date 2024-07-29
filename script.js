let scene, camera, renderer, player, enemies = [], bullets = [];
let enemySpeed = 0.02;
const enemyRows = 3, enemyCols = 8;

document.addEventListener("DOMContentLoaded", function() {
    init();
    showModal("Welcome", "Press 'Start' to begin the game.");
});

function init() {
    // Create scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20; // Move the camera further back
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create player
    const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Smaller player
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, -10, 0);
    scene.add(player);

    // Initialize modal
    document.getElementById('start-button').addEventListener('click', startGame);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', onTouchStart, false);
    document.addEventListener('touchmove', onTouchMove, false);
}

function startGame() {
    document.getElementById('modal').style.display = 'none';
    resetGame();
    animate();
}

function resetGame() {
    // Remove old enemies and bullets
    enemies.forEach(enemy => scene.remove(enemy));
    bullets.forEach(bullet => scene.remove(bullet));
    enemies = [];
    bullets = [];

    // Create new enemies
    const enemyGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4); // Smaller enemies
    const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    for (let i = 0; i < enemyRows; i++) {
        for (let j = 0; j < enemyCols; j++) {
            const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
            enemy.position.set(j * 1.5 - (enemyCols / 2), i * 1.5 + 5, 0); // Adjusted spacing
            scene.add(enemy);
            enemies.push(enemy);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateBullets();
    moveEnemies();
    checkCollisions();
    renderer.render(scene, camera);
}

function onKeyDown(event) {
    const speed = 0.2;
    switch (event.key) {
        case 'ArrowLeft':
            if (player.position.x > -9) player.position.x -= speed;
            break;
        case 'ArrowRight':
            if (player.position.x < 9) player.position.x += speed;
            break;
        case ' ':
            shootBullet();
            break;
    }
}

function shootBullet() {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8); // Smaller bullets
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.set(player.position.x, player.position.y + 1, 0);
    scene.add(bullet);
    bullets.push(bullet);
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].position.y += 0.2;
        if (bullets[i].position.y > 15) {
            scene.remove(bullets[i]);
            bullets.splice(i, 1);
        }
    }
}

function moveEnemies() {
    let reverse = false;
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].position.x += enemySpeed;
        if (enemies[i].position.x > 9 || enemies[i].position.x < -9) {
            reverse = true;
        }
    }
    if (reverse) {
        enemySpeed = -enemySpeed;
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].position.y -= 0.5;
        }
    }
}

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i].position.distanceTo(enemies[j].position) < 0.5) {
                scene.remove(bullets[i]);
                bullets.splice(i, 1);
                scene.remove(enemies[j]);
                enemies.splice(j, 1);
                if (enemies.length === 0) {
                    showModal("Game Over", "You defeated all enemies! Play again?");
                }
                break;
            }
        }
    }
}

function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal').style.display = 'flex';
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        shootBullet();
    }
}

function onTouchMove(event) {
    if (event.touches.length === 1) {
        let touch = event.touches[0];
        let screenWidth = window.innerWidth;
        let touchX = (touch.clientX / screenWidth) * 20 - 10;
        player.position.x = Math.max(Math.min(touchX, 9), -9); // Constrain within bounds
    }
}
