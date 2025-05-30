const gridSize = 10;
let mode = 'obstacle';
let start = { row: 0, col: 0 };
let end = { row: 9, col: 9 };
let grid = [];

function createGrid() {
  const gridElem = document.getElementById('grid');
  gridElem.innerHTML = '';
  grid = [];
  for (let row = 0; row < gridSize; row++) {
    const rowArr = [];
    for (let col = 0; col < gridSize; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('mousedown', onCellMouseDown);
      cell.addEventListener('mouseenter', onCellMouseEnter);
      cell.addEventListener('mouseup', onCellMouseUp);
      cell.addEventListener('click', onCellClick);
      gridElem.appendChild(cell);
      rowArr.push({ type: 'empty', elem: cell });
    }
    grid.push(rowArr);
  }
  updateCell(start.row, start.col, 'start');
  updateCell(end.row, end.col, 'end');
}
let isMouseDown = false;
let dragType = null;

function onCellMouseDown(e) {
  if (mode !== 'deleteObstacle') return;
  isMouseDown = true;
  const row = +e.target.dataset.row;
  const col = +e.target.dataset.col;
  if ((row === start.row && col === start.col) || (row === end.row && col === end.col)) return;
  if (grid[row][col].type === 'obstacle') {
    dragType = 'empty';
    updateCell(row, col, 'empty');
  } else {
    dragType = null;
  }
}

function onCellMouseEnter(e) {
  if (!isMouseDown || mode !== 'deleteObstacle') return;
  const row = +e.target.dataset.row;
  const col = +e.target.dataset.col;
  if ((row === start.row && col === start.col) || (row === end.row && col === end.col)) return;
  if (dragType === 'empty' && grid[row][col].type === 'obstacle') {
    updateCell(row, col, 'empty');
  }
}

function onCellMouseUp(e) {
  isMouseDown = false;
  dragType = null;
}

function updateCell(row, col, type) {
  const cell = grid[row][col];
  cell.type = type;
  cell.elem.className = 'cell ' + (type !== 'empty' ? type : '');
}

function onCellClick(e) {
  const row = +e.target.dataset.row;
  const col = +e.target.dataset.col;
  if (mode === 'start') {
    updateCell(start.row, start.col, 'empty');
    start = { row, col };
    updateCell(row, col, 'start');
  } else if (mode === 'end') {
    updateCell(end.row, end.col, 'empty');
    end = { row, col };
    updateCell(row, col, 'end');
  } else if (mode === 'obstacle') {
    if ((row === start.row && col === start.col) || (row === end.row && col === end.col)) return;
    const type = grid[row][col].type === 'obstacle' ? 'empty' : 'obstacle';
    updateCell(row, col, type);
  } else if (mode === 'deleteObstacle') {
    if (grid[row][col].type === 'obstacle') {
      updateCell(row, col, 'empty');
    }
  }
}

document.getElementById('setEnd').onclick = () => mode = 'end';
document.getElementById('setObstacle').onclick = () => mode = 'obstacle';
document.getElementById('deleteObstacle').onclick = () => mode = 'deleteObstacle';
document.getElementById('clear').onclick = () => createGrid();
document.getElementById('run').onclick = () => runDijkstra();

document.addEventListener('mouseup', () => { isMouseDown = false; dragType = null; });

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function runDijkstra() {
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (['visited', 'path'].includes(grid[row][col].type)) updateCell(row, col, 'empty');
    }
  }
  const visited = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  const dist = Array.from({ length: gridSize }, () => Array(gridSize).fill(Infinity));
  const prev = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  dist[start.row][start.col] = 0;
  const queue = [{ row: start.row, col: start.col, dist: 0 }];
  const drc = [ [0,1], [1,0], [0,-1], [-1,0] ];
  let found = false;
  document.getElementById('message').textContent = '';
  while (queue.length) {
    queue.sort((a, b) => a.dist - b.dist);
    const { row, col } = queue.shift();
    if (visited[row][col]) continue;
    visited[row][col] = true;
    if (!(row === start.row && col === start.col) && !(row === end.row && col === end.col)) {
      updateCell(row, col, 'visited');
      await sleep(30);
    }
    if (row === end.row && col === end.col) {
      found = true;
      break;
    }
    for (const [dr, dc] of drc) {
      const nr = row + dr, nc = col + dc;
      if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
      if (grid[nr][nc].type === 'obstacle') continue;
      if (dist[nr][nc] > dist[row][col] + 1) {
        dist[nr][nc] = dist[row][col] + 1;
        prev[nr][nc] = { row, col };
        queue.push({ row: nr, col: nc, dist: dist[nr][nc] });
      }
    }
  }

  let cur = end;
  const path = [];
  while (prev[cur.row][cur.col]) {
    cur = prev[cur.row][cur.col];
    if (!(cur.row === start.row && cur.col === start.col)) path.push(cur);
  }
  for (let i = path.length - 1; i >= 0; i--) {
    updateCell(path[i].row, path[i].col, 'path');
    await sleep(50);
  }
  if (found && path.length > 0) {
    setTimeout(() => {
      document.getElementById('message').textContent = 'Found You!';
    }, 100);
  } else if (!found) {
    setTimeout(() => {
      document.getElementById('message').textContent = 'Where are you young padawan?';
    }, 100);
  }
}

createGrid();
