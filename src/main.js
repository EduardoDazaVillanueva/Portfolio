import * as THREE from 'three';
import './style.scss';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// 🔹 Canvas y tamaños
const canvas = document.querySelector('#experience-canvas');
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// 🔹 Escena
const scene = new THREE.Scene();

// 🔹 Cámara
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(
0.12042540400058724,
6.000397745102025, 
-6.429706030250914);

scene.add(camera);

// 🔹 Renderizador
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Configuración PBR realista
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// 🔹 Controles de cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(
0.0017785926382591817,
0.7583084101017751,
0.7077098455815504);

// 🔹 Cargadores
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); // carpeta en /public/draco/

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// 🔹 Cargar HDRI
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/hdri/brown_photostudio_02_4k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;      // Iluminación PBR
});

// 🔹 Luces adicionales (por si el HDRI no es suficiente)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// 🔹 Cargar el modelo principal
gltfLoader.load(
  '/models/portfolioWebMateriales-v1.glb',
  (glb) => {
    const model = glb.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    scene.add(model);

    console.log('✅ Modelo cargado correctamente');
  },
  (progress) => {
    console.log(`Cargando modelo: ${(progress.loaded / progress.total) * 100}%`);
  },
  (error) => {
    console.error('❌ Error cargando GLB:', error);
  }
);

// 🔹 Resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 🔹 Animación / Render Loop
const render = () => {
  controls.update();


  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

render();
