javascript
let scene, camera, renderer, player, enemies = [], bullets = [];
let score = 0;
let scoreMessage;
const enemyRows = 3, enemyCols = 8;

function init() {

    // Create scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, -10, 0);
    scene.add(player);

    // Create enemies
    const enemyGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    for (let i = 0; i < enemyRows; i++) {
        for (let j = 0; j < enemyCols; j++) {
            const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
            enemy.position.set(j * 2 - 7, i * 2 + 5, 0);
            scene.add(enemy);
            enemies.push(enemy);
        }
    }
    
    // Position camera
    camera.position.z = 15;

    // Create score message
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
        const textGeometry = new THREE.TextGeometry('', {
            font: font,
            size: 0.5,
            height: 0.1,
        });
        const textMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
        scoreMessage = new THREE.Mesh(textGeometry, textMaterial);
        scoreMessage.position.set(-5, 8, 0);
        scene.add(scoreMessage);
    });
}

function animate() {
    requestAnimationFrame(animate);

    updateBullets();
    moveEnemies();
    checkCollisions();
    updateScoreMessage();

    renderer.render(scene, camera);
}

function moveEnemies() {
    const time = Date.now() * 0.001; // Current time in seconds
    enemies.forEach((enemy, index) => {
        const row = Math.floor(index / enemyCols);
        const col = index % enemyCols;
        
        // Move in a sine wave pattern
        enemy.position.y = 5 + row * 2 + Math.sin(time + col * 0.5) * 0.5;
        
        // Slight horizontal movement
        enemy.position.x = (col * 2 - 7) + Math.sin(time * 0.5 + row) * 0.3;
    });
}

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i].position.distanceTo(enemies[j].position) < 0.5) {
                // Remove bullet and enemy
                scene.remove(bullets[i]);
                bullets.splice(i, 1);
                scene.remove(enemies[j]);
                enemies.splice(j, 1);

                // Increase score and show message
                score += 100;
                showScoreMessage();

                break;
            }
        }
    }
}

function showScoreMessage() {
    if (scoreMessage) {
        scoreMessage.geometry.dispose();
        scoreMessage.geometry = new THREE.TextGeometry('+100', {
            font: scoreMessage.material.font,
            size: 0.5,
            height: 0.1,
        });
        setTimeout(() => {
            scoreMessage.geometry.dispose();
            scoreMessage.geometry = new THREE.TextGeometry('', {
                font: scoreMessage.material.font,
                size: 0.5,
                height: 0.1,
            });
        }, 1000);
    }
}

function updateScoreMessage() {
    if (scoreMessage) {
        scoreMessage.lookAt(camera.position);
    }
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
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
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

init();
animate();
document.addEventListener('keydown', onKeyDown);
