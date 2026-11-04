import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Trophy,
  Flame,
  Crosshair,
  Maximize2,
  Pause,
  Box,
} from 'lucide-react';

type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

// Simple Web Audio Synthesizer for retro sci-fi sounds
class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  laser() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  explosion() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  powerup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(990, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

export function Game3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [hull, setHull] = useState(100);
  const [plasma, setPlasma] = useState(100);
  const [highScore, setHighScore] = useState(1250);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'arcade' | 'inspector'>('arcade');
  const [inspectedModel, setInspectedModel] = useState<'cruiser' | 'drone' | 'crystal'>('cruiser');
  const [wireframe, setWireframe] = useState(false);

  const soundRef = useRef<SoundFX>(new SoundFX());

  // Game internals refs
  const stateRef = useRef<{
    gameState: GameState;
    score: number;
    wave: number;
    hull: number;
    plasma: number;
    keys: { [key: string]: boolean };
    lastShotTime: number;
  }>({
    gameState: 'title',
    score: 0,
    wave: 1,
    hull: 100,
    plasma: 100,
    keys: {},
    lastShotTime: 0,
  });

  useEffect(() => {
    soundRef.current.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);
    scene.fog = new THREE.FogExp2(0x050814, 0.012);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 0, -4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x99ccff, 2.0);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const thrusterGlow = new THREE.PointLight(0x00f0ff, 3.5, 18);
    scene.add(thrusterGlow);

    // Starfield Particle Nebula (1,500 particles)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 200;
      starPos[i + 1] = (Math.random() - 0.5) * 80;
      starPos[i + 2] = -Math.random() * 250;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Procedural Grid Ground with glowing horizon
    const gridHelper = new THREE.GridHelper(200, 50, 0x00ffcc, 0x112244);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // ==========================================
    // PROCEDURAL COMPOSITE PLAYER STARFIGHTER (5 parts)
    // ==========================================
    const playerGroup = new THREE.Group();

    // Fuselage
    const fuselageGeo = new THREE.ConeGeometry(0.7, 3.5, 6);
    fuselageGeo.rotateX(Math.PI / 2);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false,
    });
    const fuselage = new THREE.Mesh(fuselageGeo, metalMat);
    playerGroup.add(fuselage);

    // Cockpit Canopy
    const cockpitGeo = new THREE.SphereGeometry(0.4, 16, 12);
    cockpitGeo.scale(0.8, 0.5, 1.4);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x004455,
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.35, -0.2);
    playerGroup.add(cockpit);

    // Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.2, 0.8);
    wingShape.lineTo(1.8, 1.6);
    wingShape.lineTo(0, 1.2);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.08, bevelEnabled: false });
    wingGeo.rotateX(Math.PI / 2);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7, roughness: 0.3 });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(0.3, 0, 0.5);
    playerGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.scale.x = -1;
    rightWing.position.set(-0.3, 0, 0.5);
    playerGroup.add(rightWing);

    // Twin Thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.8, 8);
    thrusterGeo.rotateX(Math.PI / 2);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.1 });
    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.position.set(0.4, -0.1, 1.6);
    playerGroup.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    rightThruster.position.set(-0.4, -0.1, 1.6);
    playerGroup.add(rightThruster);

    // Thruster Flame Plumes
    const flameGeo = new THREE.ConeGeometry(0.15, 1.2, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(0.4, -0.1, 2.2);
    playerGroup.add(flameL);
    const flameR = new THREE.Mesh(flameGeo, flameMat);
    flameR.position.set(-0.4, -0.1, 2.2);
    playerGroup.add(flameR);

    playerGroup.position.set(0, 0, 4);
    scene.add(playerGroup);

    // Arrays for dynamic entities
    const bullets: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; active: boolean }> = [];
    const enemies: Array<{ group: THREE.Group; velocity: THREE.Vector3; hp: number; active: boolean; rotSpeed: number }> = [];
    const crystals: Array<{ group: THREE.Group; active: boolean }> = [];

    // Factory: Procedural Enemy Drone (Faceted Core + Orbiting Blades)
    const createEnemyDrone = (x: number, y: number, z: number) => {
      const droneGroup = new THREE.Group();
      const coreGeo = new THREE.IcosahedronGeometry(0.8, 1);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x7f1d1d,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      droneGroup.add(core);

      // Ring armor
      const ringGeo = new THREE.TorusGeometry(1.2, 0.08, 6, 18);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.2 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      droneGroup.add(ring);

      droneGroup.position.set(x, y, z);
      scene.add(droneGroup);
      return {
        group: droneGroup,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.04, 0, 0.12 + Math.random() * 0.08),
        hp: 2,
        active: true,
        rotSpeed: (Math.random() - 0.5) * 0.05,
      };
    };

    // Factory: Energy Power Crystal
    const createCrystal = (x: number, y: number, z: number) => {
      const cGroup = new THREE.Group();
      const octaGeo = new THREE.OctahedronGeometry(0.5);
      const octaMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        roughness: 0.1,
        metalness: 0.8,
      });
      const octa = new THREE.Mesh(octaGeo, octaMat);
      cGroup.add(octa);
      cGroup.position.set(x, y, z);
      scene.add(cGroup);
      return { group: cGroup, active: true };
    };

    // Spawn Initial Wave
    const spawnWave = (waveNum: number) => {
      const enemyCount = 4 + waveNum * 2;
      for (let i = 0; i < enemyCount; i++) {
        const x = (Math.random() - 0.5) * 22;
        const z = -40 - Math.random() * 60;
        enemies.push(createEnemyDrone(x, 0, z));
      }
      // Spawn 2 power crystals
      for (let i = 0; i < 2; i++) {
        const x = (Math.random() - 0.5) * 16;
        const z = -30 - Math.random() * 40;
        crystals.push(createCrystal(x, 0, z));
      }
    };

    spawnWave(1);

    // Keyboard controls
    const keys: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'Escape') {
        setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Shoot function
    const shootLaser = () => {
      const now = performance.now();
      if (now - stateRef.current.lastShotTime < 180) return;
      stateRef.current.lastShotTime = now;

      // Create twin bolts
      [-0.4, 0.4].forEach(xOffset => {
        const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
        boltGeo.rotateX(Math.PI / 2);
        const boltMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.position.set(playerGroup.position.x + xOffset, playerGroup.position.y, playerGroup.position.z - 1.2);
        scene.add(bolt);
        bullets.push({ mesh: bolt, velocity: new THREE.Vector3(0, 0, -1.4), active: true });
      });

      soundRef.current.laser();
    };

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = performance.now() * 0.001;

      // Handle Wireframe Toggle
      fuselage.material.wireframe = wireframe;
      cockpit.material.wireframe = wireframe;
      leftWing.material.wireframe = wireframe;
      rightWing.material.wireframe = wireframe;

      // Update Starfield scroll
      const posAttr = starGeo.attributes.position;
      const positions = posAttr.array as Float32Array;
      for (let i = 2; i < starCount * 3; i += 3) {
        positions[i] += 0.8;
        if (positions[i] > 10) {
          positions[i] = -240;
        }
      }
      posAttr.needsUpdate = true;

      // Dynamic Grid Scroll
      gridHelper.position.z = (gridHelper.position.z + 0.3) % 4;

      // Thruster light pulse
      thrusterGlow.intensity = 2.5 + Math.sin(time * 25) * 1.0;
      thrusterGlow.position.set(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z + 1.8);
      flameL.scale.set(1, 0.8 + Math.random() * 0.4, 1);
      flameR.scale.set(1, 0.8 + Math.random() * 0.4, 1);

      if (stateRef.current.gameState === 'playing') {
        // Player Controls (WASD / Arrows / Space)
        const speed = 12 * delta;
        if (keys['KeyA'] || keys['ArrowLeft']) {
          playerGroup.position.x -= speed;
          playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, 0.35, 0.15);
        } else if (keys['KeyD'] || keys['ArrowRight']) {
          playerGroup.position.x += speed;
          playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, -0.35, 0.15);
        } else {
          playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, 0, 0.1);
        }

        if (keys['KeyW'] || keys['ArrowUp']) {
          playerGroup.position.z -= speed * 0.8;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
          playerGroup.position.z += speed * 0.8;
        }

        // Clamp player boundary
        playerGroup.position.x = Math.max(-12, Math.min(12, playerGroup.position.x));
        playerGroup.position.z = Math.max(-4, Math.min(8, playerGroup.position.z));

        // Space action: shoot
        if (keys['Space']) {
          shootLaser();
        }

        // Update Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.mesh.position.add(b.velocity);
          if (b.mesh.position.z < -90) {
            scene.remove(b.mesh);
            bullets.splice(i, 1);
          }
        }

        // Update Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.group.position.add(e.velocity);
          e.group.rotation.x += e.rotSpeed;
          e.group.rotation.y += e.rotSpeed * 1.5;

          // Check bullet collision
          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (b.mesh.position.distanceTo(e.group.position) < 1.4) {
              scene.remove(b.mesh);
              bullets.splice(j, 1);
              e.hp -= 1;
              if (e.hp <= 0) {
                soundRef.current.explosion();
                scene.remove(e.group);
                enemies.splice(i, 1);
                setScore(s => {
                  const newScore = s + 100;
                  if (newScore > highScore) setHighScore(newScore);
                  return newScore;
                });
                break;
              }
            }
          }

          // Check player collision
          if (e.group.position.distanceTo(playerGroup.position) < 1.6) {
            scene.remove(e.group);
            enemies.splice(i, 1);
            soundRef.current.explosion();
            setHull(h => {
              const newH = Math.max(0, h - 25);
              if (newH <= 0) {
                setGameState('gameover');
              }
              return newH;
            });
          }

          // Respawn or move back if passed player
          if (e.group.position.z > 14) {
            e.group.position.z = -70;
            e.group.position.x = (Math.random() - 0.5) * 22;
          }
        }

        // Update Crystals
        for (let i = crystals.length - 1; i >= 0; i--) {
          const c = crystals[i];
          c.group.position.z += 0.15;
          c.group.rotation.y += 0.04;
          if (c.group.position.distanceTo(playerGroup.position) < 1.8) {
            soundRef.current.powerup();
            scene.remove(c.group);
            crystals.splice(i, 1);
            setHull(h => Math.min(100, h + 20));
            setPlasma(p => Math.min(100, p + 25));
            setScore(s => s + 250);
          } else if (c.group.position.z > 14) {
            scene.remove(c.group);
            crystals.splice(i, 1);
          }
        }

        // Check wave completion
        if (enemies.length === 0) {
          setWave(w => {
            const nextWave = w + 1;
            spawnWave(nextWave);
            return nextWave;
          });
        }
      } else if (viewMode === 'inspector') {
        // Orbit preview mode for models
        playerGroup.rotation.y += 0.01;
        playerGroup.position.set(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [viewMode, wireframe]);

  const restartGame = () => {
    setScore(0);
    setWave(1);
    setHull(100);
    setPlasma(100);
    setGameState('playing');
  };

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col bg-slate-950 text-white select-none overflow-hidden rounded-xl border border-slate-800">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Low-Occlusion HUD Overlay (<15% Viewport Occlusion) */}
      <div className="relative z-10 pointer-events-none p-4 flex flex-col justify-between h-full">
        {/* Top Minimal Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50">
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400">
              <Crosshair className="w-4 h-4" />
              <span>HONORE VOID ARENA</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-xs text-slate-300">Wave {wave}</span>
          </div>

          {/* Scores & Sound Toggle */}
          <div className="flex items-center space-x-3 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center space-x-4 text-xs font-mono">
              <span className="text-emerald-400 flex items-center space-x-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>{score.toString().padStart(6, '0')}</span>
              </span>
              <span className="text-slate-400">HI: {highScore}</span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-700 text-slate-300"
              title="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>
            <button
              onClick={() => setWireframe(!wireframe)}
              className={`p-1.5 rounded-lg border text-xs font-mono flex items-center space-x-1 ${
                wireframe ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
              title="Toggle Three.js PBR Wireframe"
            >
              <Box className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Vital Gauges & Controls Hint */}
        <div className="flex items-end justify-between">
          {/* Hull & Plasma Bars */}
          <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-slate-700/50 w-64 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="flex items-center space-x-1 text-cyan-400">
                  <Shield className="w-3 h-3" />
                  <span>HULL INTEGRITY</span>
                </span>
                <span className="font-bold">{hull}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    hull > 50 ? 'bg-cyan-400' : hull > 25 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${hull}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Zap className="w-3 h-3" />
                  <span>PLASMA ENERGY</span>
                </span>
                <span className="font-bold">{plasma}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 transition-all duration-200" style={{ width: `${plasma}%` }} />
              </div>
            </div>
          </div>

          {/* Controls Hint Line */}
          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-[11px] font-mono text-slate-400 tracking-wider">
            <span className="text-cyan-400 font-semibold">WASD</span> Move ·{' '}
            <span className="text-cyan-400 font-semibold">SPACE</span> Fire Lasers ·{' '}
            <span className="text-cyan-400 font-semibold">ESC</span> Pause
          </div>
        </div>
      </div>

      {/* GAME SHELL OVERLAYS: TITLE SCREEN */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-6 text-center">
          {/* 30-40% Negative Space Hero Brand */}
          <div className="max-w-md w-full space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2 shadow-lg shadow-cyan-500/10">
              <Crosshair className="w-8 h-8 animate-pulse" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              HONORE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">VOID ARENA</span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time 3D space flight simulation powered by Three.js PBR rendering and Web Audio synthesis. Intercept rogue drones, gather quantum crystals, and dominate deep space.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setGameState('playing')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>LAUNCH STARFIGHTER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 text-center">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xs w-full space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white flex items-center justify-center space-x-2">
              <Pause className="w-5 h-5 text-amber-400" />
              <span>SIMULATION PAUSED</span>
            </h2>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 font-medium text-sm rounded-lg"
              >
                Resume
              </button>
              <button
                onClick={restartGame}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-medium text-sm rounded-lg text-slate-300"
              >
                Restart Wave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center">
          <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-2xl max-w-sm w-full space-y-5 shadow-2xl shadow-rose-500/10">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">HULL BREACH DETECTED</h2>
              <p className="text-xs text-slate-400 mt-1">Starfighter neutralized in Wave {wave}</p>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-sm space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Final Score:</span>
                <span className="text-emerald-400 font-bold">{score}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>High Score:</span>
                <span className="text-cyan-400 font-bold">{highScore}</span>
              </div>
            </div>
            <button
              onClick={restartGame}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-semibold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REDEPLOY SHIP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
