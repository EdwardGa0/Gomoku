const express = require('express')
const app = express()
const http = require('http').createServer(app);
const port = 8080
const io = require('socket.io')(http);

const Game = require('./game');
const activeGames = {};

app.use(express.static(__dirname));
app.use(express.json());

app.get('/new', (req, res) => {
    let gameId = Math.random().toString(36).substring(7);
    activeGames[gameId] = new Game(15);
    res.redirect('/?gameId=' + gameId);
})

app.get('/', (req, res) => {
    let gameId = req.query.gameId;
    if (gameId in activeGames) {
        res.sendFile(__dirname + '/front.html');
    } else {
        res.send('gameId not found');
    }
})

function update(game, pos) {
    let placed;
    if (pos) {
        placed = game.place(pos.row, pos.col);
    } else {
        placed = null;
    }
    game.checkWin();
    let winner = false;
    if (game.over) {
        if (game.winner) {
            winner = "white";
        } else {
            winner = "black";
        }
    }
    io.emit('update', {
        "placed": placed,
        "turnStack": game.turnStack,
        "turn": game.turn(),
        "winner": winner
    })
}

function validGame(gameId) {
    if (!(gameId in activeGames)) {
        return false;
    }
    if (activeGames[gameId].players.length >= 2) {
        return false;
    }
    return true;
}

io.on('connection', (socket) => {
    let gameId;
    let game;
    socket.on('gameId', (tempgameId) => {
        gameId = tempgameId;
        if (!validGame(gameId)) {
            socket.disconnect();
            return;
        }
        game = activeGames[gameId];
        if (!game.players.includes(socket.id)) {
            game.addPlayer(socket.id);
        }
        update(game, null);
    });
    socket.on('place', (pos) => {
        console.log('place received');
        if (game.players.indexOf(socket.id) == game.turn() % 2) {
            update(game, pos);
        }
        if (game.over) {
            socket.disconnect();
            delete game;
            return;
        }
    });
    socket.on('resign', () => {
        game.over = true;
        game.winner = 1 - game.players.indexOf(socket.id);
        update(game, null);
    })
    socket.on('again', () => {

    });
});

http.listen(port, () => {
  console.log(`listening on port ${port}`)
})