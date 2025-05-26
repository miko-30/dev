const COLS = 10, ROWS = 20;
let field = Array.from({lenght: ROWS}, () => Array(COLS).fill(0));
// テトリミノ形状（例：I字とO字の初期状態）
const TETROMINOS = {
    I: [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],              // I字型
    O: [
        [1,1],
        [1,1]
    ],              // O字型
    T: [
        [0,1,0],
        [1,1,1],
        [0,0,0]
    ],              // T字型
    L: [
        [0,0,1],
        [1,1,1],
        [0,0,0]
    ],              // L字型
    J: [
        [1,0,0],
        [1,1,1],
        [0,0,0]
    ],              // J字型
    s: [
        [0,1,1],
        [1,1,0],
        [0,0,0]
    ],              // S字型
    Z: [
        [1,1,0],
        [0,1,1],
        [0,0,0]
    ]               // Z字型
};

//ブロック生成＆落下処理

let currentBlock = { shape: null, row: 0, col: 3 }; //初期値は中央付近
function spawnBlock() {
    const rnd = Math.floor(Math.random() * TETROMINOS.length);
    currentBlock.shape = TETROMINOS[rnd];
    currentBlock.row = 0;
    currentBlock.col = 3;
    // 生成直後に衝突していたらゲームオーバー判定
    if (hasCollision()) gameover(); // :contentRegerence[oaicite:17]{index=17}:contentReference[oaicite:18]{index=18}
}
//落下＆衝突判定確認
function update() {
    currentBlock.row++;
    if (hasCollision()) {
        currentBlock.row--;     // 衝突したら1つ上に戻す
        fixBlockToField();      // フィールドに固定
        clearLines();           // ライン消去＆得点
        spawnBlock();           // 次のブロックを生成
    }
    draw();     //画面更新（描画）
}
setInterval(update, 1000);  //1秒ごとに落下

//衝突判定と固定化

function hasCollision() {
    const shape = currentBlock.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
                let nr = currentBlock.raw + r;
                let nc = currentBlock.col + c;
                if (nr < 0 || nr >=ROWS || nc < 0 || nc >= COLS) return true;
                if (field[nr][nc] !== 0) return true;
            }
        }
    }
    return false;
}
//固定化
function fixBlockToField() {
    const shape = currentBlock.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
                field[currentBlock.row + r][currentBlock.col + c] = shape[r][c];
            }
        }
    }
}

//ライン消去と得点計算

function clearLines() {
    let cleared = 0;
    for (let r = 0; r <ROWS; r++) {
        if (field[r].every(cell => cell !== 0)) {
            field.splice(r,1);                          // 該当行を削除
            field.unshift(Array(COLS).fill(0));         // 先頭に空行を追加
            cleared++;
        }
    }
}
