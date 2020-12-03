const express = require('express')
const session = require('express-session');
const port = (process.env.PORT || 8080);
const app = express()

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const sessionMiddleware = session({secret: "Shh, its a secret!"});

const Game = require('./game');
const activeGames = {};
const idQueue = [];

app.use(express.static(__dirname));
app.use(express.json());
app.use(sessionMiddleware);

io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

app.get('/', (req, res) => {
    let gameId = Math.random().toString(36).substring(7);
    activeGames[gameId] = new Game(15);
    idQueue.push(gameId);
    req.session.destroy();
    res.redirect('/play?gameId=' + gameId);
})

app.get('/play', (req, res) => {
    let gameId = req.query.gameId;
    if (gameId in activeGames) {
        let game = activeGames[gameId]
        if (req.session.playerId) {     //reconnect
            if (!game.players.includes(req.session.playerId)) {
                return res.send('you are currently in another game');
            }
        } else {    //join
            if (game.players.length >= 2) {
                return res.send('game is full');
            }
            let randomId = Math.random().toString(36).substring(7);
            req.session.playerId = randomId;
        }
        res.sendFile(__dirname + '/views/play.html');
    } else {
        res.send('gameId not found');
    }
})

function daysToMillis(days) {
    return (days * 24 * 60 * 60 * 1000);
}

setInterval(() => {
    let lastWeek = new Date.getTime() - daysToMillis(7);
    let front = activeGames[idQueue[0]];
    while (front.over || front.date.getTime() < lastWeek) {
        delete activeGames[front];
        idQueue.shift();
        front = activeGames[idQueue[0]];
    }
}, daysToMillis(1));

io.on('connection', (socket) => {
    let gameId = socket.handshake.query.gameId;
    console.log(gameId);
    if (!(gameId in activeGames)) {
        console.log("game does not exist");
        return socket.leave(gameId);
    }
    socket.join(gameId);
    let game = activeGames[gameId];
    let session = socket.request.session;

    function update(pos) {
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
        io.to(gameId).emit('update', {
            "placed": placed,
            "turnStack": game.turnStack,
            "turn": game.turn(),
            "winner": winner
        })
    }

    update(null);

    function playerNum() {
        return game.players.indexOf(session.playerId);
    }

    socket.on('place', (pos) => {
        if (playerNum() == -1 && game.players.length < 2) {
            game.players.push(session.playerId);
        }
        if (game.over) {
            console.log("game over");
            return socket.leave(gameId);
        }
        if (playerNum() == game.turn() % 2) {
            update(pos);
        }
    });
    socket.on('resign', () => {
        if (playerNum() != -1) {
            game.over = true;
            game.winner = 1 - playerNum();
            update(null);
        }
    })
    socket.on('again', () => {
        
    });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`)
})