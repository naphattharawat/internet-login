const express = require('express');
const app = express();
bodyParser = require('body-parser');
var path = require('path');
const http = require('http');
const request = require('request');
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
app.get('/2', (req, res) => {
  // app.use(express.static(path.join(__dirname, 'dist')));
  res.sendFile(path.join(__dirname, './indexold.html'));

});
app.get('/3', (req, res) => {
  // app.use(express.static(path.join(__dirname, 'dist')));
  res.sendFile(path.join(__dirname, './fotigate-login-new.html'));

});

app.get('/test/:id', (req, res) => {
  const id = req.params.id;
  io.emit(id, 'test');
  res.send({ ok: true });

});
function getUsername(token) {
  const options = {
    method: 'GET',
    url: 'https://members.moph.go.th/api/v2/user',
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (error) { reject(error) } else {
        resolve(JSON.parse(body));
      }
    });
  })

}
app.post('/mymoph', async (req, res) => {
  try {
    const { session_id, access_token, refresh_token } = req.body;
    const info = await getUsername(access_token);
    // console.log(info);
    const obj = {
      username: info.cid,
      password: info.password_internet
    }
    console.log(obj);
    console.log('mymoph_session_id ' + session_id);
    io.emit(session_id, JSON.stringify(obj));
    res.send({ ok: true });
  } catch (error) {
    console.log(error);
    res.send({ ok: false });
  }
});

app.get('/mymoph', async (req, res) => {
  try {
    const { session_id, access_token, refresh_token } = req.query;
    const info = await getUsername(access_token);
    // console.log(info);
    const obj = {
      username: info.cid,
      password: info.password_internet
    }
    console.log(obj);
    console.log('mymoph_session_id ' + session_id);
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
