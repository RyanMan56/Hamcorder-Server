const http = require('http');
const raspividStream = require('raspivid-stream');
const WebSocket = require('ws');
const url = require('url');

// const hostname = '127.0.0.1';
const hostname = '192.168.1.156';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello world!\n');
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws) {
  console.log('client connected to websocket server');

  // Not null, but providing any values to these bools crashes the raspicam cli
  const videoStream = new raspividStream({ vflip: null, hflip: null });

  ws.on('close', function close(code, reason) {
    console.log(`client disconnected with code ${code}`);
    videoStream.removeAllListeners('data');
  });

  videoStream.on('data', (data) => {
    // Ready state constants:
    // CONNECTING	0	The connection is not yet open.
    // OPEN	      1	The connection is open and ready to communicate.
    // CLOSING    2 The connection is in the process of closing.
    // CLOSED	    3	The connection is closed.
    if (ws.readyState === 1) {
      ws.send(data, { binary: true }, (error) => { if(error) console.log(error); });
    }
  });
});

server.on('upgrade', function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
