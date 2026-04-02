// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

function closeMenu() {
  navLinks.classList.remove('mobile-open');
  hamburger.innerHTML = '&#9776;';
  document.body.classList.remove('menu-open');
}

function openMenu() {
  navLinks.classList.add('mobile-open');
  hamburger.innerHTML = '&times;';
  document.body.classList.add('menu-open');
}

hamburger.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = navLinks.classList.contains('mobile-open');
  
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

// Close menu when clicking on a link
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', (e) => {
    closeMenu();
  });
});

// Close menu when clicking on the overlay (background)
navLinks.addEventListener('click', (e) => {
  if (e.target === navLinks) {
    closeMenu();
  }
});

// ===== SCROLL FADE =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.service-card,.store-card,.testi-card,.contact-item,.gallery-item,.pet-strip-item')
  .forEach(el => { el.classList.add('fade-up'); observer.observe(el); });

// ===== PAW TEXTURE =====
function makePawTex(color = 'rgba(74,158,255,0.9)') {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(64, 82, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
  [[30,44,11,9],[52,30,10,9],[76,30,10,9],[98,44,11,9]].forEach(([x,y,rx,ry]) => {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  });
  return new THREE.CanvasTexture(c);
}

// ===== BUILD ARTICULATED DOG =====
// Uses pivot groups so each limb rotates from its joint
function buildDog(bodyCol, accentCol) {
  const root = new THREE.Group();
  const bMat = new THREE.MeshPhongMaterial({ color: bodyCol, shininess: 50 });
  const aMat = new THREE.MeshPhongMaterial({ color: accentCol, shininess: 50 });
  const dkMat = new THREE.MeshPhongMaterial({ color: 0x1a0a00 });

  // BODY
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 1.05, 8, 12), bMat);
  body.rotation.z = Math.PI / 2;
  root.add(body);

  // NECK pivot at front-top of body
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0.72, 0.22, 0);
  root.add(neckPivot);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.44, 8), bMat);
  neck.rotation.z = -0.45;
  neck.position.set(0.12, 0.18, 0);
  neckPivot.add(neck);

  // HEAD pivot at top of neck
  const headPivot = new THREE.Group();
  headPivot.position.set(0.3, 0.42, 0);
  neckPivot.add(headPivot);
  root.userData.headPivot = headPivot;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), bMat);
  headPivot.add(head);

  // Snout
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.4), aMat);
  snout.position.set(0.46, -0.1, 0);
  headPivot.add(snout);

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), dkMat);
  nose.position.set(0.65, -0.06, 0);
  headPivot.add(nose);

  // Eyes
  [-1,1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), dkMat);
    eye.position.set(0.28, 0.1, s * 0.24);
    headPivot.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(0.34, 0.13, s * 0.24);
    headPivot.add(shine);
  });

  // Floppy ears — pivot at top of head
  root.userData.earPivots = [];
  [-1,1].forEach(s => {
    const ep = new THREE.Group();
    ep.position.set(0.0, 0.28, s * 0.27);
    headPivot.add(ep);
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.13), aMat);
    ear.position.y = -0.18;
    ep.add(ear);
    ep.rotation.z = s * 0.18;
    root.userData.earPivots.push(ep);
  });

  // TAIL — 2-segment with pivots
  const tailBase = new THREE.Group();
  tailBase.position.set(-0.82, 0.28, 0);
  root.add(tailBase);
  root.userData.tailBase = tailBase;

  const tailSeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.46, 8), bMat);
  tailSeg1.position.y = 0.23;
  tailBase.add(tailSeg1);

  const tailMid = new THREE.Group();
  tailMid.position.y = 0.46;
  tailBase.add(tailMid);
  root.userData.tailMid = tailMid;

  const tailSeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.04, 0.36, 8), aMat);
  tailSeg2.position.y = 0.18;
  tailMid.add(tailSeg2);

  // LEGS — each leg: hipPivot → upper → kneePivot → lower → paw
  function makeLeg(col, uLen, lLen, thick) {
    const hip = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick * 0.85, uLen, 8), new THREE.MeshPhongMaterial({ color: col, shininess: 50 }));
    upper.position.y = -uLen / 2;
    hip.add(upper);
    const knee = new THREE.Group();
    knee.position.y = -uLen;
    hip.add(knee);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(thick * 0.78, thick * 0.6, lLen, 8), new THREE.MeshPhongMaterial({ color: col, shininess: 50 }));
    lower.position.y = -lLen / 2;
    knee.add(lower);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(thick * 1.15, 8, 6), dkMat);
    paw.scale.set(1.3, 0.55, 1.5);
    paw.position.y = -lLen;
    knee.add(paw);
    return { hip, knee };
  }

  const legFL = makeLeg(bodyCol, 0.36, 0.33, 0.115);
  legFL.hip.position.set(0.58, -0.3, 0.3);
  root.add(legFL.hip);

  const legFR = makeLeg(bodyCol, 0.36, 0.33, 0.115);
  legFR.hip.position.set(0.58, -0.3, -0.3);
  root.add(legFR.hip);

  const legBL = makeLeg(bodyCol, 0.38, 0.35, 0.12);
  legBL.hip.position.set(-0.52, -0.28, 0.3);
  root.add(legBL.hip);

  const legBR = makeLeg(bodyCol, 0.38, 0.35, 0.12);
  legBR.hip.position.set(-0.52, -0.28, -0.3);
  root.add(legBR.hip);

  root.userData.legs = { FL: legFL, FR: legFR, BL: legBL, BR: legBR };
  return root;
}

