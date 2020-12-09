const express = require("express")
const session = require("express-session");
const port = (process.env.PORT || 8080);
const app = express()

const server = require("http").createServer(app);
const io = require("socket.io")(server);

const sessionMiddleware = session({secret: "Shh, its a secret!"});

const Game = require("./game");
const activeGames = {};
const idQueue = [];

app.use(express.static(__dirname));
app.use(express.json());
app.use(sessionMiddleware);

io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
})

app.get("/new", (req, res) => {
    let gameId = Math.random().toString(36).substring(7);
    activeGames[gameId] = new Game(15);
    idQueue.push(gameId);
    res.redirect("/play?gameId=" + gameId);
})

app.get("/play", (req, res) => {
    let gameId = req.query.gameId;
    if (gameId in activeGames) {
        let game = activeGames[gameId]
        if (!req.session.playerId) {
            let randomId = Math.random().toString(36).substring(7);
            req.session.playerId = randomId;
        }
        if (game.players.length >= 2 && !game.players.includes(req.session.playerId)) {
            return res.send("game is full");
        }
        res.sendFile(__dirname + "/views/play.html");
    } else {
        res.send("gameId not found");
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

io.on("connection", (socket) => {
    let gameId = socket.handshake.query.gameId;
    console.log(gameId);
    if (!(gameId in activeGames)) {
        console.log("game does not exist");
        return io.to(socket.id).emit("refresh");
    }
    socket.join(gameId);
    let game = activeGames[gameId];
    let session = socket.request.session;

    function updateEmit(pos) {
        let placed;
        if (pos) {
            placed = game.place(pos.row, pos.col);
        } else {
            placed = null;
        }
        io.to(gameId).emit("update", {
            "placed": placed,
            "turnStack": game.turnStack,
            "turn": game.turn(),
        })
    }

    updateEmit(null);

    function playerNum() {
        return game.players.indexOf(session.playerId);
    }

    socket.on("place", (pos) => {
        if (playerNum() == -1 && game.players.length < 2) {
            game.players.push(session.playerId);
            game.sockets.push(socket);
        }
        if (playerNum() == game.turn() % 2) {
            updateEmit(pos);
        }
        game.checkWin();
        if (game.over) {
            io.to(gameId).emit("over");
        }
    });
    socket.on("resign", () => {
        if (playerNum() != -1) {
            game.over = true;
            game.winner = 1 - playerNum();
            io.to(gameId).emit("over");
        }
    })
    socket.on("rematchServer", () => {
        console.log("rematchServer");
        //sending rematch request to other socket in room
        socket.to(gameId).emit("rematchClient");
    });

    socket.on("rematchAccepted", () => {
        activeGames[gameId] = new Game(15);
        io.to(gameId).emit("reload");
    })
});

server.listen(port, () => {
  console.log(`listening on port ${port}`)
})