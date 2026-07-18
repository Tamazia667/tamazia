import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { motion } from 'framer-motion';
import { detectHardware, pickQuality, advise, QualitySettings } from '../lib/hardware';

interface GamePageProps {
  deviceConnected: boolean;
}

const GamePage: React.FC<GamePageProps> = ({ deviceConnected }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const spellRef = useRef<{ active: boolean; t: number }>({ active: false, t: 0 });
  const connectedRef = useRef(false);
  const [advice, setAdvice] = useState<{ ok: boolean; message: string; tier: string } | null>(null);

  useEffect(() => { connectedRef.current = deviceConnected; }, [deviceConnected]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const hw = detectHardware();
    const q: QualitySettings = pickQuality(hw);
    setAdvice(advise(hw, q));

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xc98a4a, 0.006);

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 2000);
    camera.position.set(0, 14, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: q.antialias, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.pixelRatioCap));
    renderer.shadowMap.enabled = q.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 12;
    controls.maxDistance = 90;
    controls.target.set(0, 6, 0);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(900, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          top: { value: new THREE.Color(0x3a1b4a) },
          mid: { value: new THREE.Color(0xc4641f) },
          bot: { value: new THREE.Color(0xf0b35a) },
        },
        vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
          void main(){ float h=normalize(vP).y; vec3 c=mix(bot,mid,smoothstep(-0.1,0.3,h)); c=mix(c,top,smoothstep(0.25,0.8,h)); gl_FragColor=vec4(c,1.0); } `,
      })
    );
    scene.add(sky);

    const sun = new THREE.DirectionalLight(0xffd9a0, 2.2);
    sun.position.set(-60, 80, -40);
    sun.castShadow = q.shadows;
    if (q.shadows) {
      sun.shadow.mapSize.set(q.shadowMapSize, q.shadowMapSize);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 300;
      (sun.shadow.camera as THREE.OrthographicCamera).left = -80;
      (sun.shadow.camera as THREE.OrthographicCamera).right = 80;
      (sun.shadow.camera as THREE.OrthographicCamera).top = 80;
      (sun.shadow.camera as THREE.OrthographicCamera).bottom = -80;
    }
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffe0b0, 0x4a2a10, 0.5));
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(14, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
    sunMesh.position.set(-120, 90, -160);
    scene.add(sunMesh);

    const sandMat = new THREE.MeshStandardMaterial({ color: 0xd9a45c, roughness: 0.95, metalness: 0.02 });
    const groundGeo = new THREE.PlaneGeometry(600, 600, 120, 120);
    const gpos = groundGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < gpos.count; i++) {
      const x = gpos.getX(i), y = gpos.getY(i);
      const d = Math.sqrt(x * x + y * y);
      const z = Math.sin(x * 0.04) * 3 + Math.cos(y * 0.05) * 3 + (d > 30 ? (d - 30) * 0.04 : 0) + Math.sin((x + y) * 0.02) * 1.5;
      gpos.setZ(i, z);
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, sandMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const pyramid = new THREE.Mesh(
      new THREE.ConeGeometry(16, 22, 4, 1),
      new THREE.MeshStandardMaterial({ color: 0xc8924a, roughness: 0.85, metalness: 0.05, flatShading: true })
    );
    pyramid.position.set(0, 11, -20);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.castShadow = q.shadows;
    pyramid.receiveShadow = q.shadows;
    scene.add(pyramid);

    const pillarGeo = new THREE.CylinderGeometry(1.4, 1.6, 18, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe0bd86, roughness: 0.8, metalness: 0.05 });
    const pillarMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, 4);
    pillarMesh.castShadow = q.shadows;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 22, 9, Math.sin(a) * 22 - 8);
      dummy.updateMatrix();
      pillarMesh.setMatrixAt(i, dummy.matrix);
    }
    pillarMesh.instanceMatrix.needsUpdate = true;
    scene.add(pillarMesh);

    const palmGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 1 }));
    trunk.position.y = 4.5; trunk.castShadow = q.shadows;
    palmGroup.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7d33, roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(7, 2), leafMat);
      leaf.position.y = 9;
      leaf.rotation.z = Math.PI / 2.4;
      leaf.rotation.y = (i / 6) * Math.PI * 2;
      leaf.translateY(3.5);
      leaf.castShadow = q.shadows;
      palmGroup.add(leaf);
    }
    palmGroup.position.set(26, 0, 18);
    scene.add(palmGroup);

    const spellCount = q.particleCount;
    const spellGeo = new THREE.BufferGeometry();
    const spellPos = new Float32Array(spellCount * 3);
    const spellVel = new Float32Array(spellCount * 3);
    for (let i = 0; i < spellCount; i++) {
      spellPos[i * 3] = (Math.random() - 0.5) * 30;
      spellPos[i * 3 + 1] = Math.random() * 2;
      spellPos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
      spellVel[i * 3] = (Math.random() - 0.5) * 0.04;
      spellVel[i * 3 + 1] = 0.05 + Math.random() * 0.12;
      spellVel[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    spellGeo.setAttribute('position', new THREE.BufferAttribute(spellPos, 3));
    const spell = new THREE.Points(spellGeo, new THREE.PointsMaterial({ color: 0xffd86b, size: 0.9, transparent: true, opacity: 0 }));
    scene.add(spell);

    const gamepadState = { connected: false };
    const onGamepad = (e: GamepadEvent) => { gamepadState.connected = !!e.gamepad; };
    window.addEventListener('gamepadconnected', onGamepad);
    window.addEventListener('gamepaddisconnected', () => { gamepadState.connected = false; });

    let raf = 0;
    let t = 0;
    let spellTriggered = false;
    const animate = () => {
      t += 0.016;
      controls.update();
      palmGroup.rotation.y = Math.sin(t * 0.3) * 0.05;
      sunMesh.position.x = -120 + Math.sin(t * 0.02) * 10;

      if (connectedRef.current && !spellTriggered) { spellTriggered = true; spellRef.current = { active: true, t: 0 }; }
      if (!connectedRef.current) spellTriggered = false;

      const mat = spell.material as THREE.PointsMaterial;
      if (spellRef.current.active) {
        spellRef.current.t += 0.016;
        mat.opacity = Math.min(1, spellRef.current.t * 1.5) * (spellRef.current.t > 3 ? Math.max(0, 1 - (spellRef.current.t - 3)) : 1);
        const sp = spellGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < spellCount; i++) {
          sp.setX(i, sp.getX(i) + spellVel[i * 3]);
          sp.setY(i, sp.getY(i) + spellVel[i * 3 + 1]);
          sp.setZ(i, sp.getZ(i) + spellVel[i * 3 + 2]);
          if (sp.getY(i) > 30) { sp.setY(i, 0); sp.setX(i, (Math.random() - 0.5) * 30); sp.setZ(i, (Math.random() - 0.5) * 30 - 5); }
        }
        sp.needsUpdate = true;
        if (spellRef.current.t > 5) spellRef.current.active = false;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('gamepadconnected', onGamepad);
      window.removeEventListener('gamepaddisconnected', () => {});
      controls.dispose();
      renderer.dispose();
      groundGeo.dispose();
      pyramid.geometry.dispose();
      pillarGeo.dispose();
      spellGeo.dispose();
      leafMat.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden rounded-lg border border-border">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-4 top-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-primary">Oasis des Appareils</CardTitle>
            {deviceConnected ? (
              <Badge className="bg-success/15 text-success">Sortilège actif</Badge>
            ) : (
              <Badge className="bg-muted text-muted-foreground">En attente</Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 text-xs text-muted-foreground">
            Survolez la scène (glisser = rotation, molette = zoom, manette supportée). Branchez un appareil pour réveiller le sortilège de sable doré.
            {advice && (
              <div className={`mt-2 rounded-md border px-2 py-1.5 ${advice.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                {advice.message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default GamePage;
