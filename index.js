const express = require('express');
const app = express();
bodyParser = require('body-parser');
var path = require('path');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var cors = require('cors')
app.use(cors())
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
const io = new Server(server, { secure: true });
// const io = new Server(server,
//   {
//     cors: {
//       origin: "http://localhost:3010",
//       credentials: true
//     }
//   });

io.on('connection', (socket) => {
  console.log(socket.id);
  // console.log(socket.handshake.headers.host);
  // console.log('a user connected');
});


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', '123');
  });
});

app.get('/', (req, res) => {
  app.use(express.static(path.join(__dirname, 'dist')));
  res.sendFile(path.join(__dirname, './dist/index.html'));

});

app.get('/test/:id', (req, res) => {
  const id = req.params.id;
  io.emit(id, 'test');
  res.send({ ok: true });

});

app.post('/mymoph', (req, res) => {
  try {
    const { session_id, access_token, refresh_token } = req.body;
    //   1|api  |   clientId: 'dQwGiPuucehlbSEVXiVU',
    // 1|api  |   sessionId: 'undefined',
    // 1|api  |   refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaWQiOiIxMTAwNDAwNzI4NTY0IiwiY29udGV4dCI6bnVsbCwiZXhwIjoxNzA1Njc3NzIzLCJpYXQiOjE2NzQxNDE3MjMsImlzcyI6ImF1dGhfbWVtYmVyIiwicmVmcmVzaF91dWlkIjoiY2Q5NDBlYmItNTA5ZS00MzNiLTlhODgtYjVlNDliODY1OTY1Iiwic3ViIjoiZGMzYWVlZTYtZjI3My00ZGZiLWEzM2MtMjQ1NTE2NDg5NjEyIn0.wRs5uO056CgrfMlzY1pS-cjxGeWo7t2thhBjHFNeKGU',
    // 1|api  |   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NfdXVpZCI6Ijg2MzU2YTQyLTg3NmItNGEzMy1hZDVlLTZiNmM4YjlkZWZhYiIsImNpZCI6IjExMDA0MDA3Mjg1NjQiLCJjb250ZXh0Ijp7fSwiZXhwIjoxNjc0MTQyNjIzLCJpYXQiOjE2NzQxNDE3MjMsImlzcyI6ImF1dGhfbWVtYmVyIiwic3ViIjoiZGMzYWVlZTYtZjI3My00ZGZiLWEzM2MtMjQ1NTE2NDg5NjEyIn0.gZvnIoKBigeT5sZgdstECFENMgOesiB_ekcxYhtv_nI'
    // 1|api  | }
    console.log('mymoph_session_id ' + session_id);
    const obj = {
      username: 'test',
      password: 'test'
    }
    io.emit(session_id, JSON.stringify(obj));
    res.send({ ok: true });

  } catch (error) {
    console.log(error);
    res.send({ ok: false });
  }
});


server.listen(3004, () => {
  console.log('listening on *:3004');
});
