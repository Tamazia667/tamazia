import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const OceanBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06324f, 0.012);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(0, 2, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    const skyGeo = new THREE.SphereGeometry(400, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: new THREE.Color(0x04243b) },
        mid: { value: new THREE.Color(0x0a6e8f) },
        bot: { value: new THREE.Color(0x39e6c8) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
        void main(){ float h=normalize(vP).y; vec3 c=mix(bot,mid,smoothstep(-0.2,0.25,h)); c=mix(c,top,smoothstep(0.2,0.8,h)); gl_FragColor=vec4(c,1.0); }`,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    const sun = new THREE.PointLight(0xbff7ff, 1.4, 400);
    sun.position.set(20, 60, 20);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x2a6f8f, 0.7));

    const count = 220;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80 - 10;
      speed[i] = 0.04 + Math.random() * 0.12;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const bubbles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd6f7ff, size: 0.7, transparent: true, opacity: 0.7 }));
    scene.add(bubbles);

    const seaGeo = new THREE.PlaneGeometry(300, 300, 80, 80);
    const sp = seaGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), y = sp.getY(i);
      const z = Math.sin(x * 0.06) * 2.2 + Math.cos(y * 0.05) * 2.2 + Math.sin((x + y) * 0.03) * 1.2;
      sp.setZ(i, z);
    }
    seaGeo.computeVertexNormals();
    const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x1aa3c4, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.92, flatShading: false }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -8;
    scene.add(sea);

    let raf = 0;
    let t = 0;
    const animate = () => {
      t += 0.012;
      const spd = seaGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < spd.count; i++) {
        const x = spd.getX(i), y = spd.getY(i);
        spd.setZ(i, Math.sin(x * 0.06 + t) * 2.2 + Math.cos(y * 0.05 + t * 0.8) * 2.2 + Math.sin((x + y) * 0.03) * 1.2);
      }
      spd.needsUpdate = true;

      const bp = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        let yy = bp.getY(i) + speed[i];
        let xx = bp.getX(i) + Math.sin(t * 2 + i) * 0.02;
        if (yy > 40) { yy = -40; xx = (Math.random() - 0.5) * 120; }
        bp.setY(i, yy); bp.setX(i, xx);
      }
      bp.needsUpdate = true;

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
      renderer.dispose();
      seaGeo.dispose();
      geo.dispose();
      skyGeo.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: 'linear-gradient(180deg, #04243b 0%, #0a6e8f 55%, #39e6c8 100%)' }}
    />
  );
};

export default OceanBackground;
