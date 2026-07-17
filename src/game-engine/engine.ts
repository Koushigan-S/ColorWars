import type { BoardState, PlayerColor } from '../types';

export class GameEngine {
  static ROWS = 5;
  static COLS = 5;

  /**
   * Initializes the 6x5 board for Chain Reaction.
   * All 30 cells start empty (color: null, count: 0).
   */
  static initializeBoard(): BoardState {
    return Array(this.ROWS * this.COLS)
      .fill(null)
      .map(() => ({ color: null, count: 0 }));
  }

  /**
   * Calculates the critical mass (maximum dots a cell can hold before exploding).
   * In JindoBlu Color Wars, the critical mass is "number of adjacent neighbors + 1".
   * This allows corners to hold 2, edges 3, and middle cells 4.
   */
  static getCriticalMass(_row: number, _col: number): number {
    return 4;
  }

  /**
   * Calculates the current score based on cells owned by each player
   */
  static calculateScores(board: BoardState): { red: number; blue: number } {
    let red = 0;
    let blue = 0;

    for (let i = 0; i < board.length; i++) {
      if (board[i].color === 'red') red++;
      if (board[i].color === 'blue') blue++;
    }

    return { red, blue };
  }

  /**
   * Checks if a player can legally place a dot at (row, col)
   */
  static isValidMove(
    board: BoardState,
    row: number,
    col: number,
    color: PlayerColor
  ): boolean {
    if (row < 0 || row >= this.ROWS || col < 0 || col >= this.COLS) {
      return false;
    }

    const idx = row * this.COLS + col;
    const cell = board[idx];

    // Check if the player already owns any cells on the board
    const hasCells = board.some((c) => c.color === color);

    if (hasCells) {
      // If they own cells, they can only place on cells they already own
      return cell.color === color;
    } else {
      // If they don't own any cells (first move), they can place on any empty cell
      return cell.color === null;
    }
  }

  /**
   * Executes a move: places 1 dot and processes any resulting explosions/chain reactions.
   * Returns the final board state and all intermediate states (steps) for animation.
   */
  static executeMove(
    board: BoardState,
    row: number,
    col: number,
    color: PlayerColor
  ): { board: BoardState; steps: BoardState[] } {
    if (!this.isValidMove(board, row, col, color)) {
      throw new Error(`Invalid move at (${row},${col}) for ${color}`);
    }

    const steps: BoardState[] = [];
    const currentBoard = board.map((cell) => ({ ...cell }));

    const getIdx = (r: number, c: number) => r * this.COLS + c;

    // Check if the player already owns any cells on the board before making this move
    const hasCells = board.some((c) => c.color === color);

    // 1. Place the initial dot (or 3 dots if it's the first move)
    const startIdx = getIdx(row, col);
    if (!hasCells) {
      currentBoard[startIdx].count = 3;
    } else {
      currentBoard[startIdx].count++;
    }
    currentBoard[startIdx].color = color;

    // Record the initial placement state
    steps.push(currentBoard.map((c) => ({ ...c })));

    // 2. Process chain reaction explosions
    let hasExplosions = true;
    let iterations = 0;
    const maxIterations = 200; // safety threshold to avoid infinite loops

    while (hasExplosions && iterations < maxIterations) {
      hasExplosions = false;
      const pendingExplosions: number[] = [];

      // Find all cells that have reached or exceeded their critical mass
      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          const idx = getIdx(r, c);
          const mass = this.getCriticalMass(r, c);
          if (currentBoard[idx].count >= mass) {
            pendingExplosions.push(idx);
          }
        }
      }

      // If there are explosions to process in this wave
      if (pendingExplosions.length > 0) {
        hasExplosions = true;
        const nextBoardState = currentBoard.map((cell) => ({ ...cell }));

        for (const idx of pendingExplosions) {
          const r = Math.floor(idx / this.COLS);
          const c = idx % this.COLS;
          const mass = this.getCriticalMass(r, c);

          // Subtract critical mass from the exploding cell
          nextBoardState[idx].count -= mass;
          if (nextBoardState[idx].count <= 0) {
            nextBoardState[idx].count = 0;
            nextBoardState[idx].color = null;
          }

          // Distribute 1 dot to each adjacent orthogonal neighbor
          const neighbors = [
            { r: r - 1, c },
            { r: r + 1, c },
            { r, c: c - 1 },
            { r, c: c + 1 },
          ];

          for (const n of neighbors) {
            if (n.r >= 0 && n.r < this.ROWS && n.c >= 0 && n.c < this.COLS) {
              const nIdx = getIdx(n.r, n.c);
              nextBoardState[nIdx].count++;
              nextBoardState[nIdx].color = color; // Converts neighbor color to active player's
            }
          }
        }

        // Update the active board state to the new wave state
        for (let i = 0; i < currentBoard.length; i++) {
          currentBoard[i] = { ...nextBoardState[i] };
        }

        // Record this step's board configuration
        steps.push(currentBoard.map((c) => ({ ...c })));
        iterations++;
      }
    }

    return { board: currentBoard, steps };
  }

  /**
   * Checks if the game is over and returns results.
   * Win detection only activates after both players have made their first move (moveCount >= 2).
   */
  static checkGameOver(
    board: BoardState,
    moveCount: number
  ): {
    isOver: boolean;
    winner: PlayerColor | 'draw' | null;
    redCount: number;
    blueCount: number;
  } {
    const { red, blue } = this.calculateScores(board);

    if (moveCount < 2) {
      return { isOver: false, winner: null, redCount: red, blueCount: blue };
    }

    if (red === 0) {
      return { isOver: true, winner: 'blue', redCount: red, blueCount: blue };
    }
    if (blue === 0) {
      return { isOver: true, winner: 'red', redCount: red, blueCount: blue };
    }

    return { isOver: false, winner: null, redCount: red, blueCount: blue };
  }
}
