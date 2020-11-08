class Game {
    constructor(size) {
        this.size = size;
        this.turnStack = [];
        this.board = new Array(size);
        for (let i = 0; i < size; i++) {
            this.board[i] = new Array(size);
        }
    }

    place(row, col) {
        if (this.board[row][col]) {
            return false;
        }
        this.turnStack.push([row, col]);
        this.board[row][col] = this.getTurn();
        return true;
    }

    checkWin() {
        for (let t = 0; t < this.getTurn(); t++) {
            let [row, col] = this.turnStack[t];
            let cont = [0, 0, 0, 0];
            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    if (this.sameColor(row, col, row+i, col+j)) {
                        if (i == j) cont[0]++;
                        if (i == -j) cont[1]++;
                        if (i == 0) cont[2]++;
                        if (j == 0) cont[3]++;
                    }
                }
            }
            if (cont.includes(5)) {
                return (this.getTurn() % 2 == 1 ? 'black' : 'white');
            }
        }
        return false;
    }

    sameColor(row1, col1, row2, col2) {
        let temp = [row1, col1, row2, col2];
        temp.forEach(element => {
            if (element < 0 || element >= this.size) {
                return false;
            }
        });
        if (!this.board[row1][col1] || !this.board[row2][col2]) {
            return false;
        }
        return (this.board[row1][col1] % 2) == (this.board[row2][col2] % 2);
    }

    getTurn() {
        return this.turnStack.length;
    }

}

module.exports = Game;