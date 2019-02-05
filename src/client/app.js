/* global THREE, startMeshing */
const Colyseus = require('colyseus.js');

const scene = new THREE.Scene();
const appScene = new THREE.Object3D();
appScene.matrixAutoUpdate = false;
scene.add(appScene);

const box = new THREE.Mesh(
  new THREE.BoxBufferGeometry(0.2, 0.2, 0.2),
  new THREE.MeshBasicMaterial({color: 'red'}),
);
box.frustumCulled = false;
box.position.set(0, 0, 0);
appScene.add(box);

const cursor = window.cursor = new THREE.Object3D();
cursor.frustumCulled = false;
appScene.add(cursor);

new THREE.GLTFLoader().load('cursor.glb', model => {
  const mesh = model.scene.children[0];
  mesh.scale.setScalar(0.005);
  mesh.rotation.y = Math.PI;
  mesh.position.y = -0.1;
  mesh.position.x = 0.025;
  mesh.traverse(obj => {
    obj.frustumCulled = false;
    if (obj.material) {
      obj.material = new THREE.MeshBasicMaterial({map: obj.material.map});
    }
  });
  cursor.add(mesh);
});

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const camera = window.camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  100,
);
camera.position.z = 3;
camera.position.set(0, 1.3, -0.3);
const controls = new THREE.FlyControls(camera);
controls.dragToLook = true;
controls.rollSpeed = 0.5;
renderer.setAnimationLoop(animate);
startMeshing(renderer, scene);

const raycaster =  new THREE.Raycaster();
raycaster.ray.direction.z = -1;
const intersects = [];
var moving;
const offset = new THREE.Vector3();
const images = window.images = [];
const clock = new THREE.Clock();
function animate() {
  controls.update(clock.getDelta());
  if (moving) {
    moving.position.copy(cursor.position);
    moving.position.add(offset);
  }

  const renderCamera = renderer.vr.enabled ? renderer.vr.getCamera(camera) : camera;

  /*
  if (renderCamera.cameras) {
    const cameraL = renderCamera.cameras[0];
    cameraL.matrix.decompose(cameraL.position, cameraL.quaternion, cameraL.scale);
    box.position.copy(cameraL.position);
    box.rotation.y = cameraL.rotation.y;
    box.position.z -= 0.5;
  }
  */

  renderer.render(scene, renderCamera);
}

(async () => {
  if (!navigator.xr) return;
  const display = await navigator.xr.requestDevice();
  const session = await display.requestSession({exclusive: true});
  display.session = session;

  session.requestAnimationFrame((timestamp, frame) => {
    renderer.vr.setSession(session, {frameOfReferenceType: 'stage'});

    const viewport = session.baseLayer.getViewport(frame.views[0]);
    const width = viewport.width;
    const height = viewport.height;

    renderer.setAnimationLoop(null);

    renderer.setSize(width * 2, height);

    renderer.vr.enabled = true;
    renderer.vr.setDevice(display);
    renderer.vr.setAnimationLoop(animate);
  });
})();

const client = new Colyseus.Client('ws://10.0.0.99:2657');
const room = client.join('leapshot');

const loader = new THREE.TextureLoader();

room.listen('images/:*', change => {
  const img = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.1, 0.1),
    new THREE.MeshBasicMaterial({
      map: loader.load('/' + change.value, texture => {
        texture.anisotropy = renderer.getMaxAnisotropy();
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestMipMapNearestFilter;
        texture.anisotropy = renderer.getMaxAnisotropy();
        img.scale.x = texture.image.naturalWidth / texture.image.naturalHeight;
        img.scale.multiplyScalar(texture.image.naturalHeight / 400);
      }),
      side: THREE.DoubleSide,
    }),
  );
  img.frustumCulled = false;
  img.position.copy(cursor.position);
  img.position.z -= 0.05;
  images.push(img);
  appScene.add(img);
});

let intersected;
room.listen('pos/:coord', change => {
  cursor.position[change.path.coord] = change.value;
  raycaster.ray.origin[change.path.coord] = change.value;
  for (const image of images) {
    image.material.color.setHex(0xFFFFFF);
  }
  intersects.length = 0;
  raycaster.intersectObjects(images, false, intersects);
  if (intersects.length) {
    intersected = intersects[0].object;
    intersected.material.color.setHex(0xFFAAAA);
  } else {
    intersected = null;
  }
});

room.listen('buttons/:value', change => {
  if (cursor.children[0]) {
    cursor.children[0].material.color.setHex(change.value === 0 ? 0xFFFFFF : 0xFFAAAA);
  }
  if (change.value) {
    if (intersected) {
      offset.subVectors(intersected.position, cursor.position);
      moving = intersected;
    }
  } else {
    moving = null;
  }
});

let keys = [];
let scaleTarget;
room.onMessage.add((message) => {
  if (message.keydown) {
    keys.push(message.keydown);
    if(message.keydown === 'Shift') {
      scaleTarget = intersected;
    }
  }
  if (message.keyup) {
    keys.splice(keys.indexOf(message.keyup), 1);
    if(message.keyup === 'Shift') {
      scaleTarget = null;
    }
  }
  if (scaleTarget && message.wheel) {
    scaleTarget.scale.multiplyScalar(1 - message.wheel * 0.5);
  }
});
