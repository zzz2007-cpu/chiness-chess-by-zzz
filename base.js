const BOARD = [
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

const PERSON = 1;
const MACHINE = 0;
const NOCHESS = 0;

const B_KING = 1;
const B_CAR = 2;
const B_HORSE = 3;
const B_CANON = 4;
const B_BISHOP = 5;
const B_ELEPHANT = 6;
const B_PAWN = 7;
const B_BEGIN = B_KING;
const B_END = B_PAWN;

const R_KING = 8;
const R_CAR = 9;
const R_HORSE = 10;
const R_CANON = 11;
const R_BISHOP = 12;
const R_ELEPHANT = 13;
const R_PAWN = 14;
const R_BEGIN = 8;
const R_END = 14;

const isBlack = (code) => code >= B_BEGIN && code <= B_END;
const isRed = (code) => code >= R_BEGIN && code <= R_END;
const isSameSide = (a, b) =>
  (isBlack(a) && isBlack(b)) || (isRed(a) && isRed(b));

function ChessPoint(x, y) {
  this.x = x;
  this.y = y;
}
function ChessMove(chess, from, to, score) {
  this.chess = chess;
  this.from = from;
  this.to = to;
  this.score = score;
}

/* ========================================================================== */
/*  统一规则 & 检查（全局唯一事实来源）                                        */
/*  追加于 base.js 末尾，供 UI / moveGenerator / evaluation 统一调用            */
/* ========================================================================== */

window.canMoveByRule = function (board, from, to) {
  // 边界与同格
  if (from.x === to.x && from.y === to.y) return false;

  const chess = board[from.y][from.x];
  const target = board[to.y][to.x];

  // 己方占用
  if (isSameSide(chess, target)) return false;

  switch (chess) {
    /* —— 将（黑） —— */
    case B_KING:
      // “对脸”吃红将：同列且中间无子
      if (target === R_KING) {
        if (from.x !== to.x) return false;
        for (let i = from.y + 1; i < to.y; i++) {
          if (board[i][from.x] !== NOCHESS) return false;
        }
      } else {
        // 九宫 + 王走一步
        if (to.y > 2 || to.x > 5 || to.x < 3) return false;
        if (Math.abs(from.x - to.x) + Math.abs(from.y - to.y) > 1) return false;
      }
      break;

    /* —— 帅（红） —— */
    case R_KING:
      if (target === B_KING) {
        if (from.x !== to.x) return false;
        for (let i = from.y - 1; i > to.y; i--) {
          if (board[i][from.x] !== NOCHESS) return false;
        }
      } else {
        if (to.y < 7 || to.x > 5 || to.x < 3) return false;
        if (Math.abs(from.x - to.x) + Math.abs(from.y - to.y) > 1) return false;
      }
      break;

    /* —— 士 —— */
    case R_BISHOP:
      if (to.y < 7 || to.x < 3 || to.x > 5) return false;
      if (Math.abs(from.x - to.x) !== 1 || Math.abs(from.y - to.y) !== 1)
        return false;
      break;

    case B_BISHOP:
      if (to.y > 2 || to.x < 3 || to.x > 5) return false;
      if (Math.abs(from.x - to.x) !== 1 || Math.abs(from.y - to.y) !== 1)
        return false;
      break;

    /* —— 相/象 —— */
    case R_ELEPHANT:
      if (to.y < 5) return false; // 不能过河
      if (Math.abs(from.x - to.x) !== 2 || Math.abs(from.y - to.y) !== 2)
        return false;
      if (board[(from.y + to.y) / 2][(from.x + to.x) / 2] !== NOCHESS)
        return false; // 象眼
      break;

    case B_ELEPHANT:
      if (to.y > 4) return false; // 不能过河
      if (Math.abs(from.x - to.x) !== 2 || Math.abs(from.y - to.y) !== 2)
        return false;
      if (board[(from.y + to.y) / 2][(from.x + to.x) / 2] !== NOCHESS)
        return false;
      break;

    /* —— 兵/卒 —— */
    case B_PAWN:
      // 黑兵向下
      if (to.y < from.y) return false;
      if (from.y < 5 && from.y === to.y) return false; // 未过河不能平移
      if (to.y - from.y + Math.abs(to.x - from.x) > 1) return false;
      break;

    case R_PAWN:
      // 红兵向上
      if (to.y > from.y) return false;
      if (from.y > 4 && from.y === to.y) return false; // 未过河不能平移
      if (from.y - to.y + Math.abs(to.x - from.x) > 1) return false;
      break;

    /* —— 马 —— */
    case B_HORSE:
    case R_HORSE: {
      const dx = Math.abs(from.x - to.x),
        dy = Math.abs(from.y - to.y);
      if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) return false;
      let i, j;
      if (to.x - from.x === 2) {
        i = from.x + 1;
        j = from.y;
      } else if (from.x - to.x === 2) {
        i = from.x - 1;
        j = from.y;
      } else if (to.y - from.y === 2) {
        i = from.x;
        j = from.y + 1;
      } else if (from.y - to.y === 2) {
        i = from.x;
        j = from.y - 1;
      }
      if (board[j][i] !== NOCHESS) return false; // 马脚
      break;
    }

    /* —— 车 —— */
    case B_CAR:
    case R_CAR:
      if (from.y !== to.y && from.x !== to.x) return false;
      if (from.y === to.y) {
        if (from.x < to.x) {
          for (let i = from.x + 1; i < to.x; i++)
            if (board[from.y][i] !== NOCHESS) return false;
        } else {
          for (let i = to.x + 1; i < from.x; i++)
            if (board[from.y][i] !== NOCHESS) return false;
        }
      } else {
        if (from.y < to.y) {
          for (let i = from.y + 1; i < to.y; i++)
            if (board[i][from.x] !== NOCHESS) return false;
        } else {
          for (let i = to.y + 1; i < from.y; i++)
            if (board[i][from.x] !== NOCHESS) return false;
        }
      }
      break;

    /* —— 炮 —— */
    case B_CANON:
    case R_CANON: {
      if (from.y !== to.y && from.x !== to.x) return false;
      const emptyTarget = target === NOCHESS;
      let count = 0;
      if (from.y === to.y) {
        if (from.x < to.x) {
          for (let i = from.x + 1; i < to.x; i++)
            if (board[from.y][i] !== NOCHESS) count++;
        } else {
          for (let i = to.x + 1; i < from.x; i++)
            if (board[from.y][i] !== NOCHESS) count++;
        }
      } else {
        if (from.y < to.y) {
          for (let i = from.y + 1; i < to.y; i++)
            if (board[i][from.x] !== NOCHESS) count++;
        } else {
          for (let i = to.y + 1; i < from.y; i++)
            if (board[i][from.x] !== NOCHESS) count++;
        }
      }
      // 不吃子：路上 0 子；吃子：路上恰好 1 子
      if ((emptyTarget && count !== 0) || (!emptyTarget && count !== 1))
        return false;
      break;
    }
  }
  return true;
};

