const express = require('express');
const app = express();
bodyParser = require('body-parser');
var path = require('path');
const http = require('http');
const axios = require('axios');
const server = http.createServer(app);
const { Server } = require("socket.io");

const { createClient } = require('redis');




var cors = require('cors')
app.use(cors())
app.set('view engine', 'ejs');
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
const io = new Server(server, {
  secure: true,
  cors: {
    origin: "internet-authen.moph.go.th",
    methods: ["GET", "POST"],
    credentials: true
  }
});
// const io = new Server(server,
//   {
//     secure: true,
//     cors: {
//       origin: "http://localhost:3004",
//       methods: ["GET", "POST"],
//       credentials: true
//     }
//   });

io.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

io.on('connection', (socket) => {
  console.log(socket.id);
  // console.log(socket.handshake.headers.host);
  // console.log('a user connected');
});


// io.on('connection', (socket) => {
//   socket.on('chat message', msg => {
//     io.emit('chat message', '123');
//   });
// });
// Subscriber
// const subscriberClient = clientRedis.createClient();
const clientRedis = createClient();
clientRedis.on('error', err => console.log('Redis Client Error', err));
clientRedis.connect()
const pub = clientRedis.duplicate();
pub.connect();
clientRedis.subscribe('socket', (message) => {
  const js = JSON.parse(message)
  const data = {
    username: js.username,
    password: js.password,
  }
  // //io.emit(js.sessionId, JSON.stringify(data));
  io.to(js.sessionId).emit(js.sessionId, JSON.stringify(data));
}).catch((e) => {
  console.log(e);
})



app.get('/3', async (req, res) => {
  res.render('thaid', {
    ip: 'js.ip',
    protocol: 'js.protocol',
    magic: 'js.magic',
    username: 'result.body.username',
    password: 'result.body.password',
    url: ``
  })
});

