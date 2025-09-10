const GRID_SIZE = 25;
const CELL_SIZE = 22;
const ANIMATION_SPEED = 10; // in milliseconds

let grid;
let isRunning = false;
let isDrawing = false;
let drawMode = 'wall';
let startNode = null;
let endNode = null;
let stepCount = 0;

// A simple Min-Heap implementation for better performance
class MinHeap {
  constructor() {
    this.heap = [];
  }

  insert(node) {
    this.heap.push(node);
    this.bubbleUp();
  }

  extractMin() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown();
    }
    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  bubbleUp() {
    let index = this.heap.length - 1;
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (element.distance >= parent.distance) break;
      this.heap[index] = parent;
      this.heap[parentIndex] = element;
      index = parentIndex;
    }
  }

  sinkDown() {
    let index = 0;
    const element = this.heap[0];
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIndex < this.heap.length) {
        leftChild = this.heap[leftChildIndex];
        if (leftChild.distance < element.distance) {
          swap = leftChildIndex;
        }
      }
      if (rightChildIndex < this.heap.length) {
        rightChild = this.heap[rightChildIndex];
        if ((swap === null && rightChild.distance < element.distance) || (swap !== null && rightChild.distance < leftChild.distance)) {
          swap = rightChildIndex;
        }
      }
      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      this.heap[swap] = element;
      index = swap;
    }
  }
}

function logToConsole(message) {
  const consoleOutput = document.getElementById('console-output');
  const logEntry = document.createElement('div');
  logEntry.textContent = `> ${message}`;
  consoleOutput.appendChild(logEntry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
  document.getElementById('console-output').innerHTML = '';
  stepCount = 0;
}

function createGrid() {
  const newGrid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    newGrid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      newGrid[row][col] = {
        row,
        col,
        isWall: false,
        isStart: row === 5 && col === 5,
        isEnd: row === 15 && col === 15,
        distance: Infinity,
        isVisited: false,
        previousNode: null,
        isPath: false,
        element: null // Reference to the DOM element
      };
    }
  }
  return newGrid;
}

function drawGrid() {
  const gridContainer = document.getElementById('grid-container');
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;
  gridContainer.style.gridTemplateRows = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement('div');
      cell.id = `cell-${row}-${col}`;
      cell.className = `cell w-[${CELL_SIZE}px] h-[${CELL_SIZE}px]`;
      grid[row][col].element = cell;
      updateCellClass(grid[row][col]);
      gridContainer.appendChild(cell);
    }
  }
}

function updateCellClass(cell) {
  cell.element.className = `cell w-[${CELL_SIZE}px] h-[${CELL_SIZE}px] ${
    cell.isStart ? 'start' : cell.isEnd ? 'end' : cell.isPath ? 'path' : cell.isVisited ? 'visited' : cell.isWall ? 'wall' : ''
  }`;
}

function updateStats(visited, pathLength, distance) {
  document.getElementById('visited-count').innerText = visited;
  document.getElementById('path-length').innerText = pathLength;
  document.getElementById('total-distance').innerText = distance === Infinity ? '∞' : distance;
}

function resetGrid() {
  if (isRunning) return;
  grid = createGrid();
  startNode = grid[5][5];
  endNode = grid[15][15];
  drawGrid();
  updateStats(0, 0, 0);
  clearConsole();
  logToConsole("Grid has been reset.");
}

function clearPath() {
  if (isRunning) return;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = grid[row][col];
      cell.distance = Infinity;
      cell.isVisited = false;
      cell.isPath = false;
      cell.previousNode = null;
      updateCellClass(cell);
    }
  }
  updateStats(0, 0, 0);
  clearConsole();
  logToConsole("Path has been cleared.");
}

function getNeighbors(node) {
  const neighbors = [];
  const { row, col } = node;

  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < GRID_SIZE - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < GRID_SIZE - 1) neighbors.push(grid[row][col + 1]);

  return neighbors.filter(neighbor => !neighbor.isWall);
}

function dijkstra() {
  const visitedNodesInOrder = [];
  startNode.distance = 0;
  const minHeap = new MinHeap();
  minHeap.insert(startNode);
  
  return new Promise(resolve => {
    const intervalId = setInterval(() => {
      if (minHeap.isEmpty() || isRunning === false) {
        clearInterval(intervalId);
        if (minHeap.isEmpty()) {
          logToConsole("No path found to the end node.");
        }
        resolve(visitedNodesInOrder);
        return;
      }

      const closestNode = minHeap.extractMin();

      if (closestNode.isWall) return;
      if (closestNode.distance === Infinity) {
        clearInterval(intervalId);
        logToConsole("Trapped! Cannot reach the end node.");
        resolve(visitedNodesInOrder);
        return;
      }
      
      closestNode.isVisited = true;
      visitedNodesInOrder.push(closestNode);
      updateCellClass(closestNode);
      updateStats(visitedNodesInOrder.length, 0, 0);
      stepCount++;
      logToConsole(`🔍 Step ${stepCount}: Visiting node (${closestNode.row}, ${closestNode.col}) - Distance: ${closestNode.distance}`);

      if (closestNode === endNode) {
        clearInterval(intervalId);
        logToConsole(`🎉 SUCCESS! Reached destination in ${stepCount} steps!`);
        resolve(visitedNodesInOrder);
        return;
      }

      const neighbors = getNeighbors(closestNode);
      for (const neighbor of neighbors) {
        const newDistance = closestNode.distance + 1;
        if (newDistance < neighbor.distance) {
          logToConsole(`   Updated (${neighbor.row}, ${neighbor.col}): ${neighbor.distance === Infinity ? '∞' : neighbor.distance} → ${newDistance}`);
          neighbor.distance = newDistance;
          neighbor.previousNode = closestNode;
          minHeap.insert(neighbor);
        }
      }
    }, ANIMATION_SPEED);
  });
}

