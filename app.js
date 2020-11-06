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

app.get('/turnStack', (req, res) => {
    res.json(game.turnStack);
})

app.post('/place', (req, res) => {
    let row = req.body.row;
    let col = req.body.col;
    res.json({
        "placed": game.place(row, col),
        "victory": game.checkWin(),
        "turn": game.turn
    });
})

io.on('connection', (socket) => {
    console.log('a user connected');
});

http.listen(port, () => {
  console.log(`listening on port ${port}`)
})