// ===== BUILD ARTICULATED CAT =====
function buildCat(bodyCol, accentCol) {
  const root = new THREE.Group();
  const bMat = new THREE.MeshPhongMaterial({ color: bodyCol, shininess: 70 });
  const aMat = new THREE.MeshPhongMaterial({ color: accentCol, shininess: 70 });
  const dkMat = new THREE.MeshPhongMaterial({ color: 0x111111 });

  // Body
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.78, 8, 12), bMat);
  body.rotation.z = Math.PI / 2;
  root.add(body);

  // Neck pivot
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0.56, 0.18, 0);
  root.add(neckPivot);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 8), bMat);
  neck.rotation.z = -0.38;
  neck.position.set(0.1, 0.14, 0);
  neckPivot.add(neck);

  // Head pivot
  const headPivot = new THREE.Group();
  headPivot.position.set(0.26, 0.32, 0);
  neckPivot.add(headPivot);
  root.userData.headPivot = headPivot;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), bMat);
  headPivot.add(head);

  // Muzzle
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), aMat);
  muzzle.scale.set(1, 0.65, 1);
  muzzle.position.set(0.28, -0.06, 0);
  headPivot.add(muzzle);

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.048, 6, 6), new THREE.MeshPhongMaterial({ color: 0xff8888 }));
  nose.position.set(0.43, -0.02, 0);
  headPivot.add(nose);

  // Eyes
  [-1,1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 6), new THREE.MeshPhongMaterial({ color: 0x22bb55, shininess: 100 }));
    eye.position.set(0.22, 0.1, s * 0.18);
    headPivot.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), dkMat);
    pupil.position.set(0.28, 0.1, s * 0.18);
    headPivot.add(pupil);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.016, 5, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(0.31, 0.13, s * 0.18);
    headPivot.add(shine);
  });

  // Pointy ears
  root.userData.earPivots = [];
  [-1,1].forEach(s => {
    const ep = new THREE.Group();
    ep.position.set(0.02, 0.3, s * 0.2);
    headPivot.add(ep);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), aMat);
    ear.position.y = 0.14;
    ep.add(ear);
    root.userData.earPivots.push(ep);
  });

  // Tail — 3 segments for curling
  const tailBase = new THREE.Group();
  tailBase.position.set(-0.6, 0.08, 0);
  root.add(tailBase);
  root.userData.tailBase = tailBase;
  tailBase.rotation.z = 0.4;

  const tailMid = new THREE.Group();
  tailMid.position.y = 0.4;
  tailBase.add(tailMid);
  root.userData.tailMid = tailMid;

  const tailTip = new THREE.Group();
  tailTip.position.y = 0.34;
  tailMid.add(tailTip);
  root.userData.tailTip = tailTip;

  [[0.4, 0.09, bMat],[0.34, 0.07, bMat],[0.28, 0.055, aMat]].forEach(([len, r, mat], i) => {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.82, len, 8), mat);
    seg.position.y = len / 2;
    [tailBase, tailMid, tailTip][i].add(seg);
  });

  // Legs
  function makeLeg(col, uLen, lLen, thick) {
    const hip = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick * 0.85, uLen, 8), new THREE.MeshPhongMaterial({ color: col, shininess: 70 }));
    upper.position.y = -uLen / 2;
    hip.add(upper);
    const knee = new THREE.Group();
    knee.position.y = -uLen;
    hip.add(knee);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(thick * 0.78, thick * 0.6, lLen, 8), new THREE.MeshPhongMaterial({ color: col, shininess: 70 }));
    lower.position.y = -lLen / 2;
    knee.add(lower);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(thick * 1.1, 8, 6), dkMat);
    paw.scale.set(1.25, 0.5, 1.4);
    paw.position.y = -lLen;
    knee.add(paw);
    return { hip, knee };
  }

  const legFL = makeLeg(bodyCol, 0.28, 0.26, 0.095);
  legFL.hip.position.set(0.46, -0.22, 0.24);
  root.add(legFL.hip);

  const legFR = makeLeg(bodyCol, 0.28, 0.26, 0.095);
  legFR.hip.position.set(0.46, -0.22, -0.24);
  root.add(legFR.hip);

  const legBL = makeLeg(bodyCol, 0.3, 0.28, 0.1);
  legBL.hip.position.set(-0.42, -0.2, 0.24);
  root.add(legBL.hip);

  const legBR = makeLeg(bodyCol, 0.3, 0.28, 0.1);
  legBR.hip.position.set(-0.42, -0.2, -0.24);
  root.add(legBR.hip);

  root.userData.legs = { FL: legFL, FR: legFR, BL: legBL, BR: legBR };
  return root;
}

