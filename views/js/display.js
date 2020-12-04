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
    stone.setAttribute('draggable', false);
    stone.classList.add('noselect');
    stoneGrid.appendChild(stone);
    turn++;
}

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId');
var socket = io.connect('', {query: 'gameId=' + gameId});

var menu = document.getElementById("menu");
socket.on('update', function(data) {
    console.log(data);
    while (turn < data.turn) {
        let [row, col] = data.turnStack[turn];
        addToGrid(row, col);
    }
});

socket.on('over', function(data) {
    gameOver = true;
    let victoryStr = document.createElement("h1");
    victoryStr.innerHTML = data.winner + ' wins';
    document.body.appendChild(victoryStr);
    let playAgain = document.createElement("button");
    playAgain.id = "again";
    playAgain.innerHTML = "New Game";
    playAgain.style.float = "right";
    playAgain.onclick = function() {
        window.location.replace('/');
    }
    menu.appendChild(playAgain);
});

socket.on('dc', function() {
    socket.disconnect();
})

socket.on('refresh', function() {
    console.log('refreshing');
    console.log(window.location.host);
    window.location.replace('/');
})

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
    socket.emit('place', {'row': row, 'col': col});
}

var resign = document.getElementById("resign");
resign.onclick = function() {
    if (!gameOver) {
        socket.emit('resign');
    }
}
