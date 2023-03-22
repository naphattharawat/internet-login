const express = require('express');
const app = express();
bodyParser = require('body-parser');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var cors = require('cors')
app.use(cors())
app.set('view engine', 'ejs');
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: false }));


const io = new Server(server, {
  secure: true,
  cors: {
    origin: "localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});


io.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

io.on('connection', (socket) => {
  console.log(socket.id);
  // console.log(socket.handshake.headers.host);
  // console.log('a user connected');
});


app.get('/', (req, res) => {
  res.send({ ok: true });
});


server.listen(3004, () => {
  console.log('listening on *:3004');
});
