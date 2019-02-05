const http = require('http');
const {Server, Room} = require('colyseus');
const chokidar = require('chokidar');
const homedir = require('os').homedir();
const basename = require('path').basename;

const server = new Server({server: http.createServer()});

class LeapShot extends Room {
  onInit() {
    this.setState({
      images: [],
      pos: {x: 0, y: 0, z: 0},
      buttons: {value: 0},
    });

    chokidar.watch(`${homedir}/Pictures/Screenshots`, {ignoreInitial: true}).on('add', (path) => {
      this.state.images.push(basename(path));
    });
  }
  onJoin() {
    this.state.pos.x = 0;
    this.state.pos.y = 1.3;
    this.state.pos.z = -0.45;
  }
  onMessage(client, data) {
    if (data.pos) {
      this.state.pos.x = data.pos.x;
      this.state.pos.y = data.pos.y;
      this.state.pos.z = data.pos.z;
    }
    if (data.buttons !== undefined) {
      this.state.buttons.value = data.buttons;
    }
    if (data.keyup !== undefined) {
      this.broadcast(data);
    }
    if (data.keydown !== undefined) {
      this.broadcast(data);
    }
    if (data.wheel !== undefined) {
      this.broadcast(data);
    }
  }
}

server.register('leapshot', LeapShot);
server.listen(2657);
