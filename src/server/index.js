const http = require('http');
const {Server, Room} = require('colyseus');
const chokidar = require('chokidar');
const homedir = require('os').homedir();
const basename = require('path').basename;

const server = new Server({server: http.createServer()});

class LeapShot extends Room {
  onInit() {
    chokidar.watch(`${homedir}/Pictures/Screenshots`, {ignoreInitial: true}).on('add', (path) => {
      this.broadcast({image: basename(path)})
    });
  }
  onMessage(client, data) {
    if (data.buttons !== undefined) {
      this.broadcast(data);
    }
    if (data.mousemove !== undefined) {
      this.broadcast(data);
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