// ===== WALK ANIMATION — diagonal gait with knee bend =====
function animateWalk(animal, t, speed) {
  const { legs, tailBase, tailMid, tailTip, headPivot } = animal.userData;
  const s = t * speed;

  // Diagonal pairs: FL+BR move together, FR+BL move together
  const p1 = Math.sin(s * 3.8);
  const p2 = Math.sin(s * 3.8 + Math.PI);

  legs.FL.hip.rotation.x = p1 * 0.52;
  legs.BR.hip.rotation.x = p1 * 0.48;
  legs.FR.hip.rotation.x = p2 * 0.52;
  legs.BL.hip.rotation.x = p2 * 0.48;

  // Knee bends only on forward swing
  legs.FL.knee.rotation.x = Math.max(0, p1) * 0.65;
  legs.BR.knee.rotation.x = Math.max(0, p1) * 0.6;
  legs.FR.knee.rotation.x = Math.max(0, p2) * 0.65;
  legs.BL.knee.rotation.x = Math.max(0, p2) * 0.6;

  // Body bob
  animal.position.y = (animal.userData.baseY || 0) + Math.abs(Math.sin(s * 7.6)) * 0.035;

  // Head nod
  if (headPivot) headPivot.rotation.x = Math.sin(s * 3.8) * 0.07;

  // Tail wag
  if (tailBase) tailBase.rotation.z = 0.55 + Math.sin(s * 5.5) * 0.55;
  if (tailMid)  tailMid.rotation.z  = Math.sin(s * 5.5 + 0.6) * 0.42;
  if (tailTip)  tailTip.rotation.z  = Math.sin(s * 5.5 + 1.2) * 0.35;
}