/* —— 找王（红/黑） —— */
window.findKing = function (board, isRedSide) {
  const K = isRedSide ? R_KING : B_KING;
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 9; x++)
      if (board[y][x] === K) return new ChessPoint(x, y);
  return null;
};

/* —— 是否被将 —— */
window.isInCheck = function (board, isRedSide) {
  const kp = findKing(board, isRedSide);
  if (!kp) return false;
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const c = board[y][x];
      if (c !== NOCHESS && (isRedSide ? isBlack(c) : isRed(c))) {
        if (canMoveByRule(board, new ChessPoint(x, y), kp)) return true;
      }
    }
  }
  return false;
};

// === 全站 Toast（轻量气泡） ===
(function () {
  // 1) 注入样式（只注入一次）
  if (!document.getElementById("toast-style")) {
    const style = document.createElement("style");
    style.id = "toast-style";
    style.textContent = `
#toast-container{position:fixed;right:16px;top:16px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none}
.toast{min-width:220px;max-width:360px;background:rgba(20,20,25,.9);color:#fff;border:1px solid rgba(255,255,255,.15);
  border-radius:12px;padding:10px 14px;font-size:14px;box-shadow:0 8px 20px rgba(0,0,0,.35);opacity:0;transform:translateY(-8px);
  transition:.22s ease;pointer-events:auto}
.toast.in{opacity:1;transform:translateY(0)}
.toast.out{opacity:0;transform:translateY(-8px)}
.toast.info{background:rgba(20,20,25,.92)}
.toast.success{background:linear-gradient(180deg,#16a34a,#15803d)}
.toast.warn{background:linear-gradient(180deg,#eab308,#a16207)}
.toast.error{background:linear-gradient(180deg,#ef4444,#b91c1c)}
    `;
    document.head.appendChild(style);
  }

  // 2) 容器（只创建一次）
  function getContainer() {
    let c = document.getElementById("toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "toast-container";
      document.body.appendChild(c);
    }
    return c;
  }

  // 3) 对外：通用 showToast
  window.showToast = function (msg, opts = {}) {
    const { duration = 1600, type = "info" } = opts;
    const container = getContainer();
    const node = document.createElement("div");
    node.className = "toast " + type;
    node.textContent = msg;
    container.appendChild(node);
    // 入场
    requestAnimationFrame(() => node.classList.add("in"));
    // 退场 & 移除
    setTimeout(() => {
      node.classList.remove("in");
      node.classList.add("out");
      node.addEventListener("transitionend", () => node.remove(), {
        once: true,
      });
    }, Math.max(800, duration));
  };

  // 4) 对外：统一的“悔棋”提示
  window.toastNoUndo = function () {
    const msgs = [
      "落子无悔，方显风度。",
      "棋如人生，只能向前。",
      "悔棋易，悔过难。",
      "一步一世界，不必回头。",
      "当前一念，决定全局。",
      "胜不骄，败不馁，落子不悔。",
    ];
    const m = msgs[Math.floor(Math.random() * msgs.length)];
    window.showToast(m, { duration: 1800, type: "info" });
  };
})();
