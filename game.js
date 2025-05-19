class GameOfLife {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 10;
        this.isRunning = true;
        this.isDrawing = false;
        this.isMoving = false;
        this.lastCell = null;
        this.lastMousePos = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1;
        this.currentMode = 'draw'; // 'draw' или 'move'
        this.isStepMode = false;

        // Устанавливаем размеры canvas
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Создаем сетку
        this.cols = Math.floor(this.canvas.width / this.cellSize);
        this.rows = Math.floor(this.canvas.height / this.cellSize);
        this.grid = this.createGrid();

        // Привязываем обработчики событий
        this.setupEventListeners();
        
        // Запускаем игровой цикл
        this.gameLoop();
    }

    createGrid() {
        return Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    }

    setupEventListeners() {
        let isMouseDown = false;

        // Обработка рисования и передвижения
        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            if (e.button === 0) { // Левая кнопка мыши
                if (this.currentMode === 'draw') {
                    this.isDrawing = true;
                    this.toggleCell(e);
                } else if (this.currentMode === 'move') {
                    this.isMoving = true;
                    this.lastMousePos = { x: e.clientX, y: e.clientY };
                }
            } else if (e.button === 2) { // Правая кнопка мыши
                this.currentMode = this.currentMode === 'draw' ? 'move' : 'draw';
                document.getElementById('mode').textContent = 
                    this.currentMode === 'draw' ? 'Режим: Рисование' : 'Режим: Передвижение';
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                if (this.isDrawing) {
                    this.toggleCell(e);
                } else if (this.isMoving) {
                    const dx = e.clientX - this.lastMousePos.x;
                    const dy = e.clientY - this.lastMousePos.y;
                    this.offsetX += dx;
                    this.offsetY += dy;
                    this.lastMousePos = { x: e.clientX, y: e.clientY };
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
            this.isDrawing = false;
            this.isMoving = false;
            this.lastCell = null;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isMouseDown = false;
            this.isDrawing = false;
            this.isMoving = false;
            this.lastCell = null;
        });

        // Масштабирование колесиком мыши
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.max(0.5, Math.min(5, this.zoom * zoomFactor));
        });

        // Кнопки управления
        document.getElementById('clear').addEventListener('click', () => {
            this.grid = this.createGrid();
        });

        document.getElementById('pause').addEventListener('click', () => {
            this.isRunning = !this.isRunning;
            document.getElementById('pause').textContent = this.isRunning ? 'Пауза' : 'Продолжить';
        });

        document.getElementById('mode').addEventListener('click', () => {
            this.currentMode = this.currentMode === 'draw' ? 'move' : 'draw';
            document.getElementById('mode').textContent = 
                this.currentMode === 'draw' ? 'Режим: Рисование' : 'Режим: Передвижение';
        });

        document.getElementById('step').addEventListener('click', () => {
            if (!this.isRunning) {
                this.update();
                this.draw();
            }
        });

        // Отключаем контекстное меню при правом клике
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    toggleCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left - this.offsetX) / (this.cellSize * this.zoom));
        const y = Math.floor((e.clientY - rect.top - this.offsetY) / (this.cellSize * this.zoom));

        if (this.lastCell && this.lastCell.x === x && this.lastCell.y === y) {
            return;
        }

        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            this.grid[y][x] = this.grid[y][x] ? 0 : 1;
            this.lastCell = { x, y };
        }
    }

    countNeighbors(x, y) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newX = (x + i + this.cols) % this.cols;
                const newY = (y + j + this.rows) % this.rows;
                count += this.grid[newY][newX];
            }
        }
        return count;
    }

    update() {
        const newGrid = this.createGrid();
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const neighbors = this.countNeighbors(x, y);
                const cell = this.grid[y][x];

                if (cell === 1 && (neighbors === 2 || neighbors === 3)) {
                    newGrid[y][x] = 1;
                } else if (cell === 0 && neighbors === 3) {
                    newGrid[y][x] = 1;
                }
            }
        }

        this.grid = newGrid;
    }

    countPopulation() {
        return this.grid.reduce((sum, row) => 
            sum + row.reduce((rowSum, cell) => rowSum + cell, 0), 0);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Обновляем отображение популяции
        document.getElementById('population').textContent = 
            `Живых клеток: ${this.countPopulation()}`;
        
        // Сохраняем текущее состояние контекста
        this.ctx.save();
        
        // Применяем смещение и масштаб
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Рисуем сетку
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1 / this.zoom;

        // Вертикальные линии
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }

        // Горизонтальные линии
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
        
        // Рисуем живые клетки
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }

        // Восстанавливаем состояние контекста
        this.ctx.restore();
    }

    async gameLoop() {
        while (true) {
            if (this.isRunning) {
                this.update();
            }
            this.draw();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

// Инициализация игры
window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    new GameOfLife(canvas);
}; 