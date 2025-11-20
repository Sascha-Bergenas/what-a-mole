import { Mole } from "./mole.js";
// Centrera eventhantering via delegering på brädet (se vecko-materialet omaddEventListener & bubbling).
// TODO-markeringar lämnar utrymme för egna lösningar.
export class Game {
  constructor({ boardEl, scoreEl, timeEl, missesEl }) {
    this.boardEl = boardEl;
    this.scoreEl = scoreEl;
    this.timeEl = timeEl;
    this.missesEl = missesEl;
    this.gridSize = 3;
    this.duration = 60; // sekunder
    this.state = {
      score: 0,
      misses: 0,
      timeLeft: this.duration,
      running: false,
    };
    this._tickId = null;
    this._spawnId = null;
    this._activeMoles = new Set();
    this.handleBoardClick = this.handleBoardClick.bind(this);
  }
  init() {
    this.createGrid(this.gridSize);
    this.updateHud();
    this.boardEl.addEventListener("click", this.handleBoardClick);
    this.boardEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") this.handleBoardClick(e);
    });
    // Eventdelegering: en lyssnare hanterar alla barn-noder.
  }
  createGrid(size = 3) {
    this.boardEl.innerHTML = "";
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.setAttribute("aria-label", `Hål ${i + 1}`);
      this.boardEl.appendChild(cell);
    }
  }
  start() {
    if (this.state.running) return;
    this.state.running = true;
    this.state.score = 0;
    this.state.misses = 0;
    this.state.timeLeft = this.duration;
    this.updateHud();

    this._tickId = setInterval(() => {
      this.state.timeLeft--;
      this.updateHud();
      if (this.state.timeLeft === 0) {
        this.state.running = false;
        clearInterval(this._tickId);
        clearTimeout(this._spawnId);
      }
    }, 1000);

    const spawnLoop = () => {
      if (!this.state.running) return;
      this.spawnMole();
      const delay = 1000 + Math.random() * 800;
      this._spawnId = setTimeout(spawnLoop, delay);
    };
    spawnLoop();
    // TODO: implementera spelloop
    // 1) setInterval: nedräkning av timeLeft
    // 2) setInterval eller rekursiva setTimeout: spawn av mullvadar (varieraTTL/frekvens över tid)
  }
  reset() {
    this.state.running = false;

    clearInterval(this._tickId);
    clearTimeout(this._spawnId);

    this._activeMoles.forEach((mole) => mole.disappear());
    this._activeMoles.clear();

    this.state.score = 0;
    this.state.misses = 0;
    this.state.timeLeft = this.duration;
    this.updateHud();
    // TODO: städa timers, ta bort aktiva mullvadar, nollställ state och UI
    // Tips: loopa this._activeMoles och kalla .disappear()
  }
  spawnMole() {
    const emptyCells = [
      ...this.boardEl.querySelectorAll(".cell:not(.has-mole)"),
    ];
    if (emptyCells.length === 0) return;

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    const ttl = 1000 + Math.random() * 500;
    const mole = new Mole(cell, ttl);

    this._activeMoles.add(mole);
    mole.appear(() => {
      this._activeMoles.delete(mole);
      if (this.state.running) {
        this.state.misses++;
        this.updateHud();
      }
    });
    // TODO: välj slumpmässig tom cell och mounta en ny Mole
    // const emptyCells = [...this.boardEl.querySelectorAll('.cell:not(.has-mole)')];
    // const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    // const mole = new Mole(cell, /* ttl i ms */);
    // this._activeMoles.add(mole);
    // mole.appear(() => { this._activeMoles.delete(mole); /* miss om utgångutan träff? */ });
  }
  handleBoardClick(e) {
    const cell = e.target.closest(".cell");
    if (!cell || !this.state.running) return;

    const mole = [...this._activeMoles].find((m) => m.cellEl === cell);
    if (mole?.isVisible()) {
      mole.disappear();
      this._activeMoles.delete(mole);
      this.state.score++;
    } else {
      this.state.misses++;
    }
    this.updateHud();

    // TODO: om cellen innehåller en aktiv mullvad => poäng; annars öka missar
    // Uppdatera HUD varje gång.
  }
  updateHud() {
    this.scoreEl.textContent = `Poäng: ${this.state.score}`;
    this.timeEl.textContent = `Tid: ${this.state.timeLeft}`;
    this.missesEl.textContent = `Missar: ${this.state.misses}`;
  }
}
