const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowindex) => {
    row.forEach((square, sqaureindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowindex + sqaureindex) % 2 == 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = sqaureindex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, col: sqaureindex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", function (e) {
        e.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };

  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    K: "♔", // King
    Q: "♕", // Queen
    R: "♖", // Rook
    B: "♗", // Bishop
    N: "♘", // Knight
    P: "♙", // Pawn
    k: "♚", // King
    q: "♛", // Queen
    r: "♜", // Rook
    b: "♝", // Bishop
    n: "♞", // Knight
    p: "♙", // Pawn
  };

  return unicodePieces[piece.type] || "";
};

function showMessage(text) {
  const messageBox = document.getElementById("game-message");
  messageBox.textContent = text;
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 5000); // hide after 5 seconds
}

socket.on("playerRole", function (role) {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});

socket.on("move", function (move) {
  if (chess.load(move)) {
    renderBoard();

    // Check if the game is over
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        console.log("checkmateeee");
        showMessage("♚ Checkmate! Game over.");
      } else if (chess.isDraw()) {
        alert("Draw! Game over.");
      } else if (chess.isStalemate()) {
        alert("Stalemate! Game over.");
      } else if (chess.isThreefoldRepetition()) {
        alert("Draw by threefold repetition.");
      } else if (chess.isInsufficientMaterial()) {
        alert("Draw due to insufficient material.");
      }
    }
  } else {
    alert("Invalid move!");
  }
});

renderBoard();
