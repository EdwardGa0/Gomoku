var size = 15;
var board = document.getElementById("board");
var boardGrid = document.getElementById("boardGrid");
var stoneGrid = document.getElementById("stoneGrid");
var gameOver = false;


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

fetch("http://localhost:8080/turnStack")
.then(function(response) {
    return response.json();
})
.then(function(data) {
    while (data.length > 0) {
        let turn = data.length;
        let [row, col] = data.pop();
        addToGrid(row, col, turn);
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



    fetch("http://localhost:8080/place", {
        method: 'POST',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({row: row, col: col})
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (data.placed) {
            addToGrid(row, col, data.turn);
        }
        gameOver = data.victory;
        if (data.victory) {
            var victoryStr = document.createElement("h1");
            if (data.turn % 2 == 0) {
                victoryStr.innerHTML = "Black Wins";
            } else {
                victoryStr.innerHTML = "White Wins";
            }
            document.body.appendChild(victoryStr);
        }
    })
}

function addToGrid(row, col, turn) {
    stonePos[row][col] = document.createElement("img");
    if (turn % 2 == 0) {
        stonePos[row][col].setAttribute("src", "images/black.png")
    } else {
        stonePos[row][col].setAttribute("src", "images/white.png")
    }
    stonePos[row][col].style.gridArea = (row+1) + " / " + (col+1) + " / span 1 / span 1";
    stoneGrid.appendChild(stonePos[row][col]);
}
