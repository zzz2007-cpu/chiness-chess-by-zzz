let Searchengine = function (depth) {
  // 【新增】根方：0 = 黑走，1 = 红走（由 UI 传入）
  let rootSide = 0;

  let HistoryTable = function () {
    let historyTable;

    let initialize = function () {
      historyTable = [];
      for (let i = 0; i < 90; i++) {
        historyTable.push([]);
        for (let j = 0; j < 90; j++) {
          historyTable[i][j] = 0;
        }
      }
    };

    this.enterhistorytable = function (move, depth) {
      let from = move.from.y * 9 + move.from.x;
      let to = move.to.y * 9 + move.to.x;
      historyTable[from][to] += 2 << depth;
    };

    this.gethistoryscore = function (move) {
      let from = move.from.y * 9 + move.from.x;
      let to = move.to.y * 9 + move.to.x;
      return historyTable[from][to];
    };

    initialize();
  };

  // —— 棋子价值（跟 evaluation.js 保持一致）——
  const PV = {
    [B_PAWN]: 100,
    [R_PAWN]: 100,
    [B_BISHOP]: 250,
    [R_BISHOP]: 250,
    [B_ELEPHANT]: 250,
    [R_ELEPHANT]: 250,
    [B_CAR]: 500,
    [R_CAR]: 500,
    [B_HORSE]: 350,
    [R_HORSE]: 350,
    [B_CANON]: 350,
    [R_CANON]: 350,
    [B_KING]: 10000,
    [R_KING]: 10000,
    [NOCHESS]: 0,
  };
  const pieceValue = (c) => PV[c] || 0;

  // —— 杀手着（每层保留 2 个非吃子剪枝步）——
  const killerMoves = Array.from({ length: 32 }, () => []);
  const eqMove = (a, b) =>
    a &&
    b &&
    a.from.x === b.from.x &&
    a.from.y === b.from.y &&
    a.to.x === b.to.x &&
    a.to.y === b.to.y;

  function pushKiller(depth, mv) {
    const arr = killerMoves[depth];
    if (arr.length && eqMove(arr[0], mv)) return;
    if (arr.length >= 2) arr.pop();
    arr.unshift({
      from: new ChessPoint(mv.from.x, mv.from.y),
      to: new ChessPoint(mv.to.x, mv.to.y),
    });
  }

  let movecreate = new MoveGenerator();
  let evalution = new Evaluation();
  let historyTable = new HistoryTable();
  let maxDepth = depth;
  let bestmove;
  let curboard;
  let self = this;

  let makemove = function (move) {
    let target = curboard[move.to.y][move.to.x];
    curboard[move.to.y][move.to.x] = curboard[move.from.y][move.from.x];
    curboard[move.from.y][move.from.x] = NOCHESS;
    return target;
  };

  let unmakemove = function (move, chess) {
    curboard[move.from.y][move.from.x] = curboard[move.to.y][move.to.x];
    curboard[move.to.y][move.to.x] = chess;
  };

  // —— 接受当前轮到哪一方走子 ——
  // side: 0 = 黑方走，1 = 红方走
  this.getgoodmove = function (board, side) {
    test = 0;
    curboard = board;
    bestmove = null;

    // 【关键】保存根方
    rootSide = side === 1 ? 1 : 0;

    const savedMax = maxDepth;
    let alpha = -20000,
      beta = 20000,
      val = 0;

    for (let d = 1; d <= savedMax; d++) {
      maxDepth = d;

      // 小吸窗
      const margin = 100;
      let a = Math.max(alpha, val - margin);
      let b = Math.min(beta, val + margin);

      val = alphabeta(a, b, d);

      if (val <= a || val >= b) {
        a = alpha;
        b = beta;
        val = alphabeta(a, b, d);
      }
    }

    maxDepth = savedMax;

    makemove(bestmove);
    return { board: curboard, bestmove: bestmove };
  };

  this.isgameover = function (board) {
    let redlive = false;
    let blacklive = false;

    for (let i = 0; i < 3; i++) {
      for (let j = 3; j < 6; j++) {
        if (board[i][j] == B_KING) blacklive = true;
      }
    }
    for (let i = 7; i < 10; i++) {
      for (let j = 3; j < 6; j++) {
        if (board[i][j] == R_KING) redlive = true;
      }
    }

    if (!redlive) return 199999;
    if (!blacklive) return -199999;
    return 0;
  };

  let alphabeta = function (alpha, beta, depth) {
    let limit = self.isgameover(curboard);
    if (limit) return limit;

    if (depth <= 0) {
      // 静态搜索（只扩展吃子）
      const side = (maxDepth - depth) % 2;
      return qsearch(alpha, beta, side, 0);
    }

    let bestflag = -1;

    let movecount = movecreate.createPossibleMove(
      curboard,
      depth,
      (rootSide + (maxDepth - depth)) % 2
    );

    // —— 关键：取出当前层走法数组（修复 movelist 未定义）——
    const movelist = movecreate.getmoveList(depth, movecount);

    // —— 综合排序（MVV-LVA + 杀手 + 历史表）——
    for (let i = 0; i < movecount; i++) {
      const m = movelist[i];
      const victim = curboard[m.to.y][m.to.x];
      const attacker = curboard[m.from.y][m.from.x];
      const isCap = victim !== NOCHESS;
      const mvvLva = isCap
        ? 100000 + (pieceValue(victim) << 4) - pieceValue(attacker)
        : 0;

      // 杀手加分（只对非吃子）
      let killerBonus = 0;
      const km = killerMoves[depth] || [];
      if (!isCap && (eqMove(km[0], m) || eqMove(km[1], m))) killerBonus = 3000;

      const history = historyTable.gethistoryscore(m);
      const badCapPenalty =
        isCap && pieceValue(attacker) > pieceValue(victim) ? 5000 : 0;
      m.score = mvvLva + killerBonus + history + badCapPenalty * -1;
    }
    movelist.sort((a, b) => b.score - a.score);

    if (rootSide + ((maxDepth - depth) % 2) == 1) {
      // 极小层（红方）
      for (let i = 0; i < movecount; i++) {
        let cap = makemove(movelist[i]);
        let score = alphabeta(alpha, beta, depth - 1);
        unmakemove(movelist[i], cap);

        if (score < beta) {
          beta = score;
          if (maxDepth == depth) bestmove = movelist[i];
          bestflag = i;
          if (alpha >= beta) {
            if (bestflag != -1) {
              historyTable.enterhistorytable(movelist[bestflag], depth);
              if (cap === NOCHESS) pushKiller(depth, movelist[bestflag]);
            }
            return beta;
          }
        }
      }

      if (bestflag != -1) {
        historyTable.enterhistorytable(movelist[bestflag], depth);
      }
      return beta;
    } else {
      // 极大层（黑方）
      for (let i = 0; i < movecount; i++) {
        let cap = makemove(movelist[i]);
        let score = alphabeta(alpha, beta, depth - 1);
        unmakemove(movelist[i], cap);

        if (score > alpha) {
          alpha = score;
          if (maxDepth == depth) bestmove = movelist[i];
          bestflag = i;
          if (alpha >= beta) {
            if (bestflag != -1) {
              historyTable.enterhistorytable(movelist[bestflag], depth);
              if (cap === NOCHESS) pushKiller(depth, movelist[bestflag]);
            }
            return alpha;
          }
        }
      }

      return alpha;
    }
  };

  // —— 静态搜索：只扩展吃子步 ——
  // —— 静态搜索：只扩展吃子步 ——
  // —— 静态搜索：只扩展吃子步 ——
  // side: 0=黑（极大层），1=红（极小层）
  function qsearch(alpha, beta, side, qd) {
    // Stand pat（对称处理）
    const sp = evalution.eval(curboard, side);
    if (side === 0) {
      // 极大层
      if (sp >= beta) return beta; // fail-high
      if (sp > alpha) alpha = sp;
    } else {
      // 极小层
      if (sp <= alpha) return alpha; // fail-low
      if (sp < beta) beta = sp;
    }

    // 深度限制
    if (qd >= 16) return side === 0 ? alpha : beta;

    // 生成并提取“吃子步”
    const count = movecreate.createPossibleMove(curboard, 0, side);
    const baseList = movecreate.getmoveList(0, count);
    const caps = [];
    for (let i = 0; i < count; i++) {
      const m = baseList[i];
      if (curboard[m.to.y][m.to.x] !== NOCHESS) {
        caps.push({
          from: new ChessPoint(m.from.x, m.from.y),
          to: new ChessPoint(m.to.x, m.to.y),
        });
      }
    }
    if (caps.length === 0) return side === 0 ? alpha : beta;

    // MVV-LVA 排序（两边通用）
    caps.sort((a, b) => {
      const av =
        pieceValue(curboard[a.to.y][a.to.x]) -
        (pieceValue(curboard[a.from.y][a.from.x]) >> 2);
      const bv =
        pieceValue(curboard[b.to.y][b.to.x]) -
        (pieceValue(curboard[b.from.y][b.from.x]) >> 2);
      return bv - av;
    });

    if (side === 0) {
      // 极大层：黑
      for (let i = 0; i < caps.length; i++) {
        const cap = makemove(caps[i]);
        const score = qsearch(alpha, beta, 1, qd + 1);
        unmakemove(caps[i], cap);
        if (score > alpha) {
          alpha = score;
          if (alpha >= beta) return alpha; // 剪枝
        }
      }
      return alpha;
    } else {
      // 极小层：红
      for (let i = 0; i < caps.length; i++) {
        const cap = makemove(caps[i]);
        const score = qsearch(alpha, beta, 0, qd + 1);
        unmakemove(caps[i], cap);
        if (score < beta) {
          beta = score;
          if (alpha >= beta) return beta; // 剪枝
        }
      }
      return beta;
    }
  }
};