// ===== HERO THREE.JS =====
(function initHero() {
  const canvas = document.getElementById('heroCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  
  // Detect mobile devices for performance optimization
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
  
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = !isMobile; // Disable shadows on mobile for performance

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 2, 0.1, 200);
  camera.position.set(0, 1.5, 16);

  function resize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  // Lighting
  scene.add(new THREE.AmbientLight(0x6699cc, 0.7));
  const sun = new THREE.DirectionalLight(0xfff5e0, 1.4);
  sun.position.set(8, 14, 8);
  sun.castShadow = !isMobile;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x4a9eff, 0.5);
  fill.position.set(-6, 4, 6);
  scene.add(fill);

  // Ground plane (subtle)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 20),
    new THREE.MeshPhongMaterial({ color: 0x0d1b3e, transparent: true, opacity: 0.35 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.2;
  scene.add(ground);

  // Particles - reduce count on mobile
  const pGeo = new THREE.BufferGeometry();
  const pCount = isMobile ? 100 : 220;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i*3]   = (Math.random()-0.5)*50;
    pPos[i*3+1] = (Math.random()-0.5)*28;
    pPos[i*3+2] = (Math.random()-0.5)*22;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x4a9eff, size: 0.07, transparent: true, opacity: 0.55 })));

  // Floating paw sprites - reduce count on mobile
  const pawTex = makePawTex('rgba(74,158,255,0.85)');
  const paws = [];
  const pawCount = isMobile ? 6 : 14;
  for (let i = 0; i < pawCount; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pawTex, transparent: true, opacity: 0.28 }));
    const sc = Math.random() * 1.1 + 0.35;
    sp.scale.set(sc, sc, 1);
    sp.position.set((Math.random()-0.5)*40, (Math.random()-0.5)*20, (Math.random()-0.5)*10);
    sp.userData.offset = Math.random() * Math.PI * 2;
    scene.add(sp);
    paws.push(sp);
  }

  // Glowing rings - reduce count on mobile
  const rings = [];
  const ringCount = isMobile ? 2 : 4;
  for (let i = 0; i < ringCount; i++) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(2.2 + i, 0.035, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x2d6be4, transparent: true, opacity: 0.12 - i * 0.02 })
    );
    r.position.set((Math.random()-0.5)*18, (Math.random()-0.5)*8, -10 - i*2);
    r.rotation.x = Math.random() * Math.PI;
    rings.push(r);
    scene.add(r);
  }

  // Animals - reduce complexity on mobile
  const animalScale = isMobile ? 0.8 : 1.0;
  
  const dog1 = buildDog(0xd4883a, 0xa85e20);
  dog1.position.set(14, -1.5, 0);
  dog1.userData.baseY = -1.5;
  dog1.scale.setScalar(1.0 * animalScale);
  scene.add(dog1);

  const dog2 = buildDog(0xc8a882, 0x9a7a55);
  dog2.position.set(-16, -1.8, -3);
  dog2.userData.baseY = -1.8;
  dog2.scale.setScalar(0.82 * animalScale);
  scene.add(dog2);

  const cat1 = buildCat(0x888888, 0x555555);
  cat1.position.set(18, -1.6, -2);
  cat1.userData.baseY = -1.6;
  cat1.scale.setScalar(0.88 * animalScale);
  scene.add(cat1);

  const cat2 = buildCat(0xd4a050, 0xa07030);
  cat2.position.set(-20, -1.7, -4);
  cat2.userData.baseY = -1.7;
  cat2.scale.setScalar(0.72 * animalScale);
  scene.add(cat2);

  let t = 0;
  let animationId;
  
  // Pause animation when page is not visible
  let isVisible = true;
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
  });
  
  function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!isVisible) return; // Skip rendering when page is hidden
    
    t += 0.016;

    // Dog1 walks left
    dog1.position.x -= 0.028;
    if (dog1.position.x < -22) dog1.position.x = 24;
    dog1.rotation.y = Math.PI;
    animateWalk(dog1, t, 1.15);

    // Dog2 walks right
    dog2.position.x += 0.02;
    if (dog2.position.x > 22) dog2.position.x = -24;
    dog2.rotation.y = 0;
    animateWalk(dog2, t, 0.95);

    // Cat1 walks left (faster, lighter)
    cat1.position.x -= 0.022;
    if (cat1.position.x < -22) cat1.position.x = 24;
    cat1.rotation.y = Math.PI;
    animateWalk(cat1, t, 1.4);

    // Cat2 walks right
    cat2.position.x += 0.016;
    if (cat2.position.x > 22) cat2.position.x = -24;
    cat2.rotation.y = 0;
    animateWalk(cat2, t, 1.2);

    // Paw float
    paws.forEach(p => {
      p.position.y += Math.sin(t * 0.9 + p.userData.offset) * 0.006;
      p.material.opacity = 0.18 + Math.sin(t + p.userData.offset) * 0.08;
    });

    // Ring spin
    rings.forEach((r, i) => {
      r.rotation.x += 0.003 * (i % 2 === 0 ? 1 : -1);
      r.rotation.y += 0.0018;
    });

    // Particle drift upward
    for (let i = 0; i < pCount; i++) {
      pPos[i*3+1] += 0.004;
      if (pPos[i*3+1] > 14) pPos[i*3+1] = -14;
    }
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationId);
    renderer.dispose();
  });
})();

