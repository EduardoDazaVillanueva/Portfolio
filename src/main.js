import * as THREE from 'three';
import './style.scss';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap';

// Canvas y tamaños
const canvas = document.querySelector('#experience-canvas');
const sizes = { width: window.innerWidth, height: window.innerHeight };

// Escena
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xC5DBA7, 10, 60);

// Cámara
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0.0577, 12.7105, -12.0805);
scene.add(camera);

// Renderizador
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(-0.0868, 2.5763, 2.3361);
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 2;

// Cargadores
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Cargar HDRI
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/hdri/brown_photostudio_02_4k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = new THREE.Color(0xC5DBA7);
});

// Suelo y grid
{
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xC5DBA7, transparent: true, opacity: 0.0, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(200, 200, 0x8C8C7A, 0xA0A084);
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  grid.position.y = 0.001;
  scene.add(grid);
}

// Cargar modelo
let model;
gltfLoader.load('/models/isla-v1.glb', (glb) => {
  model = glb.scene;
  model.traverse((child) => {
    if (child.isMesh) child.castShadow = true;
  });
  scene.add(model);
  console.log('✅ Modelo cargado correctamente');
});

// Raycaster y mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* -----------------------------------------------------
   BACKGROUND OVERLAY (IMAGEN COMPLETA DE FONDO)
----------------------------------------------------- */
const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.left = '0';
overlay.style.top = '0';
overlay.style.width = '100vw';
overlay.style.height = '100vh';
overlay.style.backgroundImage = 'url("/images/pantallaBlender.png")';
overlay.style.backgroundSize = 'cover';
overlay.style.backgroundPosition = 'center';
overlay.style.backgroundRepeat = 'no-repeat';

overlay.style.display = 'none';
overlay.style.opacity = '0';
overlay.style.transition = 'opacity 0.5s ease';

overlay.style.zIndex = '15';

document.body.appendChild(overlay);

/* -----------------------------------------------------
   WRAPPER DEL IFRAME (FIJO, CENTRADO, CON TRANSICIÓN)
----------------------------------------------------- */
const iframeWrapper = document.createElement('div');
iframeWrapper.style.position = 'fixed';
iframeWrapper.style.left = '50%';
iframeWrapper.style.top = '50%';
iframeWrapper.style.transform = 'translate(-50%, -50%) scale(0.9)';
iframeWrapper.style.opacity = '0';
iframeWrapper.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
iframeWrapper.style.zIndex = '20';
iframeWrapper.style.display = 'none';
document.body.appendChild(iframeWrapper);

// Iframe
const iframe = document.createElement('iframe');
iframe.src = 'https://pcportfolio-eduardodaza.netlify.app/';
iframe.style.width = '800px';
iframe.style.height = '900px';
iframe.style.border = 'none';
iframe.style.borderRadius = '12px';
iframe.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
iframe.style.transformOrigin = 'center center';
iframeWrapper.appendChild(iframe);

// Mantener tamaño con zoom del navegador
function updateIframeScale() {
  const dpr = window.devicePixelRatio;
  iframe.style.transform = `scale(${1 / dpr})`;
}
updateIframeScale();
window.addEventListener('resize', updateIframeScale);

/* -----------------------------------------------------
   CLICK EN OBJETO "scheibe"
----------------------------------------------------- */
window.addEventListener('click', (event) => {
  if (!model) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(model.children, true);

  const object = intersects.find(i => i.object.name === 'scheibe')?.object;

  if (object) {
    console.log("🎮 Pantalla clicada → mostrar UI");

    controls.enabled = false;

    // Mostrar overlay con fade-in
    overlay.style.display = 'block';
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);

    // Mostrar iframe con fade + zoom-in
    iframeWrapper.style.display = 'block';
    setTimeout(() => {
      iframeWrapper.style.opacity = '1';
      iframeWrapper.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);
  }
});

/* -----------------------------------------------------
   ESC → Ocultar iframe + fondo CON TRANSICIÓN
----------------------------------------------------- */
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {

    // Fade-out iframe
    iframeWrapper.style.opacity = '0';
    iframeWrapper.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => {
      iframeWrapper.style.display = 'none';
    }, 300);

    // Fade-out fondo
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 500);

    // Restaurar controles
    controls.enabled = true;
  }
});

// Resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Loop
const render = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

render();
