//const { Server } = require("socket.io");

var size = 15;

var boardGrid = document.getElementById("boardGrid");
for (let i = 0; i < (size-1)*(size-1); i++) {
    let cell = document.createElement("div");
    boardGrid.appendChild(cell).className = "cell";
}
boardGrid.style.margin = "" + 0.5/(size)*100 + "%";
boardGrid.style.width = boardGrid.style.height = "" + (size-1)/size*100 + "%";

var turn = 0;
var gameOver = false;

var stoneGrid = document.getElementById("stoneGrid");
function addToGrid(row, col) {
    let stone = document.createElement("img");
    if (turn % 2 == 0) {
        stone.setAttribute("src", "views/images/black.png")
    } else {
        stone.setAttribute("src", "views/images/white.png")
    }
    stone.style.gridArea = (row+1) + " / " + (col+1) + " / span 1 / span 1";
    stone.setAttribute("draggable", false);
    stone.classList.add("noselect");
    stoneGrid.appendChild(stone);
    turn++;
}

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get("gameId");
var socket = io.connect("", {query: "gameId=" + gameId});

socket.on("update", function(data) {
    console.log(data);
    while (turn < data.turn) {
        let [row, col] = data.turnStack[turn];
        addToGrid(row, col);
    }
});

socket.on("over", function() {
    gameOver = true;
    document.getElementById("resignDiv").style.visibility = "hidden";
    document.getElementById("nextGame").style.visibility = "visible";
});

socket.on("dc", function() {
    socket.disconnect();
});

function refresh() {
    console.log(window.location.host);
    window.location.replace("/");
}
socket.on("refresh", refresh);

socket.on("reload", function() {
    window.location.reload();
});


var board = document.getElementById("board");
board.onclick = function(e) {
    if (gameOver) {
        return;
    }
    let rect = board.getBoundingClientRect();
    let x = e.clientX - rect.left; //x position within the element.
    let y = e.clientY - rect.top;  //y position within the element.
    let row = Math.floor(y / rect.height * size);
    let col = Math.floor(x / rect.width * size);
    socket.emit("place", {"row": row, "col": col});
}

var resign = document.getElementById("resign");
resign.onclick = function() {
    if (!gameOver) {
        socket.emit("resign");
    }
}

var newGame = document.getElementById("newGame");
newGame.onclick = function() {
    refresh();
}

var rematch = document.getElementById("rematch");
rematch.onclick = function() {
    socket.emit("rematchServer");
}

socket.on("rematchClient", function() {
    console.log('got here');
    if (confirm("Rematch?")) {
        socket.emit("rematchAccepted");
    }
});