// ===== CTA CANVAS =====
(function initCta() {
  const canvas = document.getElementById('ctaCanvas');
  if (!canvas) return;
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
  const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);
  camera.position.z = 12;

  function resize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  const shapes = [];
  const shapeCount = isMobile ? 14 : 28;
  for (let i = 0; i < shapeCount; i++) {
    const geo = Math.random() > 0.5
      ? new THREE.OctahedronGeometry(0.14 + Math.random() * 0.18)
      : new THREE.TetrahedronGeometry(0.14 + Math.random() * 0.18);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x4a9eff : 0xffffff,
      transparent: true, opacity: 0.28 + Math.random() * 0.28
    }));
    mesh.position.set((Math.random()-0.5)*24, (Math.random()-0.5)*10, (Math.random()-0.5)*6);
    mesh.userData = { vy: (Math.random()-0.5)*0.018, vx: (Math.random()-0.5)*0.009 };
    scene.add(mesh);
    shapes.push(mesh);
  }

  // Floating paw sprites in CTA
  const pawTex2 = makePawTex('rgba(255,255,255,0.7)');
  const pawCount = isMobile ? 4 : 8;
  for (let i = 0; i < pawCount; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pawTex2, transparent: true, opacity: 0.2 }));
    sp.scale.set(1.2, 1.2, 1);
    sp.position.set((Math.random()-0.5)*22, (Math.random()-0.5)*8, (Math.random()-0.5)*4);
    sp.userData.offset = Math.random() * Math.PI * 2;
    scene.add(sp);
    shapes.push(sp);
  }

  let t = 0;
  let animationId;
  let isVisible = true;
  
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
  });
  
  function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!isVisible) return;
    
    t += 0.016;
    shapes.forEach(s => {
      if (s.userData.vy !== undefined) {
        s.position.y += s.userData.vy;
        s.position.x += s.userData.vx;
        if (s.rotation) { s.rotation.x += 0.018; s.rotation.y += 0.013; }
        if (s.position.y > 6) s.position.y = -6;
        if (s.position.y < -6) s.position.y = 6;
      }
    });
    renderer.render(scene, camera);
  }
  animate();
  
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationId);
    renderer.dispose();
  });
})();
