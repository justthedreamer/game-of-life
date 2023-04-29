class Theme {
    deadCell;
    aliveCell;
    grid;
    statistics;
    constructor(deadCell, aliveCell, grid, statistics) {
        this.deadCell = deadCell;
        this.aliveCell = aliveCell;
        this.grid = grid;
        this.statistics = statistics;
    }
    async changeTheme() {
        const html = document.getElementById("html");
        const targetTheme = html.getAttribute("data-theme") === "rosepinemoon"
            ? "rosepinedawn"
            : "rosepinemoon";
        const statistics = document.getElementById("statistics");
        if (targetTheme === "rosepinedawn") {
            currentTheme = lightTheme;
        }
        if (targetTheme === "rosepinemoon") {
            currentTheme = darkTheme;
        }
        statistics.style.color = currentTheme.statistics;
        previousGen = [];
        currentGen = [];
        await canvas.draw();
        await canvas.update(GetCurrentGeneration());
        html.setAttribute("data-theme", targetTheme);
    }
}
class Canvas {
    board;
    boardSize;
    context;
    height;
    cellSize;
    lineWidth;
    constructor(board, boardSize, context, height, cellSize, lineWidth) {
        this.board = board;
        this.boardSize = boardSize;
        this.context = context;
        this.height = height;
        this.cellSize = cellSize;
        this.lineWidth = lineWidth;
    }
    async initializeBoard() {
        InitBoard(canvas.boardSize, canvas.boardSize);
        currentGen = GetCurrentGeneration();
        previousGen = currentGen;
        await this.update(currentGen);
    }
    async draw() {
        this.context.clearRect(0, 0, this.board.width, this.board.height);
        this.context.fillStyle = currentTheme.deadCell;
        this.context.fillRect(0, 0, this.board.width, this.board.height);
        this.context.strokeStyle = currentTheme.grid;
        this.context.lineWidth = this.lineWidth;
        for (let x = 0; x < this.boardSize; x++) {
            for (let y = 0; y < this.boardSize; y++) {
                this.context.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }
    async update(cells) {
        const boardSize = canvas.boardSize;
        canvas.context.fillStyle = currentTheme.aliveCell;
        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                const isAliveCurrentGen = getCellFromArray(x, y, cells);
                const isAlivePreviousGen = getCellFromArray(x, y, previousGen);
                if (!isAliveCurrentGen) {
                    continue;
                }
                if (isAliveCurrentGen === isAlivePreviousGen) {
                    continue;
                }
                this.drawCell(x, y);
            }
        }
        canvas.context.fillStyle = currentTheme.deadCell;
        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                const isAliveCurrentGen = getCellFromArray(x, y, cells);
                const isAlivePreviousGen = getCellFromArray(x, y, previousGen);
                if (isAliveCurrentGen) {
                    continue;
                }
                if (isAliveCurrentGen === isAlivePreviousGen) {
                    continue;
                }
                this.drawCell(x, y);
            }
        }
    }
    async nextGeneration() {
        previousGen = currentGen;
        currentGen = GetNextGeneration();
        updateGenerationCount();
        await this.update(currentGen);
    }
    async clear() {
        stop();
        resetStartStopButton();
        generation.innerText = "Generation: 0";
        ClearBoard();
        previousGen = [];
        currentGen = GetCurrentGeneration();
        await canvas.update(currentGen);
    }
    async randomize() {
        generation.innerText = "Generation: 0";
        RandomizeBoard();
        previousGen = currentGen;
        currentGen = GetCurrentGeneration();
        await canvas.update(currentGen);
    }
    changeCellState(evt) {
        let pos = getMousePos(evt);
        let isAlive = ChangeCellState(map2DArrayToIndex(pos.x, pos.y));
        this.context.fillStyle = isAlive
            ? currentTheme.aliveCell
            : currentTheme.deadCell;
        currentGen[map2DArrayToIndex(pos.x, pos.y)] = isAlive;
        this.drawCell(pos.x, pos.y);
    }
    drawCell(x, y) {
        this.context.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        this.context.lineWidth = canvas.lineWidth;
        this.context.strokeStyle = currentTheme.grid;
        this.context.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
    }
    async changeBoardSize() {
        let newBoardSize;
        switch (this.value) {
            case "1":
                newBoardSize = 50;
                break;
            case "2":
                newBoardSize = 100;
                break;
            case "3":
                newBoardSize = 150;
                break;
            case "4":
                newBoardSize = 225;
                break;
            default:
                newBoardSize = 150;
        }
        canvas = createCanvas(newBoardSize);
        await canvas.clear();
        await canvas.initializeBoard();
        await canvas.draw();
    }
}
const darkTheme = new Theme("#2A273F", "#C4A7E7", "#232136", "#C4A7E7");
const lightTheme = new Theme("#FFFAF3", "#907AA9", "#FAF4ED", "#907AA9");
let currentTheme = darkTheme;
let canvas = createCanvas(150);
window.onload = () => canvas.draw();
const generation = document.getElementById("generation");
let requestID;
let currentGen;
let previousGen;
function createCanvas(boardSize) {
    const board = document.getElementById("board");
    if (board === null) {
        throw new Error("Could not access element: board");
    }
    const context = board.getContext("2d", { alpha: false });
    if (context === null) {
        throw new Error("Could not access element: context");
    }
    const height = board.offsetHeight;
    const cellSize = height / boardSize;
    const lineWidth = Math.round((cellSize / 10) * 1e2) / 1e2;
    return new Canvas(board, boardSize, context, height, cellSize, lineWidth);
}
function loadWasm(path) {
    const go = new Go();
    return new Promise((resolve, reject) => {
        WebAssembly.instantiateStreaming(fetch(path), go.importObject)
            .then(async (result) => {
            go.run(result.instance);
            resolve(result.instance);
        })
            .catch((error) => {
            reject(error);
        });
    });
}
loadWasm("./../wasm/main.wasm")
    .then(async (_wasm) => {
    populateRules(InitRules());
    canvas.board.onclick = (ev) => canvas.changeCellState(ev);
    canvas.board.addEventListener("mousemove", displayCoordinates);
    const startStop = document.getElementById("start-stop");
    if (startStop === null) {
        throw new Error(genericErrorMessage("start-stop"));
    }
    startStop.onclick = () => start(0);
    startStop.addEventListener("click", swapStartStopButton);
    const random = document.getElementById("random");
    if (random === null) {
        throw new Error(genericErrorMessage("random"));
    }
    random.onclick = () => canvas.randomize();
    const reset = document.getElementById("reset");
    if (reset === null) {
        throw new Error(genericErrorMessage("reset"));
    }
    reset.onclick = () => canvas.clear();
    const nextGen = document.getElementById("next-gen");
    if (nextGen === null) {
        throw new Error(genericErrorMessage("next-gen"));
    }
    nextGen.onclick = () => canvas.nextGeneration();
    const customRuleInput = document.getElementById("custom-rule-input");
    if (customRuleInput === null) {
        throw new Error(genericErrorMessage("custom-rule-input"));
    }
    customRuleInput.oninput = () => applyCustomRules();
    const theme = document.getElementById("theme");
    if (theme === null) {
        throw new Error(genericErrorMessage("theme"));
    }
    theme.onclick = () => currentTheme.changeTheme();
    const boardSize = document.getElementById("board-size");
    if (boardSize === null) {
        throw new Error(genericErrorMessage("board-size"));
    }
    boardSize.addEventListener("change", canvas.changeBoardSize);
    await canvas.initializeBoard();
})
    .catch((error) => {
    console.log("ouch", error);
});
function populateRules(rules) {
    const ruleSelect = document.getElementById("rules");
    if (ruleSelect === null) {
        throw new Error(genericErrorMessage("rules"));
    }
    for (let i = 0; i < rules.length; i++) {
        const el = document.createElement("option");
        el.textContent = rules[i];
        el.value = rules[i];
        if (rules[i] === "Conway's Life") {
            el.selected = true;
        }
        ruleSelect.appendChild(el);
    }
    ruleSelect.addEventListener("change", setRule);
}
function setRule() {
    const ruleString = document.getElementById("rule-as-string");
    if (ruleString === null) {
        throw new Error(genericErrorMessage("rule-as-string"));
    }
    const customRuleInput = document.getElementById("custom-rule-input");
    if (customRuleInput === null) {
        throw new Error(genericErrorMessage("custom-rule-input"));
    }
    if (this.value === "CUSTOM") {
        console.log(this.innerText);
        customRuleInput.classList.remove("hidden");
        return;
    }
    if (!customRuleInput.classList.contains("hidden")) {
        customRuleInput.classList.add("hidden");
    }
    ruleString.innerText = SetRule(this.value);
}
function getMousePos(evt) {
    let rect = canvas.board.getBoundingClientRect();
    return {
        x: Math.floor((evt.clientX - rect.left) / canvas.cellSize),
        y: Math.floor((evt.clientY - rect.top) / canvas.cellSize),
    };
}
function getCellFromArray(column, row, cells) {
    return cells[row * canvas.boardSize + column];
}
function map2DArrayToIndex(column, row) {
    return row * canvas.boardSize + column;
}
async function start(timestamp) {
    calculateFPS(timestamp);
    document.getElementById("next-gen").disabled = true;
    previousGen = currentGen;
    currentGen = GetNextGeneration();
    updateGenerationCount();
    canvas.update(currentGen).then(() => {
        requestID = window.requestAnimationFrame(start);
    });
}
function stop() {
    window.cancelAnimationFrame(requestID);
    document.getElementById("next-gen").disabled = false;
}
function applyCustomRules() {
    const ruleString = document.getElementById("rule-as-string");
    if (ruleString === null) {
        throw new Error(genericErrorMessage("rule-as-string"));
    }
    const s = document.getElementById("s");
    const b = document.getElementById("b");
    ruleString.innerText = ApplyCustomRules(s.value, b.value);
}
function updateGenerationCount() {
    const generationText = generation.innerText.split(":");
    const nextGenerationNumber = parseInt(generationText[1]) + 1;
    generation.innerText = "Generation: " + nextGenerationNumber.toString();
}
function displayCoordinates(evt) {
    const pos = getMousePos(evt);
    const coordinates = document.getElementById("coordinates");
    if (coordinates === null) {
        throw new Error(genericErrorMessage("coordinates"));
    }
    coordinates.innerText = "X: " + pos.x + " | Y: " + pos.y;
}
let secondsPassed;
let oldTimeStamp = 0;
let fps;
let FPSBuffer = [];
let i = 0;
let averageFPS = 0;
function calculateFPS(timestamp) {
    const fpsDisplay = document.getElementById("fps");
    if (fpsDisplay === null) {
        throw new Error(genericErrorMessage("fps"));
    }
    fpsDisplay.innerText = "FPS: " + averageFPS.toFixed(2);
    secondsPassed = (timestamp - oldTimeStamp) / 1000;
    oldTimeStamp = timestamp;
    fps = Math.round(1 / secondsPassed);
    FPSBuffer[i] = fps;
    i++;
    if (i >= 5) {
        i = 0;
        averageFPS = FPSBuffer.reduce((a, b) => a + b, 0) / FPSBuffer.length;
        if (isNaN(averageFPS)) {
            averageFPS = 0;
        }
        FPSBuffer = [];
    }
}
function genericErrorMessage(elementName) {
    return "Could not access element: " + elementName;
}
function swapStartStopButton() {
    const button = document.getElementById("start-stop");
    if (button === null) {
        throw new Error(genericErrorMessage("start-stop"));
    }
    if (button.classList.contains("btn-success")) {
        button.classList.remove("btn-success");
        button.classList.add("btn-error");
        button.innerText = "STOP";
        button.onclick = () => stop();
    }
    else if (button.classList.contains("btn-error")) {
        button.classList.remove("btn-error");
        button.classList.add("btn-success");
        button.innerText = "START";
        button.onclick = () => start(0);
    }
}
function resetStartStopButton() {
    const button = document.getElementById("start-stop");
    if (button === null) {
        throw new Error(genericErrorMessage("start-stop"));
    }
    if (button.classList.contains("btn-error")) {
        button.classList.remove("btn-error");
        button.classList.add("btn-success");
        button.innerText = "START";
        button.onclick = () => start(0);
    }
}
export {};
