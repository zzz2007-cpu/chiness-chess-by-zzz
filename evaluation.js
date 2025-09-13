let Evaluation = function () {
  //基本分
  let basevalue_pawn = 100;
  let basevalue_bishop = 250;
  let basevalue_elephant = 250;
  let basevalue_car = 500;
  let basevalue_horse = 350;
  let basevalue_canon = 350;
  let basevalue_king = 10000;

  //灵活度
  let flexibility_pawn = 15;
  let flexibility_bishop = 1;
  let flexibility_elephant = 1;
  let flexibility_car = 6;
  let flexibility_horse = 12;
  let flexibility_canon = 6;
  let flexibility_king = 0;

  //基本价值分
  let basevalue;

  //灵活度分
  let flexvalue;

  //被威胁信息
  let attackpos;

  //受保护信息
  let guardpos;

  //灵活性
  let flexibilitypos;

  //总价值
  let chessvalue;

  //相关位置个数
  let poscount;

  //相关位置
  let relatepos;

  //红兵的附加值
  let R_PAWN_VALUE = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [90, 90, 110, 120, 120, 120, 110, 90, 90],
    [90, 90, 110, 120, 120, 120, 110, 90, 90],
    [70, 90, 110, 110, 110, 110, 110, 90, 70],
    [70, 70, 70, 70, 70, 70, 70, 70, 70],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  //黑兵附加值
  let B_PAWN_VALUE = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [90, 90, 110, 120, 120, 120, 110, 90, 90],
    [90, 90, 110, 120, 120, 120, 110, 90, 90],
    [70, 90, 110, 110, 110, 110, 110, 90, 70],
    [70, 70, 70, 70, 70, 70, 70, 70, 70],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  let getpawnvalue = function (x, y, board) {
    if (board[y][x] == R_PAWN) {
      return R_PAWN_VALUE[y][x];
    }
    if (board[y][x] == B_PAWN) {
      return B_PAWN_VALUE[y][x];
    }

    return 0;
  };

  let resetdata = function () {
    attackpos = [];
    guardpos = [];
    flexibilitypos = [];
    chessvalue = [];

    for (let i = 0; i < 10; i++) {
      attackpos.push([]);
      guardpos.push([]);
      flexibilitypos.push([]);
      chessvalue.push([]);

      for (let j = 0; j < 9; j++) {
        attackpos[i][j] = 0;
        guardpos[i][j] = 0;
        flexibilitypos[i][j] = 0;
        chessvalue[i][j] = 0;
      }
    }
  };

  let initialize = function () {
    basevalue = [];
    flexvalue = [];
    relatepos = [];

    basevalue[B_KING] = basevalue_king;
    basevalue[B_CAR] = basevalue_car;
    basevalue[B_HORSE] = basevalue_horse;
    basevalue[B_BISHOP] = basevalue_bishop;
    basevalue[B_ELEPHANT] = basevalue_elephant;
    basevalue[B_CANON] = basevalue_canon;
    basevalue[B_PAWN] = basevalue_pawn;

    basevalue[R_KING] = basevalue_king;
    basevalue[R_CAR] = basevalue_car;
    basevalue[R_HORSE] = basevalue_horse;
    basevalue[R_BISHOP] = basevalue_bishop;
    basevalue[R_ELEPHANT] = basevalue_elephant;
    basevalue[R_CANON] = basevalue_canon;
    basevalue[R_PAWN] = basevalue_pawn;

    flexvalue[R_KING] = flexibility_king;
    flexvalue[R_CAR] = flexibility_car;
    flexvalue[R_HORSE] = flexibility_horse;
    flexvalue[R_BISHOP] = flexibility_bishop;
    flexvalue[R_ELEPHANT] = flexibility_elephant;
    flexvalue[R_CANON] = flexibility_canon;
    flexvalue[R_PAWN] = flexibility_pawn;

    flexvalue[B_KING] = flexibility_king;
    flexvalue[B_CAR] = flexibility_car;
    flexvalue[B_HORSE] = flexibility_horse;
    flexvalue[B_BISHOP] = flexibility_bishop;
    flexvalue[B_ELEPHANT] = flexibility_elephant;
    flexvalue[B_CANON] = flexibility_canon;
    flexvalue[B_PAWN] = flexibility_pawn;
  };
  //这个棋子能到达的所有格子
  let addPoint = function (point) {
    relatepos[poscount] = point;
    poscount++;
  };

  // 评估阶段只需要“按规则是否能到达” → 统一委托给 base.js
  function canTouch(board, from, to) {
    // 注意：评估不做“走后是否自将军”的检查，那是搜索/生成层的事
    return canMoveByRule(board, from, to);
  }

  let GenKingMove = function (board, i, j) {
    let from = new ChessPoint(j, i);

    for (let x = 0; x < 3; x++) {
      for (let y = 3; y < 6; y++) {
        let to = new ChessPoint(y, x);
        if (canTouch(board, from, to)) {
          addPoint(to);
        }
      }
    }

    for (let x = 7; x < 10; x++) {
      for (let y = 3; y < 6; y++) {
        let to = new ChessPoint(y, x);
        if (canTouch(board, from, to)) {
          addPoint(to);
        }
      }
    }
  };
  let GenRBishopMove = function (board, i, j) {
    let from = new ChessPoint(j, i);
    for (let x = 7; x < 10; x++) {
      for (let y = 3; y < 6; y++) {
        let to = new ChessPoint(x, y);
        if (canTouch(board, from, to)) {
          addPoint(to);
        }
      }
    }
  };

  let GenBBishopMove = function (board, i, j) {
    let from = new ChessPoint(j, i);
    for (let x = 0; x < 3; x++) {
      for (let y = 3; y < 6; y++) {
        let to = new ChessPoint(x, y);
        if (canTouch(board, from, to)) {
          addPoint(to);
        }
      }
    }
  };

  let GenElephantmove = function (board, i, j) {
    let x;
    let y;
    let from;
    let to;

    from = new ChessPoint(j, i);

    x = j + 2;
    y = i + 2;
    to = new ChessPoint(x, y);
    if (x < 9 && y < 10 && canTouch(board, from, to)) {
      addPoint(to);
    }

    x = j + 2;
    y = i - 2;
    to = new ChessPoint(x, y);
    if (x < 9 && y >= 0 && canTouch(board, from, to)) {
      addPoint(to);
    }

    x = j - 2;
    y = i + 2;
    to = new ChessPoint(x, y);
    if (x >= 0 && y < 10 && canTouch(board, from, to)) {
      addPoint(to);
    }

    x = j - 2;
    y = i - 2;
    to = new ChessPoint(x, y);
    if (x >= 0 && y >= 0 && canTouch(board, from, to)) {
      addPoint(to);
    }
  };
  let GenHorseMove = function (board, i, j) {
    let x;
    let y;
    let from;
    let to;
    from = new ChessPoint(j, i);

    x = j + 2;
    y = i + 1;
    to = new ChessPoint(x, y);
    if (x < 9 && y < 10 && canTouch(board, from, to)) {
      addPoint(to);
    }
    x = j - 2;
    y = i + 1;
    to = new ChessPoint(x, y);
    if (x >= 0 && y < 10 && canTouch(board, from, to)) {
      addPoint(to);
    }
    x = j + 2;
    y = i - 1;
    to = new ChessPoint(x, y);
    if (x < 9 && y >= 0 && canTouch(board, from, to)) {
      addPoint(to);
    }
    x = j - 2;
    y = i - 1;
    to = new ChessPoint(x, y);
    if (x >= 0 && y >= 0 && canTouch(board, from, to)) {
      addPoint(to);
    }
    x = j + 1;
    y = i + 2;
    to = new ChessPoint(x, y);
    if (x < 9 && y < 10 && canTouch(board, from, to)) {
      addPoint(to);
    }
    x = j - 1;
    y = i + 2;
    to = new ChessPoint(x, y);
    if (x >= 0 && y < 10 && canTouch(board, from, to)) {
      addPoint(to);
    }
    x = j + 1;
    y = i - 2;
    to = new ChessPoint(x, y);
    if (x < 9 && y >= 0 && canTouch(board, from, to)) {
      addPoint(to);
    }
    x = j - 1;
    y = i - 2;
    to = new ChessPoint(x, y);
    if (x >= 0 && y >= 0 && canTouch(board, from, to)) {
      addPoint(to);
    }
  };

  let GenBPawnMove = function (board, i, j) {
    let x;
    let y;
    let to;
    let from = new ChessPoint(j, i);
    let chess = board[i][j]; // 保留你原来的变量，虽然下面用不到

    // 向前（黑兵从上往下）
    x = j;
    y = i + 1;
    to = new ChessPoint(x, y);
    if (y < 10 && canTouch(board, from, to)) {
      addPoint(to);
    }

    // 过河后左右
    if (i > 4) {
      y = i;

      x = j + 1;
      to = new ChessPoint(x, y);
      if (x < 9 && canTouch(board, from, to)) {
        addPoint(to);
      }

      x = j - 1;
      to = new ChessPoint(x, y);
      if (x >= 0 && canTouch(board, from, to)) {
        addPoint(to);
      }
    }
  };

  let GenRPawnMove = function (board, i, j) {
    let x;
    let y;
    let to;
    let chess = board[i][j]; // 同上，保留
    let from = new ChessPoint(j, i);

    // 向前（红兵从下往上）
    x = j;
    y = i - 1;
    to = new ChessPoint(x, y);
    if (y >= 0 && canTouch(board, from, to)) {
      addPoint(to);
    }

    // 过河后左右
    if (i < 5) {
      y = i;

      x = j + 1;
      to = new ChessPoint(x, y);
      if (x < 9 && canTouch(board, from, to)) {
        addPoint(to);
      }

      x = j - 1;
      to = new ChessPoint(x, y);
      if (x >= 0 && canTouch(board, from, to)) {
        addPoint(to);
      }
    }
  };

  let GenCarmove = function (board, i, j) {
    let x;
    let y;
    let chess = board[i][j];

    y = i;
    x = j + 1;
    while (x < 9) {
      if (board[y][x] == NOCHESS) {
        addPoint(new ChessPoint(x, y));
      } else {
        addPoint(new ChessPoint(x, y));
        break;
      }
      x++;
    }

    y = i;
    x = j - 1;
    while (x >= 0) {
      if (board[y][x] == NOCHESS) {
        addPoint(new ChessPoint(x, y));
      } else {
        addPoint(new ChessPoint(x, y));
        break;
      }
      x--;
    }

    y = i + 1;
    x = j;
    while (y < 10) {
      if (board[y][x] == NOCHESS) {
        addPoint(new ChessPoint(x, y));
      } else {
        addPoint(new ChessPoint(x, y));
        break;
      }
      y++;
    }

    y = i - 1;
    x = j;
    while (y >= 0) {
      if (board[y][x] == NOCHESS) {
        addPoint(new ChessPoint(x, y));
      } else {
        addPoint(new ChessPoint(x, y));
        break;
      }
      y--;
    }
  };

  let GenCanonMove = function (board, i, j) {
    let x;
    let y;
    let flag;
    let chess = board[i][j];

    x = j + 1;
    y = i;
    flag = false;
    while (x < 9) {
      if (board[y][x] == NOCHESS) {
        if (!flag) {
          addPoint(new ChessPoint(x, y));
        }
      } else {
        if (!flag) {
          flag = true;
        } else {
          addPoint(new ChessPoint(x, y));

          break;
        }
      }
      x++;
    }

    x = j - 1;
    y = i;
    flag = false;
    while (x >= 0) {
      if (board[y][x] == NOCHESS) {
        if (!flag) {
          addPoint(new ChessPoint(x, y));
        }
      } else {
        if (!flag) {
          flag = true;
        } else {
          addPoint(new ChessPoint(x, y));

          break;
        }
      }
      x--;
    }

    x = j;
    y = i + 1;
    flag = false;
    while (y < 10) {
      if (board[y][x] == NOCHESS) {
        if (!flag) {
          addPoint(new ChessPoint(x, y));
        }
      } else {
        if (!flag) {
          flag = true;
        } else {
          addPoint(new ChessPoint(x, y));

          break;
        }
      }
      y++;
    }

    x = j;
    y = i - 1;
    flag = false;
    while (y >= 0) {
      if (board[y][x] == NOCHESS) {
        if (!flag) {
          addPoint(new ChessPoint(x, y));
        }
      } else {
        if (!flag) {
          flag = true;
        } else {
          addPoint(new ChessPoint(x, y));

          break;
        }
      }
      y--;
    }
  };
  let getRelatechess = function (board, i, j) {
    poscount = 0;
    let chess;
    let x;
    let y;
    chess = board[i][j];
    switch (chess) {
      case R_KING:
      case B_KING:
        GenKingMove(board, i, j);
        break;
      case R_BISHOP:
        GenRBishopMove(board, i, j);
        break;
      case B_BISHOP:
        GenBBishopMove(board, i, j);
        break;
      case R_ELEPHANT:
      case B_ELEPHANT:
        GenElephantmove(board, i, j);
        break;
      case R_HORSE:
      case B_HORSE:
        GenHorseMove(board, i, j);
        break;
      case B_CAR:
      case R_CAR:
        GenCarmove(board, i, j);
        break;
      case R_PAWN:
        GenRPawnMove(board, i, j);
        break;
      case B_PAWN:
        GenBPawnMove(board, i, j);
        break;
      case B_CANON:
      case R_CANON:
        GenCanonMove(board, i, j);
        break;
      default:
        alert("不存在的！");
    }
  };
  this.eval = function (board, side) {
    test++;
    let chess;
    let target;
    resetdata();

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] != NOCHESS) {
          chess = board[i][j];
          getRelatechess(board, i, j);
          for (let k = 0; k < poscount; k++) {
            target = board[relatepos[k].y][relatepos[k].x];
            if (target == NOCHESS) {
              flexibilitypos[i][j]++;
            } else {
              if (isSameSide(chess, target)) {
                guardpos[relatepos[k].y][relatepos[k].x]++;
              } else {
                attackpos[relatepos[k].y][relatepos[k].x]++;
                flexibilitypos[i][j]++;
                switch (target) {
                  case R_KING:
                    if (side == 0) {
                      return 188888;
                    }
                    break;
                  case B_KING:
                    if (side == 1) {
                      return -188888;
                    }
                    break;
                  default:
                    attackpos[relatepos[k].y][relatepos[k].x] +=
                      30 + (basevalue[target] - basevalue[chess]) / 10;
                }
              }
            }
          }
        }
      }
    }

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] != NOCHESS) {
          chess = board[i][j];
          chessvalue[i][j]++;
          chessvalue[i][j] += flexvalue[chess] * flexibilitypos[i][j];
          chessvalue[i][j] += getpawnvalue(j, i, board);
        }
      }
    }
    let halfvalue;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] != NOCHESS) {
          chess = board[i][j];
          halfvalue = basevalue[chess] / 16;
          chessvalue[i][j] += basevalue[chess];
          if (isRed(chess)) {
            if (attackpos[i][j]) {
              if (side == 1) {
                if (chess == R_KING) {
                  chessvalue[i][j] -= 20;
                } else {
                  chessvalue[i][j] -= halfvalue * 2;
                  if (guardpos[i][j]) {
                    chessvalue[i][j] += halfvalue;
                  }
                }
              } else {
                if (chess == R_KING) {
                  return 188888;
                }

                chessvalue[i][j] -= halfvalue * 10;

                if (guardpos[i][j]) {
                  chessvalue[i][j] += halfvalue * 9;
                }
              }
              chessvalue[i][j] -= attackpos[i][j];
            } else {
              if (guardpos[i][j]) {
                chessvalue[i][j] += 5;
              }
            }
          } else {
            if (attackpos[i][j]) {
              if (side == 0) {
                if (chess == B_KING) {
                  chessvalue[i][j] -= 20;
                } else {
                  chessvalue[i][j] -= halfvalue * 2;
                  if (guardpos[i][j]) {
                    chessvalue[i][j] += halfvalue;
                  }
                }
              } else {
                if (chess == B_KING) {
                  return 188888;
                }

                chessvalue[i][j] -= halfvalue * 10;

                if (guardpos[i][j]) {
                  chessvalue[i][j] += halfvalue * 9;
                }
              }
              chessvalue[i][j] -= attackpos[i][j];
            } else {
              if (guardpos[i][j]) {
                chessvalue[i][j] += 5;
              }
            }
          }
        }
      }
    }

    let redvalue = 0;
    let blackvalue = 0;

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 9; j++) {
        chess = board[i][j];
        if (isRed(chess)) {
          redvalue += chessvalue[i][j];
        } else {
          blackvalue += chessvalue[i][j];
        }
      }
    }
    return blackvalue - redvalue;
  };
  initialize();
};
let test = 0;
