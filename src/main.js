import * as THREE from 'three';
import './style.scss';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap';

const canvas = document.querySelector('#experience-canvas');
const sizes = { width: window.innerWidth, height: window.innerHeight };

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xC5DBA7, 10, 60);

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0.0577, 12.7105, -12.0805);
scene.add(camera);
const initialCameraPos = camera.position.clone();

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(-0.0868, 2.5763, 2.3361);
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 2;

const initialTarget = controls.target.clone();
const initialMinDistance = 8;
const initialMaxDistance = 30;
controls.minDistance = initialMinDistance;
controls.maxDistance = initialMaxDistance;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const rgbeLoader = new RGBELoader();
rgbeLoader.load('/hdri/brown_photostudio_02_4k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = new THREE.Color(0xC5DBA7);
});

// Suelo y grid
{
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xC5DBA7, transparent: true, opacity: 0.0 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const grid = new THREE.GridHelper(200, 200, 0x8C8C7A, 0xA0A084);
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  scene.add(grid);
}

// PANTALLA DE CARGA CON BARRA
const loadingScreen = document.createElement('div');
loadingScreen.style.position = 'fixed';
loadingScreen.style.top = '0';
loadingScreen.style.left = '0';
loadingScreen.style.width = '100%';
loadingScreen.style.height = '100%';
loadingScreen.style.backgroundColor = '#C5DBA7';
loadingScreen.style.display = 'flex';
loadingScreen.style.flexDirection = 'column';
loadingScreen.style.alignItems = 'center';
loadingScreen.style.justifyContent = 'center';
loadingScreen.style.fontSize = '24px';
loadingScreen.style.fontWeight = 'bold';
loadingScreen.style.color = 'rgba(0,0,0,0.7)';
loadingScreen.style.zIndex = '100';
document.body.appendChild(loadingScreen);

const loadingText = document.createElement('div');
loadingText.textContent = 'Cargando...';
loadingText.style.marginBottom = '20px';
loadingScreen.appendChild(loadingText);

const progressBarContainer = document.createElement('div');
progressBarContainer.style.width = '60%';
progressBarContainer.style.height = '20px';
progressBarContainer.style.background = 'rgba(0,0,0,0.2)';
progressBarContainer.style.borderRadius = '10px';
progressBarContainer.style.overflow = 'hidden';
loadingScreen.appendChild(progressBarContainer);

const progressBar = document.createElement('div');
progressBar.style.width = '0%';
progressBar.style.height = '100%';
progressBar.style.background = 'rgba(0,0,0,0.7)';
progressBar.style.borderRadius = '10px';
progressBarContainer.appendChild(progressBar);

// CARGA DEL MODELO
let model;
gltfLoader.load(
  '/models/isla-v1.glb',
  (glb) => {
    model = glb.scene;
    scene.add(model);

    // OCULTAR PANTALLA DE CARGA
    loadingScreen.style.opacity = '0';
    setTimeout(() => loadingScreen.style.display = 'none', 500);
  },
  (xhr) => {
    // Actualizar barra de progreso
    if (xhr.total) {
      const percent = ((xhr.loaded / xhr.total) * 100).toFixed(0);
      progressBar.style.width = percent + '%';
    }
  },
  (error) => {
    console.error('Error al cargar el modelo', error);
  }
);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// IFRAME
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

const iframe = document.createElement('iframe');
iframe.src = 'https://pcportfolio-eduardodaza.netlify.app/';
iframe.style.width = '800px';
iframe.style.height = '850px';
iframe.style.border = 'none';
iframe.style.borderRadius = '12px';
iframe.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
iframe.style.transformOrigin = 'center center';
iframeWrapper.appendChild(iframe);

// BOTÓN DE CIERRE
const closeButton = document.createElement('button');
closeButton.textContent = 'Cerrar';
closeButton.style.position = 'fixed';
closeButton.style.bottom = '40px';
closeButton.style.left = '50%';
closeButton.style.transform = 'translateX(-50%)';
closeButton.style.padding = '12px 24px';
closeButton.style.fontSize = '16px';
closeButton.style.background = 'rgba(0,0,0,1)';
closeButton.style.color = 'white';
closeButton.style.border = 'none';
closeButton.style.borderRadius = '8px';
closeButton.style.cursor = 'pointer';
closeButton.style.zIndex = '25';
closeButton.style.opacity = '0';
closeButton.style.transition = 'opacity 0.4s ease';
closeButton.style.display = 'none';
document.body.appendChild(closeButton);

function closeIframe() {
  iframeWrapper.style.opacity = '0';
  iframeWrapper.style.transform = 'translate(-50%, -50%) scale(0.9)';
  setTimeout(() => iframeWrapper.style.display = 'none', 300);

  closeButton.style.opacity = '0';
  setTimeout(() => closeButton.style.display = 'none', 300);

  gsap.to(camera.position, {
    duration: 2,
    x: initialCameraPos.x,
    y: initialCameraPos.y,
    z: initialCameraPos.z,
    ease: "power2.inOut"
  });

  gsap.to(controls.target, {
    duration: 2,
    x: initialTarget.x,
    y: initialTarget.y,
    z: initialTarget.z,
    ease: "power2.inOut",
    onUpdate: () => controls.update(),
    onComplete: () => controls.enabled = true
  });

  setTimeout(() => {
    controls.minDistance = initialMinDistance;
    controls.maxDistance = initialMaxDistance;
  }, 1000);
}

// CLICK EN SCHEIBE
window.addEventListener('click', (event) => {
  if (!model) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(model.children, true);
  const object = intersects.find(i => i.object.name === 'scheibe')?.object;

  if (object) {
    controls.enabled = false;
    controls.minDistance = 0;
    controls.maxDistance = Infinity;

    const camPos = { x: 0.0763, y: 6.4343, z: -0.5689 };
    const targetPos = { x: 0.0663, y: 3.1455, z: 2.6322 };

    gsap.to(camera.position, {
      duration: 2,
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
      ease: "power2.inOut"
    });

    gsap.to(controls.target, {
      duration: 2,
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      ease: "power2.inOut",
      onUpdate: () => controls.update(),
      onComplete: () => {
        iframeWrapper.style.display = 'block';
        setTimeout(() => {
          iframeWrapper.style.opacity = '1';
          iframeWrapper.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);

        closeButton.style.display = 'block';
        setTimeout(() => closeButton.style.opacity = '1', 10);
      }
    });
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && iframeWrapper.style.display === 'block') {
    closeIframe();
  }
});

closeButton.addEventListener('click', closeIframe);

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

const render = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
};
render();