async function animateAlgorithm() {
  if (isRunning) return;
  isRunning = true;
  clearPath();
  clearConsole();
  logToConsole("DIJKSTRA'S ALGORITHM STARTED");
  logToConsole(`📍 Start: (${startNode.row}, ${startNode.col})`);
  logToConsole(`🎯 End: (${endNode.row}, ${endNode.col})`);
  logToConsole(`📊 Grid size: ${GRID_SIZE}×${GRID_SIZE}`);
  logToConsole(`⚡ Initializing distances...`);
  logToConsole(`   Start node distance = 0, All others = ∞`);
  disableControls(true);

  const visitedNodesInOrder = await dijkstra();
  
  // Animate the shortest path
  let path = [];
  if (visitedNodesInOrder.length > 0 && visitedNodesInOrder[visitedNodesInOrder.length - 1] === endNode) {
    path = getShortestPath(endNode);
    logToConsole(`Shortest path found with a length of ${path.length - 1}.`);
  } else {
    logToConsole("Could not find a path to the end node.");
  }
  
  for (let i = 0; i < path.length; i++) {
    setTimeout(() => {
      const node = path[i];
      node.isPath = true;
      node.isVisited = false; // Overwrite visited class
      updateCellClass(node);
      if (i === path.length - 1) {
        updateStats(visitedNodesInOrder.length, path.length, node.distance);
        isRunning = false;
        disableControls(false);
        logToConsole("Path animation complete.");
      }
    }, i * ANIMATION_SPEED);
  }
  if (path.length === 0) {
    isRunning = false;
    disableControls(false);
  }
}

function getShortestPath(endNode) {
  const path = [];
  let currentNode = endNode;
  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return path;
}

function handleModeChange(mode) {
  document.getElementById('wall-mode').classList.remove('bg-gray-800', 'text-white');
  document.getElementById('wall-mode').classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  document.getElementById('start-mode').classList.remove('bg-green-500', 'text-white');
  document.getElementById('start-mode').classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  document.getElementById('end-mode').classList.remove('bg-red-500', 'text-white');
  document.getElementById('end-mode').classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');

  if (mode === 'wall') {
    document.getElementById('wall-mode').classList.add('bg-gray-800', 'text-white');
    document.getElementById('wall-mode').classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  } else if (mode === 'start') {
    document.getElementById('start-mode').classList.add('bg-green-500', 'text-white');
    document.getElementById('start-mode').classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  } else if (mode === 'end') {
    document.getElementById('end-mode').classList.add('bg-red-500', 'text-white');
    document.getElementById('end-mode').classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  }
  drawMode = mode;
}

function disableControls(state) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (state) {
            button.classList.add('button-disabled');
        } else {
            button.classList.remove('button-disabled');
        }
    });
}

window.onload = function() {
  grid = createGrid();
  startNode = grid[5][5];
  endNode = grid[15][15];
  drawGrid();
  
  let isMouseDown = false;
  document.getElementById('grid-container').addEventListener('mousedown', (e) => {
    isMouseDown = true;
  });
  document.getElementById('grid-container').addEventListener('mouseup', (e) => {
    isMouseDown = false;
  });
  document.getElementById('grid-container').addEventListener('mouseleave', (e) => {
    isMouseDown = false;
  });
  
  document.getElementById('grid-container').addEventListener('click', (e) => {
    if (isRunning || !e.target.classList.contains('cell')) return;
    const [_, row, col] = e.target.id.split('-');
    handleCellClick(parseInt(row), parseInt(col));
  });
  
  document.getElementById('grid-container').addEventListener('mousemove', (e) => {
    if (!isMouseDown || isRunning || drawMode !== 'wall' || !e.target.classList.contains('cell')) return;
    const [_, row, col] = e.target.id.split('-');
    handleCellClick(parseInt(row), parseInt(col));
  });

  function handleCellClick(row, col) {
    if (isRunning) return;
    const cell = grid[row][col];
    if (drawMode === 'wall' && !cell.isStart && !cell.isEnd) {
      cell.isWall = !cell.isWall;
    } else if (drawMode === 'start') {
      if (startNode) startNode.isStart = false;
      cell.isStart = true;
      cell.isWall = false;
      startNode = cell;
    } else if (drawMode === 'end') {
      if (endNode) endNode.isEnd = false;
      cell.isEnd = true;
      cell.isWall = false;
      endNode = cell;
    }
    updateCellClass(cell);
  }
  
  document.getElementById('start-button').addEventListener('click', animateAlgorithm);
  document.getElementById('clear-button').addEventListener('click', clearPath);
  document.getElementById('reset-button').addEventListener('click', resetGrid);
  document.getElementById('wall-mode').addEventListener('click', () => handleModeChange('wall'));
  document.getElementById('start-mode').addEventListener('click', () => handleModeChange('start'));
  document.getElementById('end-mode').addEventListener('click', () => handleModeChange('end'));
};