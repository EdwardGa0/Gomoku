class Piece {
    constructor(row, col, turn) {
        this.row = row;
        this.col = col;
        this.turn = turn;
    }

    getColor() {
        if (this.turn % 2 == 1) {
            return "black";
        }
        return "white";
    }
}