const express = require('express')
const app = express()
const http = require('http').createServer(app);
const port = 8080
const io = require('socket.io')(http);

const Game = require('./game');

const game = new Game(15);

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

function update(pos) {
    io.emit('update', {
        "placed": (pos ? game.place(pos.row, pos.col) : false),
        "turnStack": game.turnStack,
        "turn": game.getTurn(),
        "victory": game.checkWin(),
    })
}

io.on('connection', (socket) => {
    update(null);
    socket.on('place', (pos) => {
        update(pos);
    })
});

http.listen(port, () => {
  console.log(`listening on port ${port}`)
})