app.get('/', (req, res) => {
  app.use(express.static(path.join(__dirname, 'dist')));
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

app.get('/2', (req, res) => {
  app.use(express.static(path.join(__dirname, 'dist')));
  res.sendFile(path.join(__dirname, './dist/index2.html'));
});

app.get('/state', async (req, res) => {
  try {
    const { ip, magic, protocol } = req.query;
    const state = Math.floor(Math.random() * 900000000000) + 100000000000;
    const data = {
      'ip': ip,
      'magic': magic,
      'protocol': protocol
    };
    await pub.set(state.toString(), JSON.stringify(data), { 'EX': (60 * 3) });
    res.send({ ok: true, state: state });
  } catch (error) {
    console.log(error);
    res.send({ ok: false });
  }
});


app.get('/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state;
    if (code) {
      const rs = await requestTokenThaiD(code);
      // console.log(rs);
      if (rs.statusCode == 200) {
        const value = await pub.get(state);
        // console.log(value);
        if (value) {
          // generate username
          await createUsernameThaid(rs.body.access_token, rs.body.given_name, rs.body.family_name, rs.body.pid, rs.body.address.formatted, rs.body.birthdate, rs.body.gender).then((result) => {
            if (result.statusCode == 200) {
              if (result.body.ok) {
                console.log(result.body);
                const js = JSON.parse(value);
                console.log(js);
                res.render('thaid', {
                  ip: js.ip,
                  protocol: js.protocol,
                  magic: js.magic,
                  username: result.body.username,
                  password: result.body.password,
                  url: `${js.protocol || 'https://'}//${js.ip}/fgtauth?${js.magic}`
                })
              } else {
                console.log(result);
                console.log('ok false');
                res.send({ ok: false });
              }
            } else {
              console.log(result.statusCode);
              res.send({ ok: false });
            }
          }).catch((err) => {
            console.log('catch');
            console.log(err);
            res.send({ ok: false });
          });

        } else {
          console.log('get redis failed');
          res.send({ ok: false });
        }
      } else {
        console.log('thaid');
        res.send(rs.body);
      }
    } else {
      console.log('query');
      res.send({ ok: false });
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.get('/callback-providerid', async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state;
    if (code) {
      console.log('code', code);

      const rs = await requestTokenMOPHID(code);
      console.log('rs', rs);
      if (rs.body.status == 'success') {
        const mophIdToken = rs.body.data.access_token;
        console.log('mophIdToken', mophIdToken);
        const rs2 = await requestTokenProviderId(mophIdToken)
        console.log('rs2', rs2);
        if (rs.body.status == 200) {
          const providerIdToken = rs2.body.data.access_token;
          const value = await pub.get(state);
          // console.log(value);
          if (value) {
            // generate username
            const profile = await getProfileProviderId(mophIdToken);
            console.log('profile', profile);
            
            await createUsernameProviderID(providerIdToken, profile.body.data.firstname_th, profile.body.data.lastname_th, profile.body.data.full_cid, `${profile.body.data.organization[0].hcode}-${profile.body.data.organization[0].hname_th}`).then((result) => {
              if (result.statusCode == 200) {
                if (result.body.ok) {
                  console.log(result.body);
                  const js = JSON.parse(value);
                  console.log(js);
                  res.render('thaid', {
                    ip: js.ip,
                    protocol: js.protocol,
                    magic: js.magic,
                    username: result.body.username,
                    password: result.body.password,
                    url: `${js.protocol || 'https://'}//${js.ip}/fgtauth?${js.magic}`
                  })
                } else {
                  console.log(result);
                  console.log('ok false');
                  res.send({ ok: false });
                }
              } else {
                console.log(result.statusCode);
                res.send({ ok: false });
              }
            }).catch((err) => {
              console.log('catch');
              console.log(err);
              res.send({ ok: false });
            });

          } else {
            console.log('get redis failed');
            res.send({ ok: false });
          }

        }
      }
      // console.log(rs);
    } else {
      console.log('query');
      res.send({ ok: false });
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

function requestTokenThaiD(code) {
  try {

    // ใช้ค่า “Basic”+Base64({{client_id}}:{{client_secret}})
    const authorization = Buffer.from(`M0VvdVpyaVQ0TnNlYUpPMHNyQXo5eURzU25rZkt4UW0=:THpwQUcya1BUbjNISVpiNVJLdDd2OHFpT3lIU1BsWjdqbWx4U3lMQg==`).toString('base64');
    const data = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://internet-authen.moph.go.th/callback/'
    }
    const options = {
      method: 'POST',
      url: 'https://imauth.bora.dopa.go.th/api/v2/oauth2/token/',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authorization}`
        // 'Content-Length': Buffer.byteLength(JSON.stringify(data))
      },
      data: data
    };
    return new Promise((resolve, reject) => {
      axios(options).then(function (response) {
        resolve({ statusCode: response.status, body: response.data });
      }).catch(function (error) {
        // console.log(error);
        reject({ statusCode: error.response.status, error: error.response.data });
      });
    })
  } catch (error) {
    console.log(error);
    return error;
  }

}
function requestTokenMOPHID(code) {
  try {

    // ใช้ค่า “Basic”+Base64({{client_id}}:{{client_secret}})
    // const authorization = Buffer.from(`9c421c1f-68cd-461c-b23d-33f6f3b33d1e:sSYQGjjdQ55U3VMxAEWYu6D1CgkyYEMBqEgz5CHv`).toString('base64');
    const data = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://internet-authen.moph.go.th/callback-providerid',
      client_id:'9c421c1f-68cd-461c-b23d-33f6f3b33d1e',
      client_secret: 'sSYQGjjdQ55U3VMxAEWYu6D1CgkyYEMBqEgz5CHv'
    }
    const options = {
      method: 'POST',
      url: 'https://moph.id.th/api/v1/token',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
        // 'Authorization': `Basic ${authorization}`
      },
      data: data
    };
    return new Promise((resolve, reject) => {
      axios(options).then(function (response) {
        resolve({ statusCode: response.status, body: response.data });
      }).catch(function (error) {
        // console.log(error);
        reject({ statusCode: error.response.status, error: error.response.data });
      });
    })
  } catch (error) {
    console.log(error);
    return error;
  }

}

function requestTokenProviderId(token) {
  try {
    const data = {
      token: token,
      token_by: 'Health ID',
      client_id: '4b5aa9d4-39d0-4c10-9cef-bd860737985d',
      secret_key: '8XNIaPJTOKSrz0aepLXuVjEgwxFYW67D'
    }
    const options = {
      method: 'POST',
      url: 'https://provider.id.th/api/v1/services/token',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      },
      data: data
    };
    return new Promise((resolve, reject) => {
      axios(options).then(function (response) {
        resolve({ statusCode: response.status, body: response.data });
      }).catch(function (error) {
        // console.log(error);
        reject({ statusCode: error.response.status, error: error.response.data });
      });
    })
  } catch (error) {
    console.log(error);
    return error;
  }

}

function getProfileProviderId(token) {
  try {

    // ใช้ค่า “Basic”+Base64({{client_id}}:{{client_secret}})
    // const authorization = Buffer.from(`9c421c1f-68cd-461c-b23d-33f6f3b33d1e:sSYQGjjdQ55U3VMxAEWYu6D1CgkyYEMBqEgz5CHv`).toString('base64');
    const data = {
      client_id: '4b5aa9d4-39d0-4c10-9cef-bd860737985d',
      secret_key: '8XNIaPJTOKSrz0aepLXuVjEgwxFYW67D'
    }
    const options = {
      method: 'GET',
      url: 'https://provider.id.th/api/v1/services/profile',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      },
      data: data
    };
    return new Promise((resolve, reject) => {
      axios(options).then(function (response) {
        resolve({ statusCode: response.status, body: response.data });
      }).catch(function (error) {
        // console.log(error);
        reject({ statusCode: error.response.status, error: error.response.data });
      });
    })
  } catch (error) {
    console.log(error);
    return error;
  }

}

function getUsername(token) {
  const options = {
    method: 'GET',
    url: 'https://api-mymoph.moph.go.th/member/internet',
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  return new Promise((resolve, reject) => {
    axios(options).then(function (response) {
      resolve({ statusCode: response.status, body: response.data });
    }).catch(function (error) {
      reject({ statusCode: error.response.status, error: error.response.data });
    });
  })

}
function createUsernameThaid(token, firstName, lastName, cid, address, birthdate, gender) {
  const options = {
    method: 'POST',
    url: 'https://internet-ops.moph.go.th/api/thaid',
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      firstName, lastName, cid, address, birthdate, gender
    }
  };
  return new Promise((resolve, reject) => {
    axios(options).then(function (response) {
      resolve({ statusCode: response.status, body: response.data });
    }).catch(function (error) {
      reject({ statusCode: error.response.status, error: error.response.data });
    });
  })

}
function createUsernameProviderID(token, firstName, lastName, cid, address) {
  const options = {
    method: 'POST',
    url: 'https://internet-ops.moph.go.th/api/providerid',
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      firstName, lastName, cid, address
    }
  };
  return new Promise((resolve, reject) => {
    axios(options).then(function (response) {
      resolve({ statusCode: response.status, body: response.data });
    }).catch(function (error) {
      reject({ statusCode: error.response.status, error: error.response.data });
    });
  })

}

app.post('/mymoph', async (req, res) => {
  try {
    // console.log('/mymoph');
    const { session_id, access_token, refresh_token } = req.body;
    const info = await getUsername(access_token);
    // console.log(info);
    if (info.statusCode == 200) {
      if (info.body.ok) {
        await pub.publish('socket', JSON.stringify({
          sessionId: session_id,
          username: info.body.rows.cid,
          password: info.body.rows.password_internet
        })).catch((e) => {
          console.log(e);
        });
        res.send({ ok: true });
      } else {
        res.status(500);
        res.send({ ok: false });
      }
    } else {
      res.status(info.body.statusCode);
      res.send({ ok: false });
    }
  } catch (error) {
    console.log(error);
    res.status(error.statusCode);
    // console.log(error);
    res.send({ ok: false });
  }
});

// app.get('/mymoph', async (req, res) => {
//   try {
//     const { session_id, access_token, ip, protocol } = req.query;
//     const info = await getUsername(access_token);
//     // console.log(info);
//     console.log('mymoph_session_id ' + session_id);
//     // io.emit(session_id, JSON.stringify(obj));
//     console.log(protocol);
//     const url = `${protocol || 'http'}://${ip}/fgtauth?${session_id}&username=mymoph_${info.cid}&password=${info.password_internet}`
//     console.log(url);
//     res.render('mymoph', {
//       url: url
//     })
//   } catch (error) {
//     console.log(error);
//     res.send({ ok: false });
//   }
// });



const port = process.env.PORT || 3004;

server.listen(+port, () => {
  console.log(`listening on *:${port}`);
});
