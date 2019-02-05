const Colyseus = require('colyseus.js');
const client = new Colyseus.Client('ws://10.0.0.99:2657');
const room = client.join('leapshot');
const state = {x: 0, y: 1.3, z: -0.45};
const keys = [];
const info = document.getElementById('info');
document.addEventListener('contextmenu', e => {
  e.preventDefault();
});
document.addEventListener('click', e => {
  e.preventDefault();
  if (e.button === 0) {
    document.body.requestPointerLock();
  } else if (e.button === 2) {
    document.exitPointerLock();
  }
});
document.addEventListener('mousedown', e => {
  room.send({buttons: e.buttons});
});
document.addEventListener('mouseup', e => {
  room.send({buttons: e.buttons});
});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) {
    document.body.classList.add('captured');
    info.textContent = "mouse captured";
  } else {
    document.body.classList.remove('captured');
    info.textContent = "click to capture mouse";
  }
});
document.addEventListener('mousemove', e => {
  if (!document.pointerLockElement) return;
  state.x += e.movementX / 2000;
  if (e.buttons & 4) {
    state.z += e.movementY / 1000;
  } else {
    state.y -= e.movementY / 2000;
  }
  room.send({pos: state});
});
document.addEventListener('wheel', e => {
  if (!keys.includes('Shift')) {
    state.z += Math.sign(e.deltaY) * 0.05;
    room.send({pos: state});
  }
  room.send({wheel: Math.sign(e.deltaY)});
});
document.addEventListener('keydown', e => {
  if (e.repeat) return;
  keys.push(e.key);
  room.send({keydown: e.key});
});
document.addEventListener('keyup', e => {
  keys.splice(keys.indexOf(e.key), 1);
  room.send({keyup: e.key});
});
