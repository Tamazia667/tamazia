import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SaharaBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0f08, 0.012);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 6, 28);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const skyGeo = new THREE.SphereGeometry(400, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: new THREE.Color(0x2a1230) },
        mid: { value: new THREE.Color(0x7a3b1a) },
        bot: { value: new THREE.Color(0xe8a85a) },
      },
      vertexShader: `
        varying vec3 vP;
        void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec3 vP;
        uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
        void main(){
          float h = normalize(vP).y;
          vec3 c = mix(bot, mid, smoothstep(-0.1, 0.25, h));
          c = mix(c, top, smoothstep(0.2, 0.7, h));
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(6, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd27a })
    );
    sun.position.set(0, 10, -120);
    scene.add(sun);

    const duneMat = new THREE.MeshStandardMaterial({ color: 0xc98a3c, roughness: 1, metalness: 0, flatShading: true });
    const duneGeo = new THREE.PlaneGeometry(300, 300, 60, 60);
    const pos = duneGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = Math.sin(x * 0.08) * 4 + Math.cos(y * 0.06) * 4 + Math.sin((x + y) * 0.03) * 2;
      pos.setZ(i, z);
    }
    duneGeo.computeVertexNormals();
    const dune = new THREE.Mesh(duneGeo, duneMat);
    dune.rotation.x = -Math.PI / 2;
    dune.position.y = -4;
    scene.add(dune);

    const light = new THREE.DirectionalLight(0xffd9a0, 1.2);
    light.position.set(-20, 30, -40);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x553322, 0.6));

    const starCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 400;
      starPos[i * 3 + 1] = Math.random() * 200 + 30;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 400 - 50;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffe9c2, size: 0.8, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    const sandCount = 1200;
    const sandGeo = new THREE.BufferGeometry();
    const sandPos = new Float32Array(sandCount * 3);
    const sandVel = new Float32Array(sandCount);
    for (let i = 0; i < sandCount; i++) {
      sandPos[i * 3] = (Math.random() - 0.5) * 120;
      sandPos[i * 3 + 1] = Math.random() * 40 - 4;
      sandPos[i * 3 + 2] = (Math.random() - 0.5) * 80 + 10;
      sandVel[i] = 0.05 + Math.random() * 0.18;
    }
    sandGeo.setAttribute('position', new THREE.BufferAttribute(sandPos, 3));
    const sand = new THREE.Points(sandGeo, new THREE.PointsMaterial({ color: 0xffcf8a, size: 0.5, transparent: true, opacity: 0.7 }));
    scene.add(sand);

    let raf = 0;
    let t = 0;
    const animate = () => {
      t += 0.005;
      dune.position.z = Math.sin(t) * 1.5;
      sun.position.x = Math.sin(t * 0.2) * 6;
      stars.rotation.y += 0.0004;

      const sp = sandGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < sandCount; i++) {
        let x = sp.getX(i) + sandVel[i];
        let y = sp.getY(i) + Math.sin(t * 3 + i) * 0.01;
        if (x > 60) { x = -60; y = Math.random() * 40 - 4; }
        sp.setX(i, x);
        sp.setY(i, y);
      }
      sp.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      duneGeo.dispose();
      skyGeo.dispose();
      sandGeo.dispose();
      starGeo.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: 'linear-gradient(180deg, #2a1230 0%, #7a3b1a 55%, #e8a85a 100%)' }}
    />
  );
};

export default SaharaBackground;
