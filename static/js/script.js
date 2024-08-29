/**
 * The code sets up a 3D space shooter game in JavaScript where the player controls a spaceship to
 * shoot down enemy ships, with features like player movement, shooting bullets, enemy movement,
 * collision detection, scoring, game over handling, and modals for instructions and game status.
 */
let scene, camera, renderer, player, enemies = [], bullets = [];
let enemySpeed = 0.01;
const enemyRows = 3, enemyCols = 8;
const loader = new THREE.GLTFLoader();

document.addEventListener("DOMContentLoaded", function() {
    init();
    showModal("starbugs", "Press 'Start' to begin the game.");
});

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(0, -15, 15);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Load the skybox texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('static/models/galaxy.jpg', function(texture) {
        const skyboxGeometry = new THREE.SphereGeometry(45, 0, 0);
        const skyboxMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        scene.add(skybox);
    });

    loader.load('static/models/player.glb', function(gltf) {
        player = gltf.scene;
        player.traverse(function(node) {
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
    document.addEventListener('touchstart', onTouchStart, false);
    document.addEventListener('touchmove', onTouchMove, false);

    camera.updateProjectionMatrix();
}

function startGame() {
    document.getElementById('modal').style.display = 'none';
    resetGame();
    animate();
}

function resetGame() {
    enemies.forEach(enemy => scene.remove(enemy));
    bullets.forEach(bullet => scene.remove(bullet));
    enemies = [];
    bullets = [];

    for (let i = 0; i < enemyRows; i++) {
        for (let j = 0; j < enemyCols; j++) {
            loader.load('static/models/enemy.glb', function(gltf) {
                const enemy = gltf.scene;
                enemy.traverse(function(node) {
                    if (node.isMesh) {
                        node.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
                    }
                });
                enemy.position.set(j * 1.5 - (enemyCols / 2), i * 4 + 5, 0);
                enemy.scale.set(0.1, 0.1, 0.1);
                enemy.rotation.set(Math.PI / 2, 0, 0);
                scene.add(enemy);
                enemies.push(enemy);
            });
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


function showModal(title, text) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-text').innerText = text;
    document.getElementById('modal').style.display = 'flex';
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

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i].position.distanceTo(enemies[j].position) < 0.5) {
                scene.remove(bullets[i]);
                bullets.splice(i, 1);
                scene.remove(enemies[j]);
                enemies.splice(j, 1);
                if (enemies.length === 0) {
                    showModal("Gameover", "You defeated all enemies! Play again?");
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
        let x = (touch.clientX / window.innerWidth) * 2 - 1;
        player.position.x = x * 10;
    }
}
