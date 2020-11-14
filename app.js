const express = require('express')
const app = express()
const http = require('http').createServer(app);
const port = 8080
const io = require('socket.io')(http);

const Game = require('./game');
const activeGames = {};

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
    let id = Math.random().toString(36).substring(7);
    activeGames[id] = new Game(15);
    res.redirect('/game?id=' + id);
})

app.get('/game', (req, res) => {
    let id = req.query.id;
    if (id in activeGames) {
        res.sendFile(__dirname + '/front.html');
    } else {
        res.send('id not found');
    }
})

function update(id, pos) {
    if (!(id in activeGames)) {
        console.log("id:", id, "does not exist");
        return false;
    }
    io.emit('update', {
        "placed": (pos ? activeGames[id].place(pos.row, pos.col) : false),
        "turnStack": activeGames[id].turnStack,
        "turn": activeGames[id].getTurn(),
        "victory": gameOver = activeGames[id].checkWin()
    })
    return !gameOver;
}

io.on('connection', (socket) => {
    let id;
    socket.on('id', (tempid) => {
        id = tempid;
        if (!update(id, null)) {
            socket.disconnect();
        }
    });
    socket.on('place', (pos) => {
        console.log('place received');
        if (!update(id, pos)) {
            socket.disconnect();
            delete activeGames[id];
        }
    });
});

http.listen(port, () => {
  console.log(`listening on port ${port}`)
})