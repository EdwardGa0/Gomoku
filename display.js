var size = 15;
var board = document.getElementById("board");
var boardGrid = document.getElementById("boardGrid");
var stoneGrid = document.getElementById("stoneGrid");

for (let i = 0; i < (size-1)*(size-1); i++) {
    let cell = document.createElement("div");
    boardGrid.appendChild(cell).className = "cell";
}
boardGrid.style.margin = "" + 0.5/(size)*100 + "%";
boardGrid.style.width = boardGrid.style.height = "" + (size-1)/size*100 + "%";

stonePos = new Array(size);
for (let i = 0; i < size; i++) {
    stonePos[i] = new Array(size);
}
var turn = 0;
var gameOver = false;

function addToGrid(row, col) {
    stonePos[row][col] = document.createElement("img");
    if (turn % 2 == 0) {
        stonePos[row][col].setAttribute("src", "images/black.png")
    } else {
        stonePos[row][col].setAttribute("src", "images/white.png")
    }
    stonePos[row][col].style.gridArea = (row+1) + " / " + (col+1) + " / span 1 / span 1";
    stoneGrid.appendChild(stonePos[row][col]);
    turn++;
}

var socket = io();
socket.on('update', function(data) {
    console.log(data);
    while (turn < data.turn) {
        let [row, col] = data.turnStack[turn];
        addToGrid(row, col);
    }
    if (data.victory) {
        gameOver = true;
        var victoryStr = document.createElement("h1");
        victoryStr.innerHTML = data.victory + " Wins";
        document.body.appendChild(victoryStr);
    }
});

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
