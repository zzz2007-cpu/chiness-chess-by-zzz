// ===== 统一后的“完全合法走子判断” =====
// 规则判定走法是否允许 -> canMoveByRule（来自 base.js）
// 再模拟一步，确保走后己方王不在被将状态 -> isInCheck（来自 base.js）
function isValidMove(board, from, to) {
  // 1) 基本规则（棋理）是否允许
  if (!canMoveByRule(board, from, to)) return false;

  // 2) 模拟走子：走后不能自陷将军
  const b2 = board.map((r) => r.slice());
  const me = b2[from.y][from.x];
  b2[to.y][to.x] = me;
  b2[from.y][from.x] = NOCHESS;

  const isRedSide = isRed(me);
  return !isInCheck(b2, isRedSide);
}

let MoveGenerator = function () {
  let moveList;
  let movecount;
  this.getmoveList = function () {
    return moveList;
  };
  this.getmoveList = function (depth, count) {
    let tmp = [];
    for (let i = 0; i < count; i++) {
      tmp[i] = moveList[depth][i];
    }
    return tmp;
  };
  this.createPossibleMove = function (board, ply, side) {
    movecount = 0;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] != NOCHESS) {
          let chess = board[i][j];

          if (side == 0 && isRed(chess)) {
            continue;
          }
          if (side == 1 && isBlack(chess)) {
            continue;
          }
          switch (chess) {
            case R_KING:
            case B_KING:
              GenKingMove(board, i, j, ply);
              break;
            case R_BISHOP:
              GenRBishopMove(board, i, j, ply);
              break;
            case B_BISHOP:
              GenBBishopMove(board, i, j, ply);
              break;
            case R_ELEPHANT:
            case B_ELEPHANT:
              GenElephantmove(board, i, j, ply);
              break;
            case R_HORSE:
            case B_HORSE:
              GenHorseMove(board, i, j, ply);
              break;
            case B_CAR:
            case R_CAR:
              GenCarmove(board, i, j, ply);
              break;
            case R_PAWN:
              GenRPawnMove(board, i, j, ply);
              break;
            case B_PAWN:
              GenBPawnMove(board, i, j, ply);
              break;
            case B_CANON:
            case R_CANON:
              GenCanonMove(board, i, j, ply);
              break;
            default:
              alert("无此棋子！");
          }
        }
      }
    }
    return movecount;
  };

  let GenKingMove = function (board, i, j, ply) {
    let from = new ChessPoint(j, i);

    for (let x = 0; x < 3; x++) {
      for (let y = 3; y < 6; y++) {
        let to = new ChessPoint(y, x);
        if (isValidMove(board, from, to)) {
          addMove(from, to, ply);
        }
      }
    }

    for (let x = 7; x < 10; x++) {
      for (let y = 3; y < 6; y++) {
        let to = new ChessPoint(y, x);
        if (isValidMove(board, from, to)) {
          addMove(from, to, ply);
        }
      }
    }
    // —— 追加：允许“飞将吃王”的候选 ——
    var me = board[i][j];
    var enemyKing = me === R_KING ? B_KING : R_KING;

    // 找到对方王位置
    var ex = -1,
      ey = -1;
    for (var yy = 0; yy < 10; yy++) {
      for (var xx = 0; xx < 9; xx++) {
        if (board[yy][xx] === enemyKing) {
          ex = xx;
          ey = yy;
          break;
        }
      }
      if (ex !== -1) break;
    }

    // 同列且中间无子 -> 尝试把对方王那格加入候选
    if (ex === j) {
      var clear = true;
      for (var yk = Math.min(i, ey) + 1; yk < Math.max(i, ey); yk++) {
        if (board[yk][j] !== NOCHESS) {
          clear = false;
          break;
        }
      }
      if (clear) {
        var to = new ChessPoint(ex, ey);
        if (isValidMove(board, from, to)) {
          addMove(from, to, ply);
        }
      }
    }
  };
  let GenRBishopMove = function (board, i, j, ply) {
    let from = new ChessPoint(j, i);
    for (let x = 7; x < 10; x++) {
      for (let y = 3; y < 6; y++) {
        let to = new ChessPoint(x, y);
        if (isValidMove(board, from, to)) {
          addMove(from, to, ply);
        }
      }
    }
  };

  let GenBBishopMove = function (board, i, j, ply) {
    let from = new ChessPoint(j, i);
    for (let x = 0; x < 3; x++) {
      for (let y = 3; y < 6; y++) {
        let to = new ChessPoint(x, y);
        if (isValidMove(board, from, to)) {
          addMove(from, to, ply);
        }
      }
    }
  };

  let GenElephantmove = function (board, i, j, ply) {
    let x;
    let y;
    let from;
    let to;

    from = new ChessPoint(j, i);

    x = j + 2;
    y = i + 2;
    to = new ChessPoint(x, y);
    if (x < 9 && y < 10 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j + 2;
    y = i - 2;
    to = new ChessPoint(x, y);
    if (x < 9 && y >= 0 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j - 2;
    y = i + 2;
    to = new ChessPoint(x, y);
    if (x >= 0 && y < 10 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j - 2;
    y = i - 2;
    to = new ChessPoint(x, y);
    if (x >= 0 && y >= 0 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
  };

  let GenHorseMove = function (board, i, j, ply) {
    let x;
    let y;
    let from;
    let to;
    from = new ChessPoint(j, i);

    x = j + 2;
    y = i + 1;
    to = new ChessPoint(x, y);
    if (x < 9 && y < 10 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j - 2;
    y = i + 1;
    to = new ChessPoint(x, y);
    if (x >= 0 && y < 10 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j + 2;
    y = i - 1;
    to = new ChessPoint(x, y);
    if (x < 9 && y >= 0 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j - 2;
    y = i - 1;
    to = new ChessPoint(x, y);
    if (x >= 0 && y >= 0 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j + 1;
    y = i + 2;
    to = new ChessPoint(x, y);
    if (x < 9 && y < 10 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j - 1;
    y = i + 2;
    to = new ChessPoint(x, y);
    if (x >= 0 && y < 10 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j + 1;
    y = i - 2;
    to = new ChessPoint(x, y);
    if (x < 9 && y >= 0 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
    x = j - 1;
    y = i - 2;
    to = new ChessPoint(x, y);
    if (x >= 0 && y >= 0 && isValidMove(board, from, to)) {
      addMove(from, to, ply);
    }
  };

  // 车
  let GenCarmove = function (board, i, j, ply) {
    let from = new ChessPoint(j, i);

    // → 右
    for (let x = j + 1, y = i; x < 9; x++) {
      let to = new ChessPoint(x, y);
      if (board[y][x] == NOCHESS) {
        if (isValidMove(board, from, to)) addMove(from, to, ply);
      } else {
        if (
          !isSameSide(board[i][j], board[y][x]) &&
          isValidMove(board, from, to)
        ) {
          addMove(from, to, ply);
        }
        break;
      }
    }

    // ← 左
    for (let x = j - 1, y = i; x >= 0; x--) {
      let to = new ChessPoint(x, y);
      if (board[y][x] == NOCHESS) {
        if (isValidMove(board, from, to)) addMove(from, to, ply);
      } else {
        if (
          !isSameSide(board[i][j], board[y][x]) &&
          isValidMove(board, from, to)
        ) {
          addMove(from, to, ply);
        }
        break;
      }
    }

    // ↓ 下
    for (let y = i + 1, x = j; y < 10; y++) {
      let to = new ChessPoint(x, y);
      if (board[y][x] == NOCHESS) {
        if (isValidMove(board, from, to)) addMove(from, to, ply);
      } else {
        if (
          !isSameSide(board[i][j], board[y][x]) &&
          isValidMove(board, from, to)
        ) {
          addMove(from, to, ply);
        }
        break;
      }
    }

    // ↑ 上
    for (let y = i - 1, x = j; y >= 0; y--) {
      let to = new ChessPoint(x, y);
      if (board[y][x] == NOCHESS) {
        if (isValidMove(board, from, to)) addMove(from, to, ply);
      } else {
        if (
          !isSameSide(board[i][j], board[y][x]) &&
          isValidMove(board, from, to)
        ) {
          addMove(from, to, ply);
        }
        break;
      }
    }
  };

  // 炮
  let GenCanonMove = function (board, i, j, ply) {
    let from = new ChessPoint(j, i);
    let chess = board[i][j];

    // → 右
    {
      let x = j + 1,
        y = i,
        flag = false;
      while (x < 9) {
        let to = new ChessPoint(x, y);
        if (board[y][x] == NOCHESS) {
          if (!flag && isValidMove(board, from, to)) addMove(from, to, ply);
        } else {
          if (!flag) {
            flag = true;
          } else {
            if (!isSameSide(chess, board[y][x]) && isValidMove(board, from, to))
              addMove(from, to, ply);
            break;
          }
        }
        x++;
      }
    }
    // ← 左
    {
      let x = j - 1,
        y = i,
        flag = false;
      while (x >= 0) {
        let to = new ChessPoint(x, y);
        if (board[y][x] == NOCHESS) {
          if (!flag && isValidMove(board, from, to)) addMove(from, to, ply);
        } else {
          if (!flag) {
            flag = true;
          } else {
            if (!isSameSide(chess, board[y][x]) && isValidMove(board, from, to))
              addMove(from, to, ply);
            break;
          }
        }
        x--;
      }
    }
    // ↓ 下
    {
      let x = j,
        y = i + 1,
        flag = false;
      while (y < 10) {
        let to = new ChessPoint(x, y);
        if (board[y][x] == NOCHESS) {
          if (!flag && isValidMove(board, from, to)) addMove(from, to, ply);
        } else {
          if (!flag) {
            flag = true;
          } else {
            if (!isSameSide(chess, board[y][x]) && isValidMove(board, from, to))
              addMove(from, to, ply);
            break;
          }
        }
        y++;
      }
    }
    // ↑ 上
    {
      let x = j,
        y = i - 1,
        flag = false;
      while (y >= 0) {
        let to = new ChessPoint(x, y);
        if (board[y][x] == NOCHESS) {
          if (!flag && isValidMove(board, from, to)) addMove(from, to, ply);
        } else {
          if (!flag) {
            flag = true;
          } else {
            if (!isSameSide(chess, board[y][x]) && isValidMove(board, from, to))
              addMove(from, to, ply);
            break;
          }
        }
        y--;
      }
    }
  };

  // 黑兵
  let GenBPawnMove = function (board, i, j, ply) {
    let from = new ChessPoint(j, i);

    // 向前
    {
      let to = new ChessPoint(j, i + 1);
      if (to.y < 10 && isValidMove(board, from, to)) addMove(from, to, ply);
    }
    // 过河后左右
    if (i > 4) {
      let to1 = new ChessPoint(j + 1, i);
      if (to1.x < 9 && isValidMove(board, from, to1)) addMove(from, to1, ply);
      let to2 = new ChessPoint(j - 1, i);
      if (to2.x >= 0 && isValidMove(board, from, to2)) addMove(from, to2, ply);
    }
  };

  // 红兵
  let GenRPawnMove = function (board, i, j, ply) {
    let from = new ChessPoint(j, i);

    // 向前
    {
      let to = new ChessPoint(j, i - 1);
      if (to.y >= 0 && isValidMove(board, from, to)) addMove(from, to, ply);
    }
    // 过河后左右
    if (i < 5) {
      let to1 = new ChessPoint(j + 1, i);
      if (to1.x < 9 && isValidMove(board, from, to1)) addMove(from, to1, ply);
      let to2 = new ChessPoint(j - 1, i);
      if (to2.x >= 0 && isValidMove(board, from, to2)) addMove(from, to2, ply);
    }
  };

  let addMove = function (from, to, ply) {
    let move = moveList[ply][movecount];
    move.from = from;
    move.to = to;
    return ++movecount;
  };

  let initialize = function () {
    moveList = [];
    movecount = 0;

    for (let i = 0; i < 8; i++) {
      moveList.push([]);
      for (let j = 0; j < 80; j++) {
        moveList[i][j] = new ChessMove();
      }
    }
  };

  initialize();
};
