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
    const options = {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` }
    };

    fetch('https://members.moph.go.th/api/v1/m/user', options)
      .then(response => response.json())
      .then(response => {
        console.log('mymoph_session_id ' + session_id);
        const obj = {
          username: response.cid,
          password: response.password_internet
        }
        io.emit(session_id, JSON.stringify(obj));
        res.send({ ok: true });

      })
      .catch(err => console.error(err));


    // console.log('mymoph_session_id ' + session_id);
    // const obj = {
    //   username: response.cid,
    //   password: response.password_internet
    // }
    // io.emit(session_id, JSON.stringify(obj));
    // res.send({ ok: true });

  } catch (error) {
    console.log(error);
    res.send({ ok: false });
  }
});


server.listen(3004, () => {
  console.log('listening on *:3004');
});
