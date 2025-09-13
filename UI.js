let ChineseChessUI = function (placeholder) {
  // start(level, who) 里，确定双方阵营
  let machineSide = 0; // 0=黑，1=红（由 start() 决定）
  let personSide = 1; // 0=黑，1=红（由 start() 决定）
  let currentTurn = 1; // 1=红走, 0=黑走

  let unique = "chinese_chess_ui";
  window[unique] = this;

  let searchEngine;
  let curBoard;
  let selectedPos;

  this._selected = function (i, j) {
    selectedPos = new ChessPoint(j, i);
    selectGrid([selectedPos]);
  };

  this.start = function (level, who) {
    curBoard = [
      [2, 3, 6, 5, 1, 5, 6, 3, 2],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 4, 0, 0, 0, 0, 0, 4, 0],
      [7, 0, 7, 0, 7, 0, 7, 0, 7],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [14, 0, 14, 0, 14, 0, 14, 0, 14],
      [0, 11, 0, 0, 0, 0, 0, 11, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [9, 10, 13, 12, 8, 12, 13, 10, 9],
    ];

    searchEngine = new Searchengine(level);

    machineSide = who == MACHINE ? 1 : 0;
    personSide = 1 - machineSide; // 玩家永远是机器的对方

    if (who == MACHINE) {
      // 机器先手 → 传入机器是红方
      const result = searchEngine.getgoodmove(curBoard, machineSide);
      const bestmove = result.bestmove;
      curBoard = result.board;
      draw(curBoard);
      selectGrid([bestmove.to]);
    } else {
      draw(curBoard);
    }
  };

  // 自定义开局：用于残局（加载 JSON 时用）
  // board: 二维数组(10x9)
  // sideToMove: 开局轮到谁走 (0=黑, 1=红)
  // machine: 机器是哪方 (0=黑, 1=红)
  // level: 搜索深度

  // —— 提示动画容器（#placeholder 的父节点应是 .board-wrap） ——
  const wrapEl = document.getElementById(placeholder).parentNode;

  // —— 提示动画：只在“退场动画”结束时移除，避免提前被删 ——
  function showBanner(text, theme /* 'red' | 'black' */, isMate = false) {
    const div = document.createElement("div");
    div.className = "check-banner " + theme + (isMate ? " mate" : "");
    div.textContent = text;
    wrapEl.appendChild(div);
    div.addEventListener("animationend", (e) => {
      if (
        e.animationName === "banner-out" ||
        e.animationName === "banner-fade"
      ) {
        div.remove();
      }
    });
  }

  // —— 基础工具 —— //
  function cloneBoard(b) {
    return b.map((r) => r.slice());
  }

  this.setCustomStart = function (board, sideToMove, machine, level) {
    curBoard = cloneBoard(board);
    searchEngine = new Searchengine(level);

    machineSide = machine;
    personSide = machine === -1 ? -1 : 1 - machine;

    // ★ 关键：记录当前轮到谁走（0=黑, 1=红）
    currentTurn = sideToMove; // ←← 新增

    // 如果是人人对战，直接绘制，不触发AI
    if (machineSide === -1) {
      draw(curBoard);
      return;
    }

    // AI 模式下，若开局轮到机器走
    if (sideToMove === machineSide) {
      const result = searchEngine.getgoodmove(curBoard, machineSide);
      const bestmove = result.bestmove;
      curBoard = result.board;
      draw(curBoard);
      selectGrid([bestmove.to]);
    } else {
      draw(curBoard);
    }
  };

  const findKing = window.findKing;
  const isInCheck = window.isInCheck;
  //判断是否被将死
  function isCheckmate(board, isRedSide) {
    if (!isInCheck(board, isRedSide)) return false; // 必须处于将军
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < 9; x++) {
        const c = board[y][x];
        if (c !== NOCHESS && (isRedSide ? isRed(c) : isBlack(c))) {
          const from = new ChessPoint(x, y);
          for (let ty = 0; ty < 10; ty++)
            for (let tx = 0; tx < 9; tx++) {
              const to = new ChessPoint(tx, ty);
              if (!isValidMove(board, from, to)) continue;
              const b2 = cloneBoard(board);
              b2[to.y][to.x] = b2[from.y][from.x];
              b2[from.y][from.x] = NOCHESS;
              if (!isInCheck(b2, isRedSide)) return false; // 走后能解将 → 不是绝杀
            }
        }
      }
    return true;
  }
  // 这一方是否还有合法走法
  function hasAnyLegalMove(board, isRedSide) {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const c = board[y][x];
        if (c !== NOCHESS && (isRedSide ? isRed(c) : isBlack(c))) {
          const from = new ChessPoint(x, y);
          for (let ty = 0; ty < 10; ty++) {
            for (let tx = 0; tx < 9; tx++) {
              const to = new ChessPoint(tx, ty);
              if (!isValidMove(board, from, to)) continue;
              const b2 = cloneBoard(board);
              b2[to.y][to.x] = b2[from.y][from.x];
              b2[from.y][from.x] = NOCHESS;
              if (!isInCheck(b2, isRedSide)) return true; // 有一步合法着
            }
          }
        }
      }
    }
    return false;
  }

  // 不在将军中 && 无路可走 → 困毙（也判终局）
  function isStalemate(board, isRedSide) {
    return !isInCheck(board, isRedSide) && !hasAnyLegalMove(board, isRedSide);
  }

  // === 替换后的 _move：将死 or 困毙 立即“绝杀”，否则若在将军 → 提示“将军” ===
  this._move = function (i, j) {
    if (!selectedPos) return;
    const moveto = new ChessPoint(j, i);

    if (!isValidMove(curBoard, selectedPos, moveto)) {
      showToast("您走的位置不符合规则", { type: "warn", duration: 1600 });
      return;
    }

    // 人类落子：先更新画面
    curBoard[moveto.y][moveto.x] = curBoard[selectedPos.y][selectedPos.x];
    curBoard[selectedPos.y][selectedPos.x] = NOCHESS;
    selectedPos = null;

    if (machineSide === -1) {
      draw(curBoard);
      selectGrid([moveto]);

      // 对手（下一手要走的一方）：0=黑, 1=红
      const oppSide = 1 - currentTurn;

      // 先判终局（将死或困毙），再判将军
      if (
        isCheckmate(curBoard, oppSide === 1) ||
        isStalemate(curBoard, oppSide === 1)
      ) {
        showBanner("绝杀", oppSide === 1 ? "red" : "black", true);
        lockBoard();
        return;
      }
      if (isInCheck(curBoard, oppSide === 1)) {
        showBanner("将军", oppSide === 1 ? "red" : "black", false);
      }

      // 再换边并重画，刷新棋子控制权
      currentTurn = oppSide;
      draw(curBoard);
      return; // 别走到AI分支
    }

    draw(curBoard);
    selectGrid([moveto]);

    // 若黑王被吃
    let limit = searchEngine.isgameover(curBoard);
    if (limit === -199999) {
      showBanner("绝杀", "black", true);
      lockBoard();
      return;
    }

    // 新：按机器方颜色来提示
    const oppIsRed = machineSide === 1; // 机器是红？
    // 先判终局，再判将军
    if (isCheckmate(curBoard, oppIsRed) || isStalemate(curBoard, oppIsRed)) {
      showBanner("绝杀", oppIsRed ? "red" : "black", true);
      lockBoard();
      return;
    }
    if (isInCheck(curBoard, oppIsRed)) {
      showBanner("将军", oppIsRed ? "red" : "black", false);
    }

    // 给动画一点时间渲染再走 AI，延时AI走子
    setTimeout(() => {
      const result = searchEngine.getgoodmove(curBoard, machineSide);

      const bestmove = result.bestmove;
      curBoard = result.board;

      draw(curBoard);
      selectGrid([bestmove.to]);

      // 红王被吃（旧引擎逻辑）
      limit = searchEngine.isgameover(curBoard);
      if (limit === 199999) {
        showBanner("绝杀", "red", true);
        lockBoard();
        return;
      }

      // 新：按玩家方颜色来提示
      const meIsRed = personSide === 1; // 玩家是红？
      if (isCheckmate(curBoard, meIsRed) || isStalemate(curBoard, meIsRed)) {
        showBanner("绝杀", meIsRed ? "red" : "black", true);
        lockBoard();
        return;
      }
      if (isInCheck(curBoard, meIsRed)) {
        showBanner("将军", meIsRed ? "red" : "black", false);
      }
    }, 520); // 适度延时，保证“将军”动效先展示
  };

  // —— 绘制与交互 —— //
  let draw = function (board) {
    curBoard = board;

    let html = "";
    for (let i = 0; i < 10; i++) {
      html += "<tr>";
      for (let j = 0; j < 9; j++) {
        const chess = board[i][j];
        let classname = "chess ";
        let handlename = "";

        // === 新增：人人对战（machineSide === -1）时的点击逻辑 ===
        if (machineSide === -1) {
          // 人人：只能选中“当前行棋方”的棋子；
          // 其它格子（对方棋子 + 空格）都当作落子目标，从而可以吃子
          const myTurnIsRed = currentTurn === 1;
          const isMyPiece = myTurnIsRed ? isRed(chess) : isBlack(chess);

          handlename = isMyPiece
            ? unique + "._selected(" + i + "," + j + ")"
            : unique + "._move(" + i + "," + j + ")";
        } else {
          // 人机：保持原逻辑
          const isPersonPiece =
            personSide === 1 ? isRed(chess) : isBlack(chess);
          handlename = isPersonPiece
            ? unique + "._selected(" + i + "," + j + ")"
            : unique + "._move(" + i + "," + j + ")";
        }

        switch (chess) {
          case B_KING:
            classname += "black_shuai";
            break;
          case R_KING:
            classname += "red_shuai";
            break;
          case B_BISHOP:
            classname += "black_shi";
            break;
          case R_BISHOP:
            classname += "red_shi";
            break;
          case B_ELEPHANT:
            classname += "black_xiang";
            break;
          case R_ELEPHANT:
            classname += "red_xiang";
            break;
          case B_HORSE:
            classname += "black_ma";
            break;
          case R_HORSE:
            classname += "red_ma";
            break;
          case B_CAR:
            classname += "black_che";
            break;
          case R_CAR:
            classname += "red_che";
            break;
          case B_CANON:
            classname += "black_pao";
            break;
          case R_CANON:
            classname += "red_pao";
            break;
          case B_PAWN:
            classname += "black_bing";
            break;
          case R_PAWN:
            classname += "red_bing";
            break;
          default:
            classname = "";
        }
        html +=
          '<td class="' +
          classname +
          '" onclick="' +
          handlename +
          '" id="grid_' +
          i +
          "_" +
          j +
          '"></td>';
      }
      html += "</tr>";
    }
    html =
      '<table cellspacing="0" cellpadding="0" border="0">' + html + "</table>";
    document.getElementById(placeholder).innerHTML = html;
  };
  //标记某棋子被选中
  let selectGrid = function (points) {
    const grids = document
      .getElementById(placeholder)
      .getElementsByTagName("td");
    for (let k = 0; k < grids.length; k++) grids[k].innerHTML = "";
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      document.getElementById("grid_" + p.y + "_" + p.x).innerHTML =
        '<div class="chess selected"></div>';
    }
  };
  //锁住棋盘
  let lockBoard = function () {
    const grids = document
      .getElementById(placeholder)
      .getElementsByTagName("td");
    for (let k = 0; k < grids.length; k++) {
      grids[k].setAttribute("onclick", "");
    }
  };
};
