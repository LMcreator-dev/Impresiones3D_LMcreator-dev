import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
import products from './products.json';
import filamentColors from './filament-colors.json';
import './style.css';

const whatsappNumber = '34624010211';
function makeWhatsApp(message) { return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`; }
document.querySelector('#custom-whatsapp').href = makeWhatsApp('Hola, me gustaría consultar un trabajo personalizado de impresión 3D.');
document.querySelector('#review-whatsapp').href = makeWhatsApp('Hola, me gustaría compartir mi opinión sobre una pieza que he encargado.');
document.querySelectorAll('[data-consult]').forEach(link => {
  link.href = makeWhatsApp(`Hola, me gustaría consultar el trabajo «${link.dataset.consult}».`);
});
const mahitoCanvas = document.querySelector('#mahito-canvas');
const mahitoContext = mahitoCanvas.getContext('2d', { willReadFrequently: true });
const mahitoImage = new Image();
mahitoImage.src = `${import.meta.env.BASE_URL}images/18_Mahito_cuadro.png`;
const showcasePreviews = {
  figure: { canvas: document.querySelector('#gengar-canvas'), image: new Image(), pixels: null, coverage: null },
  piece: { canvas: document.querySelector('#monster-canvas'), image: new Image(), pixels: null, coverage: null },
};
showcasePreviews.figure.image.src = `${import.meta.env.BASE_URL}images/8_Gengar_golpeado.png`;
showcasePreviews.piece.image.src = `${import.meta.env.BASE_URL}images/6_Vaso_Monster-reduced_1.png`;
const exampleFiles = import.meta.glob('./ejemplos/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const examplesCarousel = document.querySelector('#examples-carousel');
const examples = Object.entries(exampleFiles)
  .sort(([left], [right]) => left.localeCompare(right, 'es', { numeric: true, sensitivity: 'base' }))
  .map(([path, src]) => ({
    src,
    name: decodeURIComponent(path.split('/').pop().replace(/\.[^.]+$/, ''))
      .replace(/^\d+[\s._-]*/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  }));
if (examples.length) {
  examplesCarousel.innerHTML = examples.map(({ src, name }) => `
    <figure class="example-card">
      <img src="${src}" alt="${name}" loading="lazy" draggable="false">
    </figure>`).join('');
  examplesCarousel.querySelectorAll('.example-card img').forEach(image => {
    const setCardRatio = () => {
      if (image.naturalWidth && image.naturalHeight) {
        image.closest('.example-card').style.setProperty('--image-ratio', image.naturalWidth / image.naturalHeight);
      }
    };
    image.addEventListener('load', setCardRatio);
    setCardRatio();
  });
} else {
  examplesCarousel.innerHTML = '<p class="examples-empty">Añade imágenes a <code>src/ejemplos</code> para mostrarlas aquí.</p>';
}
const examplesDialog = document.querySelector('#examples-dialog');
const examplesDialogImage = document.querySelector('#examples-dialog-image');
let carouselPointerId = null;
let carouselStartX = 0;
let carouselStartScroll = 0;
let carouselDragged = false;
examplesCarousel.addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.pointerType !== 'mouse') return;
  carouselPointerId = event.pointerId;
  carouselStartX = event.clientX;
  carouselStartScroll = examplesCarousel.scrollLeft;
  carouselDragged = false;
  examplesCarousel.setPointerCapture(event.pointerId);
});
examplesCarousel.addEventListener('pointermove', event => {
  if (event.pointerId !== carouselPointerId) return;
  const distance = event.clientX - carouselStartX;
  if (Math.abs(distance) < 5) return;
  carouselDragged = true;
  examplesCarousel.classList.add('is-dragging');
  examplesCarousel.scrollLeft = carouselStartScroll - distance;
});
function finishExamplesDrag(event) {
  if (event.pointerId !== carouselPointerId) return;
  carouselPointerId = null;
  examplesCarousel.classList.remove('is-dragging');
  if (carouselDragged) window.setTimeout(() => { carouselDragged = false; }, 0);
}
examplesCarousel.addEventListener('pointerup', finishExamplesDrag);
examplesCarousel.addEventListener('pointercancel', finishExamplesDrag);
examplesCarousel.addEventListener('click', event => {
  if (carouselDragged) {
    event.preventDefault();
    event.stopPropagation();
    carouselDragged = false;
    return;
  }
  const image = event.target.closest('.example-card img');
  if (!image) return;
  examplesDialogImage.src = image.src;
  examplesDialogImage.alt = image.alt;
  examplesDialog.showModal();
});
document.querySelector('#examples-dialog-close').addEventListener('click', () => examplesDialog.close());
examplesDialog.addEventListener('click', event => {
  if (event.target === examplesDialog) examplesDialog.close();
});
document.querySelector('#examples-prev').addEventListener('click', () => {
  examplesCarousel.scrollBy({ left: -examplesCarousel.clientWidth * 0.8, behavior: 'smooth' });
});
document.querySelector('#examples-next').addEventListener('click', () => {
  examplesCarousel.scrollBy({ left: examplesCarousel.clientWidth * 0.8, behavior: 'smooth' });
});
const filamentSelections = {
  frame: filamentColors.findIndex(color => color.name === 'Ash'),
  art: filamentColors.findIndex(color => color.name === 'Lavender'),
  figure: filamentColors.findIndex(color => color.name === 'Lavender'),
  piece: filamentColors.findIndex(color => color.name === 'Ash'),
};
let mahitoBasePixels;
let mahitoColorMask;
function showFilament(region, index) {
  const colors = filamentColors;
  filamentSelections[region] = (index + colors.length) % colors.length;
  const color = colors[filamentSelections[region]];
  const carousel = document.querySelector(`[data-filament="${region}"]`);
  carousel.querySelector('.filament-swatch').style.backgroundColor = color.hex;
  carousel.querySelector('.filament-name').textContent = color.name;
  carousel.querySelector('.filament-index').textContent = `${filamentSelections[region] + 1} / ${colors.length}`;
  if (region === 'frame' || region === 'art') updateMahitoPreview();
  else updateShowcasePreview(region);
}
document.querySelectorAll('.filament-carousel').forEach(carousel => {
  const region = carousel.dataset.filament;
  const current = carousel.querySelector('.filament-current');
  carousel.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => {
    showFilament(region, filamentSelections[region] + Number(button.dataset.direction));
  }));
  current.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showFilament(region, filamentSelections[region] + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let startX = null;
  let activePointerId = null;
  current.addEventListener('pointerdown', event => {
    startX = event.clientX;
    activePointerId = event.pointerId;
    current.setPointerCapture(event.pointerId);
  });
  current.addEventListener('pointerup', event => {
    if (event.pointerId !== activePointerId || startX === null) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 28) showFilament(region, filamentSelections[region] + (distance < 0 ? 1 : -1));
    startX = null;
    activePointerId = null;
  });
  current.addEventListener('pointercancel', () => { startX = null; activePointerId = null; });
  showFilament(region, filamentSelections[region]);
});
function hexRgb(hex) {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
}
function litFilamentColor(hex, luminance) {
  const color = hexRgb(hex);
  const baseValue = Math.max(...color) / 255;
  const light = 0.28 + 0.72 * luminance;
  const reflection = (1 - baseValue) * (20 + 115 * Math.pow(luminance, 1.4));
  return color.map(channel => Math.min(255, Math.round(channel * light + reflection)));
}
function prepareShowcasePreview(region) {
  const preview = showcasePreviews[region];
  const { image, canvas } = preview;
  if (!image.naturalWidth || !canvas) return;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.drawImage(image, 0, 0);
  preview.pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const width = canvas.width;
  const height = canvas.height;
  preview.coverage = new Uint8Array(width * height);
  for (let pixel = 0; pixel < preview.coverage.length; pixel++) preview.coverage[pixel] = preview.pixels[pixel * 4 + 3];
  updateShowcasePreview(region);
}
function updateShowcasePreview(region) {
  const preview = showcasePreviews[region];
  if (!preview?.pixels || !preview.coverage) return;
  const context = preview.canvas.getContext('2d', { willReadFrequently: true });
  const pixels = new Uint8ClampedArray(preview.pixels.length);
  const backdrop = [246, 242, 232];
  const pixelCount = preview.coverage.length;
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    const coverage = preview.coverage[pixel] / 255;
    const offset = pixel * 4;
    pixels[offset + 3] = 255;
    if (!coverage) {
      for (let channel = 0; channel < 3; channel++) pixels[offset + channel] = backdrop[channel];
      continue;
    }
    const luminance = (preview.pixels[offset] * 0.2126 + preview.pixels[offset + 1] * 0.7152 + preview.pixels[offset + 2] * 0.0722) / 255;
    const litColor = litFilamentColor(filamentColors[filamentSelections[region]].hex, luminance);
    for (let channel = 0; channel < 3; channel++) {
      const tinted = litColor[channel];
      pixels[offset + channel] = Math.round(backdrop[channel] * (1 - coverage) + tinted * coverage);
    }
  }
  context.putImageData(new ImageData(pixels, preview.canvas.width, preview.canvas.height), 0, 0);
}
Object.keys(showcasePreviews).forEach(region => {
  const { image } = showcasePreviews[region];
  image.addEventListener('load', () => prepareShowcasePreview(region));
});
function pointInPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = (yi > py) !== (yj > py)
      && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
function prepareMahitoPreview() {
  const width = mahitoImage.naturalWidth;
  const height = mahitoImage.naturalHeight;
  if (!width || !height) return;
  mahitoCanvas.width = width;
  mahitoCanvas.height = height;
  mahitoContext.drawImage(mahitoImage, 0, 0);
  mahitoBasePixels = mahitoContext.getImageData(0, 0, width, height).data;
  mahitoColorMask = new Uint8Array(width * height);
  const scaleX = width / 1200;
  const scaleY = height / 896;
  const scalePolygon = points => points.map(([px, py]) => [px * scaleX, py * scaleY]);
  const frameOuter = scalePolygon([
    [260, 78], [260, 75], [262, 73], [266, 72], [943, 72], [947, 73], [949, 75], [950, 79],
    [950, 757], [949, 761], [947, 764], [943, 765], [267, 765], [263, 764], [261, 761],
  ]);
  const frameInner = scalePolygon([
    [284, 108], [284, 105], [286, 103], [290, 102], [913, 102], [917, 103], [920, 105], [923, 109],
    [923, 732], [922, 736], [919, 739], [915, 739], [292, 739], [288, 738], [285, 735], [284, 731],
  ]);
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const insideOuterFrame = pointInPolygon(px, py, frameOuter);
      const isArt = pointInPolygon(px, py, frameInner);
      const isFrame = insideOuterFrame && !isArt;
      if (isFrame) mahitoColorMask[py * width + px] = 1;
      else if (isArt) mahitoColorMask[py * width + px] = 2;
    }
  }
  updateMahitoPreview();
}
function updateMahitoPreview() {
  if (!mahitoBasePixels || !mahitoColorMask) return;
  const frame = filamentColors[filamentSelections.frame].hex;
  const art = filamentColors[filamentSelections.art].hex;
  const data = new Uint8ClampedArray(mahitoBasePixels);
  for (let index = 0; index < mahitoColorMask.length; index++) {
    const region = mahitoColorMask[index];
    if (!region) continue;
    const offset = index * 4;
    if (region === 1) {
      const luminance = (mahitoBasePixels[offset] * 0.2126 + mahitoBasePixels[offset + 1] * 0.7152 + mahitoBasePixels[offset + 2] * 0.0722) / 255;
      const shadedColor = litFilamentColor(frame, luminance);
      for (let channel = 0; channel < 3; channel++) data[offset + channel] = shadedColor[channel];
    } else {
      const luminance = (mahitoBasePixels[offset] * 0.2126 + mahitoBasePixels[offset + 1] * 0.7152 + mahitoBasePixels[offset + 2] * 0.0722) / 255;
      const shadedColor = litFilamentColor(art, luminance);
      for (let channel = 0; channel < 3; channel++) data[offset + channel] = shadedColor[channel];
    }
  }
  mahitoContext.putImageData(new ImageData(data, mahitoCanvas.width, mahitoCanvas.height), 0, 0);
}
mahitoImage.addEventListener('load', prepareMahitoPreview);

const viewerEl = document.querySelector('#three-viewer');
const viewerHint = document.querySelector('#viewer-hint');
let activeProduct = products[0];
let scene, camera, renderer, controls, currentModel;
function updateViewerHint() {
  viewerHint.textContent = window.matchMedia('(pointer: coarse)').matches ? 'Arrastra para girar · Pellizca para acercar' : 'Arrastra para girar · Desplaza para acercar';
}
updateViewerHint();
window.addEventListener('resize', updateViewerHint);
function initViewer() {
  scene = new THREE.Scene(); scene.background = new THREE.Color('#211e19');
  camera = new THREE.PerspectiveCamera(35, viewerEl.clientWidth / viewerEl.clientHeight, 0.1, 1000); camera.position.set(5,4,7);
  renderer = new THREE.WebGLRenderer({antialias:true, alpha:false}); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewerEl.querySelector('.viewer-loading')?.remove(); viewerEl.prepend(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 0.65; controls.minDistance = 3; controls.maxDistance = 14;
  scene.add(new THREE.HemisphereLight(0xf5e8d0,0x3b3025,2.1));
  const key = new THREE.DirectionalLight(0xffe1b0,3.2); key.position.set(4,7,5); key.castShadow = true; scene.add(key);
  const fill = new THREE.PointLight(0x8f9d88,35); fill.position.set(-5,2,-3); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(5,80),new THREE.MeshStandardMaterial({color:0x302b24,roughness:.88})); floor.rotation.x=-Math.PI/2; floor.position.y=-1.45; floor.receiveShadow=true; scene.add(floor);
  const gridHelper = new THREE.GridHelper(10,30,0x756449,0x4c4336); gridHelper.position.y=-1.44; gridHelper.material.transparent=true; gridHelper.material.opacity=.18; scene.add(gridHelper);
  window.addEventListener('resize', resizeViewer);
  animate(); loadProduct(activeProduct);
}
function resizeViewer(){ if(!renderer) return; const w=viewerEl.clientWidth,h=viewerEl.clientHeight; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); }
function animate(){ requestAnimationFrame(animate); controls?.update(); renderer?.render(scene,camera); }
function proceduralModel(product) {
  const material = new THREE.MeshStandardMaterial({ color: product.color, metalness: 0.16, roughness: 0.38 });
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.48, 1.8, 8), material);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), material);
  const base = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.08, 12, 32), material);
  top.position.y = 1.05;
  base.position.y = -0.65;
  for (const mesh of [body, top, base]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}function loadProduct(p) {
  if(!scene) return;
  activeProduct=p; document.querySelector('#viewer-name').textContent=p.name;
  document.querySelector('#viewer-index').textContent = `${String(products.indexOf(p) + 1).padStart(2, '0')} / ${String(products.length).padStart(2, '0')}`;
  document.querySelector('#viewer-order').href = makeWhatsApp(`Hola, he visto ${p.name} y me gustaría consultar este trabajo.`);
  if(currentModel){scene.remove(currentModel); currentModel.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  if(p.model) {
    const ext=p.model.split('.').pop().toLowerCase(); const loader=ext==='3mf'?new ThreeMFLoader():new STLLoader();
    loader.load(`${import.meta.env.BASE_URL}${p.model.replace(/^\//, '')}`, result=>{
      if(ext==='stl'){
        const mesh=new THREE.Mesh(result,new THREE.MeshStandardMaterial({color:p.color,metalness:.12,roughness:.42}));
        const rotation=(p.rotationDegrees || [-90,0,0]).map(angle=>THREE.MathUtils.degToRad(angle));
        mesh.rotation.set(...rotation);
        currentModel=mesh;
      } else currentModel=result;
      fitModel(currentModel);
    },undefined,()=>{currentModel=proceduralModel(p);fitModel(currentModel);});
  } else { currentModel=proceduralModel(p); fitModel(currentModel); }
}
function fitModel(model){ scene.add(model); const box=new THREE.Box3().setFromObject(model); const center=box.getCenter(new THREE.Vector3()); const size=box.getSize(new THREE.Vector3()); const max=Math.max(size.x,size.y,size.z); const scale=2.6/(max||1); model.scale.setScalar(scale); model.position.sub(center).multiplyScalar(scale); model.position.y-=.15; controls.target.set(0,0,0); camera.position.set(4,3,5); controls.update(); }
function changeViewerProduct(direction) {
  const currentIndex = products.indexOf(activeProduct);
  const nextIndex = (currentIndex + direction + products.length) % products.length;
  loadProduct(products[nextIndex]);
}
document.querySelector('#model-prev').addEventListener('click', () => changeViewerProduct(-1));
document.querySelector('#model-next').addEventListener('click', () => changeViewerProduct(1));
document.querySelector('#reset-view').addEventListener('click',()=>{ if(!controls)return; camera.position.set(4,3,5); controls.target.set(0,0,0); controls.update(); });
initViewer();
