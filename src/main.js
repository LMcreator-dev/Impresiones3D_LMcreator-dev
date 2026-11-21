import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
import products from './products.json';
import './style.css';

const grid = document.querySelector('#product-grid');
const viewerEl = document.querySelector('#three-viewer');
const viewerHint = document.querySelector('#viewer-hint');
const whatsappNumber = '34624010211'; // Sustituye por tu número, con prefijo internacional y sin +
let activeProduct = products[0];
let scene, camera, renderer, controls, currentModel;

function updateViewerHint() {
  if (!viewerHint) return;
  viewerHint.textContent = window.matchMedia('(pointer: coarse)').matches
    ? 'Arrastra para girar · Pellizca para acercar'
    : 'Arrastra para girar · Desplaza para acercar';
}
updateViewerHint();
window.addEventListener('resize', updateViewerHint);

function makeWhatsApp(message) { return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`; }
document.querySelector('#custom-whatsapp').href = makeWhatsApp('Hola, me gustaría consultar un encargo personalizado de impresión 3D.');
document.querySelector('#review-whatsapp').href = makeWhatsApp('Hola, me gustaría compartir mi opinión sobre una pieza que he encargado.');

function productCard(p, index) {
  const visual = p.thumbnail
    ? `<img class="product-thumbnail" src="${import.meta.env.BASE_URL}${p.thumbnail}" alt="Vista de ${p.name}">`
    : `<span class="mini-piece mini-${p.shape}"><i></i></span>`;
  return `<article class="product-card" style="--piece:${p.color};--delay:${index * 70}ms">
    <button class="product-visual" data-open="${p.id}" aria-label="Ver ${p.name} en 3D"><span class="visual-index">0${index+1}</span>${visual}<span class="visual-open">Ver en 3D</span></button>
    <div class="product-info"><div><span class="product-tag">${p.tag}</span><h3>${p.name}</h3></div><span class="product-price">${p.price}</span></div>
    <p class="product-description">${p.description}</p><button class="product-order" data-order="${p.id}">Solicitar presupuesto <span>⟶</span></button>
  </article>`;
}
function renderProducts(filter='todos') {
  const items = products.filter(p => filter === 'todos' || p.category === filter);
  grid.innerHTML = items.map(productCard).join('');
  grid.querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', () => selectProduct(el.dataset.open)));
  grid.querySelectorAll('[data-order]').forEach(el => el.addEventListener('click', () => {
    const p = products.find(x => x.id === el.dataset.order);
    window.open(makeWhatsApp(`Hola, he visto ${p.name} y me gustaría pedir presupuesto. ¿Me podrías pasar precio?`), '_blank', 'noopener');
  }));
}
document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); renderProducts(btn.dataset.filter);
}));
renderProducts();

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
function proceduralModel(p) {
  const mat = new THREE.MeshStandardMaterial({color:p.color, metalness:.16, roughness:.38});
  const group = new THREE.Group();
  const add = (geo,x,y,z,sx=1,sy=1,sz=1,material=mat) => { const m=new THREE.Mesh(geo,material); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=true; m.receiveShadow=true; group.add(m); return m; };
  if(p.shape==='dragon') {
    for(let i=0;i<7;i++){ const t=i/6; add(new THREE.SphereGeometry(.42,32,24),Math.sin(t*3.2)*.45, -.6+t*1.25,Math.cos(t*3.2)*.35,1-t*.18,.72,1-t*.18); }
    add(new THREE.SphereGeometry(.35,32,24),.15,.85,.05,1.25,.9,1.05);
    for(let s of [-1,1]) { add(new THREE.ConeGeometry(.12,.5,16),.0+s*.28,1.22,.0,.7,1,1); add(new THREE.ConeGeometry(.24,.8,3),s*.65,.25,0,1,.25,1); }
  } else if(p.shape==='flower') {
    add(new THREE.CylinderGeometry(.07,.09,1.7,24),0,-.35,0); add(new THREE.SphereGeometry(.22,24,16),0,.62,0);
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9; const pet=add(new THREE.SphereGeometry(.26,24,16),Math.cos(a)*.34,.72+Math.sin(a)*.34,0,1.1,1.65,.65); pet.rotation.z=-a;}
  } else if(p.shape==='torus') {
    const tor=add(new THREE.TorusKnotGeometry(.72,.22,180,24,2,3),0,0,0); tor.rotation.x=.4;
    add(new THREE.TorusGeometry(1.05,.045,12,80),0,0,0).rotation.x=1.15;
  } else if(p.shape==='vase') {
    const pts=[]; for(let i=0;i<=30;i++){const t=i/30; pts.push(new THREE.Vector2(.35+.42*Math.sin(t*Math.PI*.92),-1+t*2.1));}
    add(new THREE.LatheGeometry(pts,64),0,0,0);
  } else if(p.shape==='stand') {
    add(new THREE.BoxGeometry(1.6,.18,1.15),0,-.55,0); add(new THREE.BoxGeometry(1.3,.22,.18),0,.12,-.43); add(new THREE.BoxGeometry(.18,.95,.18),-.58,-.05,-.43); add(new THREE.BoxGeometry(.18,.95,.18),.58,-.05,-.43);
  } else {
    add(new THREE.CylinderGeometry(.22,.48,1.8,8),0,0,0); add(new THREE.SphereGeometry(.4,24,16),0,1.05,0); add(new THREE.TorusGeometry(.34,.08,12,32),0,-.65,0);
  }
  return group;
}
function loadProduct(p) {
  if(!scene) return;
  activeProduct=p; document.querySelector('#viewer-name').textContent=p.name;
  document.querySelector('#viewer-order').href = makeWhatsApp(`Hola, he visto ${p.name} y me gustaría pedir presupuesto. ¿Me podrías pasar precio?`);
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
function selectProduct(id){ const p=products.find(x=>x.id===id); if(!p)return; loadProduct(p); document.querySelector('#visor').scrollIntoView({behavior:'smooth'}); }
document.querySelector('#reset-view').addEventListener('click',()=>{ if(!controls)return; camera.position.set(4,3,5); controls.target.set(0,0,0); controls.update(); });
initViewer();
