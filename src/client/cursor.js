const Colyseus = require('colyseus.js');
const client = new Colyseus.Client('ws://10.0.0.99:2657');
const room = client.join('leapshot');
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
  room.send({mousemove: {x: e.movementX, y: e.movementY}});
});
document.addEventListener('wheel', e => {
  room.send({wheel: Math.sign(e.deltaY)});
});
document.addEventListener('keydown', e => {
  if (e.repeat) return;
  room.send({keydown: e.key});
});
document.addEventListener('keyup', e => {
  room.send({keyup: e.key});
});
