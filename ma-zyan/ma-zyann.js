// 牌の定義
const tiles = [
  ...Array.from({ length: 9 }, (_, i) => `${i + 1}萬`),
  ...Array.from({ length: 9 }, (_, i) => `${i + 1}筒`),
  ...Array.from({ length: 9 }, (_, i) => `${i + 1}索`),
  "東", "南", "西", "北", "白", "發", "中"
];

// ゲーム状態変数
let deck = [];
let hand = [];
let discards = [];
let wanpai = [];
let doraIndicator = null;
let lastDrawnIndex = null;

// 牌の順序（理牌用）
const tileOrder = {};
[...Array(9)].forEach((_, i) => tileOrder[`${i + 1}萬`] = i);
[...Array(9)].forEach((_, i) => tileOrder[`${i + 1}筒`] = 10 + i);
[...Array(9)].forEach((_, i) => tileOrder[`${i + 1}索`] = 20 + i);
["東", "南", "西", "北", "白", "發", "中"].forEach((t, i) => tileOrder[t] = 30 + i);

// シャッフル
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ゲーム開始
function startGame() {
  deck = [];
  for (let i = 0; i < 4; i++) deck.push(...tiles);
  shuffle(deck);

  wanpai = deck.splice(-14);
  doraIndicator = wanpai[0];

  hand = deck.splice(0, 13);
  discards = [];
  lastDrawnIndex = null;

  sortHand();
  renderHand();
  renderDiscards();
  renderDora(doraIndicator);
  updateDeckCount();
}

// ツモ処理
function tsumo() {
  if (deck.length === 0) {
    alert("山が尽きました！");
    return;
  }
  if (hand.length >= 14) {
    alert("すでにツモ済みです。先に1枚捨ててください。");
    return;
  }

  const drawn = deck.shift();
  sortHand();    // ここを先に追加
  hand.push(drawn);          // 追加後にソート
  lastDrawnIndex = hand.length - 1;

  renderHand();
  updateDeckCount();
}

// 捨てる処理
function discard(index) {
  if (hand.length <= 13) {
    alert("ツモしてから捨ててください。");
    return;
  }

  const discardedTile = hand.splice(index, 1)[0];
  discards.push(discardedTile);

  if (lastDrawnIndex === index) {
    lastDrawnIndex = null;
  } else if (lastDrawnIndex !== null && index < lastDrawnIndex) {
    lastDrawnIndex--;
  }

  renderHand();
  renderDiscards();
}

// 理牌（ソート）
function sortHand() {
  hand.sort((a, b) => tileOrder[a] - tileOrder[b]);
}

// 手牌描画
function renderHand() {
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = '';
  hand.forEach((tile, i) => {
    const span = document.createElement('span');
    span.className = 'tile';
    if (i === lastDrawnIndex) {
      span.style.backgroundColor = '#d1f2eb';
    }
    span.textContent = tile;
    span.onclick = () => discard(i);
    handDiv.appendChild(span);
  });

  const agariButton = document.getElementById("agari-button");
  if (hand.length === 14 && judgeHand(hand).win) {
    agariButton.style.display = 'inline-block';
  } else {
    agariButton.style.display = 'none';
  }
}

// 捨牌描画
function renderDiscards() {
  const discardDiv = document.getElementById("discarded");
  discardDiv.innerHTML = discards.map(t => `<span class="tile">${t}</span>`).join('');
}

// ドラ表示
function renderDora(indicator) {
  const doraDiv = document.getElementById("dora");
  if (!doraDiv) return;
  doraDiv.innerHTML = `
    表示牌: <span class="tile">${indicator}</span>
  `;
}

// 残り枚数表示
function updateDeckCount() {
  const deckCountSpan = document.getElementById("deck-count");
  if (deckCountSpan) {
    deckCountSpan.textContent = deck.length;
  }
}

// 和了ボタン動作
function checkWin() {
  const result = judgeHand(hand);
  if (result.win) {
    alert("和了！ 役: " + (result.yaku.length ? result.yaku.join(", ") : "なし"));
  } else {
    alert("和了できません。");
  }
}

