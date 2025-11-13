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

// 🎨 Añadir fog (niebla) para desvanecer el grid
scene.fog = new THREE.Fog(0xC5DBA7, 10, 60);

// 🔹 Cámara
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set( 
6.974217127390317,
9.373796823210638,
-11.4915514965553);
scene.add(camera);

// 🔹 Renderizador
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// 🔹 Controles de cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(-0.08685893376202979,
2.576360315368435,
2.3361640670660813);

// 🔹 Registrar posición cada vez que se mueve la cámara
controls.addEventListener('change', () => {
  console.log('📍 Cámara:', camera.position);
  console.log('🎯 Target:', controls.target);
});

// 🔹 Cargadores
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); // carpeta en /public/draco/

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// 🔹 Cargar HDRI
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/hdri/brown_photostudio_02_4k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = new THREE.Color(0xC5DBA7); // Fondo
});

// 🔹 Añadir suelo con grid tipo Blender
{
  // Plano invisible que da base
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xC5DBA7,
    transparent: true,
    opacity: 0.0, // completamente invisible
    roughness: 1,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid Helper visible
  const grid = new THREE.GridHelper(200, 200, 0x8C8C7A, 0xA0A084);
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  grid.position.y = 0.001; // evitar z-fighting
  scene.add(grid);
}

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
