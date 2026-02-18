import SwiftUI
import SceneKit
import Combine

struct GameView: View {
    var onGameOver: (() -> Void)? = nil
    @State private var moveLeft = false
    @State private var moveRight = false
    @State private var isShooting = false

    // ~60 FPS timer for smooth movement
    let timer = Timer.publish(every: 0.016, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            // MARK: - 3D Scene
            SceneKitView(onGameOver: onGameOver)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture {
                    // Tap anywhere to shoot
                    isShooting = true
                    SceneKitView.Coordinator.latest?.shootBullet()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        isShooting = false
                    }
                }

            // MARK: - Edge controls for smooth movement
            HStack(spacing: 0) {
                // Left edge button
                Button(action: {}) { EmptyView() }
                    .frame(width: 120)
                    .contentShape(Rectangle())
                    .gesture(
                        LongPressGesture(minimumDuration: 0)
                            .onChanged { _ in moveLeft = true }
                            .onEnded { _ in moveLeft = false }
                    )

                Spacer()

                // Right edge button
                Button(action: {}) { EmptyView() }
                    .frame(width: 120)
                    .contentShape(Rectangle())
                    .gesture(
                        LongPressGesture(minimumDuration: 0)
                            .onChanged { _ in moveRight = true }
                            .onEnded { _ in moveRight = false }
                    )
            }