// 和了判定関数
function judgeHand(handTiles) {
  const sorted = [...handTiles].sort((a, b) => tileOrder[a] - tileOrder[b]);
  const yaku = [];

  // 七対子判定
  const counts = {};
  for (const tile of sorted) {
    counts[tile] = (counts[tile] || 0) + 1;
  }

  const pairCount = Object.values(counts).filter(c => c === 2).length;
  const otherCount = Object.values(counts).some(c => c !== 2);

  if (pairCount === 7 && !otherCount) {
    yaku.push("七対子");
    return { win: true, yaku };
  }

  // 通常の和了形か確認
  const isAgari = isWinningHand(sorted);
  if (!isAgari) return { win: false, yaku: [] };

  // タンヤオ判定
  const isTanyao = sorted.every(tile => {
    if (["東", "南", "西", "北", "白", "發", "中"].includes(tile)) return false;
    const match = tile.match(/^(\d)([萬筒索])$/);
    if (match) {
      const num = parseInt(match[1]);
      return num > 1 && num < 9;
    }
    return false;
  });
  if (isTanyao) yaku.push("タンヤオ");

  // 平和判定
  const tileCounts = { ...counts };
  const triplets = [];
  const sequences = [];

  function extractMentsu(copy) {
    const tiles = Object.keys(copy).sort((a, b) => tileOrder[a] - tileOrder[b]);
    for (const tile of tiles) {
      if (copy[tile] >= 3) {
        triplets.push(tile);
        copy[tile] -= 3;
        return extractMentsu(copy);
      }

      const m = tile.match(/^(\d)([萬筒索])$/);
      if (m) {
        const n = parseInt(m[1]);
        const s = m[2];
        const t2 = `${n + 1}${s}`;
        const t3 = `${n + 2}${s}`;
        if (copy[tile] > 0 && copy[t2] > 0 && copy[t3] > 0) {
          sequences.push(tile);
          copy[tile]--;
          copy[t2]--;
          copy[t3]--;
          return extractMentsu(copy);
        }
      }
    }
    return;
  }

  const workingCounts = { ...counts };
  for (const t of Object.keys(workingCounts)) {
    if (workingCounts[t] >= 2) {
      workingCounts[t] -= 2; // 雀頭と仮定
      triplets.length = 0;
      sequences.length = 0;
      extractMentsu({ ...workingCounts });

      if (triplets.length === 0 && sequences.length === 4 &&
          !["東", "南", "西", "北", "白", "發", "中"].includes(t)) {
        yaku.push("平和");
        break;
      }

      workingCounts[t] += 2;
    }
  }

  // 三元牌の役判定（白發中の刻子）
  const sangen = ["白", "發", "中"];
  sangen.forEach(honor => {
    if (counts[honor] >= 3) {
      if (honor === "白") yaku.push("白");
      if (honor === "發") yaku.push("發");
      if (honor === "中") yaku.push("中");
    }
  });

    // 混一色・清一色の判定
  const suits = new Set();
  let hasHonor = false;

  for (const tile of sorted) {
    if (["東", "南", "西", "北", "白", "發", "中"].includes(tile)) {
      hasHonor = true;
    } else {
      const match = tile.match(/^(\d)([萬筒索])$/);
      if (match) {
        suits.add(match[2]);
      }
    }
  }

  if (suits.size === 1 && hasHonor) {
    yaku.push("混一色");
  } else if (suits.size === 1 && !hasHonor) {
    yaku.push("清一色");
  }
  //ここに役を追加

  return { win: true, yaku };
  
}

// 和了判定ロジック
function isWinningHand(tiles) {
  if (tiles.length !== 14) return false;

  const counts = {};
  for (const tile of tiles) {
    counts[tile] = (counts[tile] || 0) + 1;
  }

  const tileList = Object.keys(counts);
  for (const pair of tileList) {
    if (counts[pair] >= 2) {
      const copy = { ...counts };
      copy[pair] -= 2;
      if (canMakeMentsu(copy)) return true;
    }
  }

  return false;
}

// 面子構成可能かどうか
function canMakeMentsu(counts) {
  const tiles = Object.keys(counts).sort((a, b) => tileOrder[a] - tileOrder[b]);

  for (const tile of tiles) {
    if (counts[tile] === 0) continue;

    // 刻子チェック
    if (counts[tile] >= 3) {
      const copy = { ...counts };
      copy[tile] -= 3;
      if (canMakeMentsu(copy)) return true;
    }

    // 順子チェック
    const match = tile.match(/^(\d)([萬筒索])$/);
    if (match) {
      const num = parseInt(match[1]);
      const suit = match[2];
      const t2 = `${num + 1}${suit}`;
      const t3 = `${num + 2}${suit}`;
      if (counts[t2] > 0 && counts[t3] > 0) {
        const copy = { ...counts };
        copy[tile]--;
        copy[t2]--;
        copy[t3]--;
        if (canMakeMentsu(copy)) return true;
      }
    }

    return false;
  }

  return true;
}