            // MARK: - Optional liquid-glass visual buttons
            VStack {
                Spacer()
                HStack {
                    // Left visual button
                    Circle()
                        .glassEffect(.regular, in: Circle())
                        .foregroundColor(.black)
                        .frame(width: 70, height: 70)
                        .overlay(
                            Image(systemName: "arrow.left")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 40, height: 40)
                                .foregroundStyle(.white)
                        )
                        .padding(.leading, 20)
                        .onLongPressGesture(minimumDuration: 0, pressing: { pressing in
                            moveLeft = pressing
                        }, perform: {})

                    Spacer()

                    // Right visual button
                    Circle()
                        .glassEffect(.regular, in: Circle())
                        .foregroundColor(.black)
                        .frame(width: 70, height: 70)
                        .overlay(
                            Image(systemName: "arrow.right")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 40, height: 40)
                                .foregroundStyle(.white)
                        )
                        .padding(.trailing, 20)
                        .onLongPressGesture(minimumDuration: 0, pressing: { pressing in
                            moveRight = pressing
                        }, perform: {})
                }
                .padding(.bottom, 30)
            }

            // MARK: - Shooting feedback
            Rectangle()
                .fill(Color.white.opacity(0.15))
                .ignoresSafeArea()
                .opacity(isShooting ? 1 : 0)
                .animation(.easeOut(duration: 0.1), value: isShooting)
        }
        // MARK: - Timer for smooth movement
        .onReceive(timer) { _ in
            if moveLeft {
                SceneKitView.Coordinator.latest?.movePlayerSmooth(byX: -0.15)
            }
            if moveRight {
                SceneKitView.Coordinator.latest?.movePlayerSmooth(byX: 0.15)
            }
        }
    }


    struct SceneKitView: UIViewRepresentable {
        let onGameOver: (() -> Void)?
        class Coordinator: NSObject, SCNSceneRendererDelegate {
            static var latest: Coordinator?
            var playerNode: SCNNode?
            var bullets: [SCNNode] = []
            var enemies: [SCNNode] = []
            var scene: SCNScene!
            var enemySpeed: Float = 0.03
            
            var onGameOver: (() -> Void)?
            private var spawnTimer: Timer?
            
            override init() {
                super.init()
                Coordinator.latest = self
            }

                
            func resetGame(in scene: SCNScene) {
                bullets.forEach { $0.removeFromParentNode() }
                enemies.forEach { $0.removeFromParentNode() }
                bullets.removeAll()
                enemies.removeAll()
                spawnTimer?.invalidate()
                startSpawningWaves()
            }

            func movePlayer(byX delta: Float) {
                guard let playerNode = playerNode else { return }
                let newX = playerNode.position.x + delta
                let clampedX = max(-5, min(5, newX))
                playerNode.position.x = clampedX
            }

            func shootBullet() {
                guard let playerNode = playerNode, let scene = scene else { return }

                let bullet = SCNNode(geometry: SCNCylinder(radius: 0.03, height: 0.8))
                bullet.geometry?.firstMaterial?.diffuse.contents = UIColor.red
                bullet.geometry?.firstMaterial?.emission.contents = UIColor.red
                bullet.eulerAngles = SCNVector3(0, 0, Float.pi)
                bullet.position = SCNVector3(playerNode.position.x, playerNode.position.y + 1, playerNode.position.z)
                
                let offset = Float.random(in: -0.1...0.1)
                bullet.position = SCNVector3(playerNode.position.x + offset,
                                             playerNode.position.y + 1,
                                             playerNode.position.z)
                // Tag with a spawn time for cleanup logic
                bullet.name = "bullet_\(Date().timeIntervalSince1970)"
                scene.rootNode.addChildNode(bullet)
                bullets.append(bullet)
            }

            private func updateBullets() {
                let currentTime = Date().timeIntervalSince1970

                for (i, bullet) in bullets.enumerated().reversed() {
                    // Move upward
                    bullet.position.y += 0.35

                    // Remove if off-screen
                    if bullet.position.y > 20 {
                        bullet.removeFromParentNode()
                        bullets.remove(at: i)
                        continue
                    }

                    // Fail-safe: remove any bullet older than 3 seconds
                    if let name = bullet.name,
                       let timestamp = Double(name.replacingOccurrences(of: "bullet_", with: "")),
                       currentTime - timestamp > 3.0 {
                        bullet.removeFromParentNode()
                        bullets.remove(at: i)
                        continue
                    }

                    // Prevent stuck bullets — recheck for any overlap with enemies every frame
                    for (ei, enemy) in enemies.enumerated().reversed() {
                        let dx = bullet.position.x - enemy.position.x
                        let dy = bullet.position.y - enemy.position.y
                        let distance = sqrt(dx*dx + dy*dy)

                        if distance < 0.6 {
                            bullet.removeFromParentNode()
                            enemy.removeFromParentNode()
                            bullets.remove(at: i)
                            enemies.remove(at: ei)
                            break
                        }
                    }
                }
            }
            

            func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
                updateBullets()
                moveEnemies()
                checkCollisions()
            }

            private func moveEnemies() {
                guard let playerNode = playerNode else { return }

                for (i, enemy) in enemies.enumerated().reversed() {
                    // Move straight down
                    enemy.position.y -= enemySpeed

                    // Remove enemies that move off-screen
                    if enemy.position.y < -10 {
                        enemy.removeFromParentNode()
                        enemies.remove(at: i)
                    }

                    // Check collision with player
                    let distX = playerNode.position.x - enemy.position.x
                    let distY = playerNode.position.y - enemy.position.y
                    let distance = sqrt(distX*distX + distY*distY)
                    if distance < 0.8 {
                        DispatchQueue.main.async {
                            self.onGameOver?()
                        }
                        spawnTimer?.invalidate()
                        return
                    }
                }
            }

            private func checkCollisions() {
                for (bi, bullet) in bullets.enumerated().reversed() {
                    for (ei, enemy) in enemies.enumerated().reversed() {
                        let dx = bullet.position.x - enemy.position.x
                        let dy = bullet.position.y - enemy.position.y
                        let distance = sqrt(dx*dx + dy*dy)
                        if distance < 0.6 {
                            bullet.removeFromParentNode()
                            enemy.removeFromParentNode()
                            bullets.remove(at: bi)
                            enemies.remove(at: ei)
                            break
                        }
                    }
                }
            }

            // MARK: - Spawning Waves
            func spawnWave() {
                guard let scene = scene else { return }
                let spawnRange: ClosedRange<Float> = -10...10
                let enemyScale: Float = 1
                let minSpacing: Float = 2 * enemyScale

                // Calculate the max number of enemies that can fit within the spawnRange without overlapping
                // given the minimum spacing required between them.
                let maxEnemies = Int((spawnRange.upperBound - spawnRange.lowerBound) / minSpacing)
                let numEnemies = min(Int.random(in: 1...3), maxEnemies)

                var usedXPositions: [Float] = []

                for _ in 0..<numEnemies {
                    var startX: Float
                    var attempts = 0
                    let maxAttempts = 25

                    repeat {
                        startX = Float.random(in: spawnRange)
                        attempts += 1
                    } while usedXPositions.contains(where: { abs($0 - startX) < minSpacing }) && attempts < maxAttempts

                    usedXPositions.append(startX)

                    let enemy = SCNNode()
                    var contentNode: SCNNode?

                    if let modelScene = SCNScene(named: "art.scnassets/BUTTERFLY.usdz"),
                       let modelNode = modelScene.rootNode.childNodes.first {
                        let (min, max) = modelNode.boundingBox
                        let center = SCNVector3(
                            (max.x + min.x) / 2,
                            (max.y + min.y) / 2,
                            (max.z + min.z) / 2
                        )
                        modelNode.pivot = SCNMatrix4MakeTranslation(center.x, center.y, center.z)
                        modelNode.position = SCNVector3Zero
                        modelNode.scale = SCNVector3(0.01, 0.01, 0.01)
                        modelNode.eulerAngles = SCNVector3(Float.pi/2, 0, 0)
                        contentNode = modelNode
                    } else {
                        let cube = SCNNode(geometry: SCNBox(width: 0.8, height: 0.8, length: 0.8, chamferRadius: 0))
                        cube.geometry?.firstMaterial?.diffuse.contents = UIColor.gray
                        cube.scale = SCNVector3(enemyScale, enemyScale, enemyScale)
                        contentNode = cube
                    }

                    if let node = contentNode {
                        enemy.addChildNode(node)
                    }

                    let startY: Float = 12.0
                    enemy.position = SCNVector3(startX, startY, 0)

                    scene.rootNode.addChildNode(enemy)
                    enemies.append(enemy)
                }
            }
            func startSpawningWaves() {
                spawnTimer?.invalidate()
                spawnTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
                    self.spawnWave()
                }
            }
        }

        private func makeHyperspaceEffectNode(scene: SCNScene) -> SCNNode {
            // Use stretched line as particle for ray effect
            let renderer = UIGraphicsImageRenderer(size: CGSize(width: 2, height: 32))
            let streakImage = renderer.image { ctx in
                UIColor.white.setFill()
                ctx.fill(CGRect(x: 0, y: 0, width: 2, height: 32))
            }

            let particleSystem = SCNParticleSystem()
            particleSystem.birthRate = 1
            particleSystem.particleLifeSpan = 1.7
            particleSystem.particleVelocity = 22
            particleSystem.particleVelocityVariation = 7
            particleSystem.emissionDuration = 0
            particleSystem.loops = true
            particleSystem.particleColor = .white
            particleSystem.particleSize = 0.015
            particleSystem.particleImage = streakImage
            particleSystem.blendMode = .additive
            particleSystem.emitterShape = SCNSphere(radius: 21)
            particleSystem.particleAngle = 0
            particleSystem.particleAngleVariation = 0
            particleSystem.spreadingAngle = 0
            // particleSystem.particleRotation = 0 // No explicit property to set here, default is 0
            
            let node = SCNNode()
            node.position = SCNVector3(0, 0, -2) // Slightly behind main action
            node.addParticleSystem(particleSystem)
            return node
        }

        func makeCoordinator() -> Coordinator {
            let c = Coordinator()
            c.onGameOver = onGameOver
            return c
        }

        func makeUIView(context: Context) -> SCNView {
            let scnView = SCNView()
            let scene = SCNScene()
            context.coordinator.scene = scene
            scnView.scene = scene
            scnView.delegate = context.coordinator

            // CAMERA
            let cameraNode = SCNNode()
            cameraNode.camera = SCNCamera()
            cameraNode.position = SCNVector3(0, -15, 15)
            cameraNode.look(at: SCNVector3(0, 0, 0))
            scene.rootNode.addChildNode(cameraNode)

            let hyperspaceNode = makeHyperspaceEffectNode(scene: scene)
            scene.rootNode.addChildNode(hyperspaceNode)

            // LIGHTS
            let ambient = SCNLight()
            ambient.type = .ambient
            ambient.intensity = 600
            let ambientNode = SCNNode()
            ambientNode.light = ambient
            scene.rootNode.addChildNode(ambientNode)

            let dir = SCNLight()
            dir.type = .directional
            dir.intensity = 700
            let dirNode = SCNNode()
            dirNode.light = dir
            dirNode.position = SCNVector3(1, 1, 1)
            scene.rootNode.addChildNode(dirNode)

            // PLAYER
            let player = SCNNode()
            let playerScale: Float = 4
            if let modelScene = SCNScene(named: "art.scnassets/player.usdc"),
                let modelNode = modelScene.rootNode.childNodes.first {
                modelNode.scale = SCNVector3(playerScale, playerScale, playerScale)
                modelNode.eulerAngles = SCNVector3(0, 0, Float.pi)
                player.addChildNode(modelNode)
            } else {
                // Fallback to capsule if model fails to load
                let fallback = SCNNode(geometry: SCNCapsule(capRadius: 0.4, height: 1.0))
                fallback.geometry?.firstMaterial?.diffuse.contents = UIColor.white
                player.addChildNode(fallback)
            }
            player.position = SCNVector3(0, -8, 0)
            scene.rootNode.addChildNode(player)
            context.coordinator.playerNode = player
            // ENEMIES
            context.coordinator.startSpawningWaves()

            scnView.backgroundColor = UIColor.black
            scnView.isPlaying = true
            return scnView
        }

        func updateUIView(_ uiView: SCNView, context: Context) {}
    }
    
}

extension GameView.SceneKitView.Coordinator {
    func movePlayerSmooth(byX delta: Float) {
        guard let playerNode = playerNode else { return }
        let newX = playerNode.position.x + delta
        playerNode.position.x = max(-10, min(10, newX)) // horizontal bounds
    }
}

