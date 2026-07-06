export class DragDropEngine {
  constructor(svgElement, configurator, renderer) {
    this.svg = svgElement;
    this.configurator = configurator;
    this.renderer = renderer;
    this.activeDragId = null;
    this.dragStartX = 0;
    this.dragStartPos = 0;

    this.initEvents();
  }

  initEvents() {
    this.svg.addEventListener('mousedown', (e) => this.handleStart(e));
    this.svg.addEventListener('mousemove', (e) => this.handleMove(e));
    window.addEventListener('mouseup', () => this.handleEnd());

    this.svg.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });
    this.svg.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
    window.addEventListener('touchend', () => this.handleEnd());
  }

  handleStart(e) {
    const target = e.target;
    if (!target || !target.classList.contains('opening-rect')) return;

    e.preventDefault();
    const id = target.getAttribute('data-id');
    this.activeDragId = id;

    this.configurator.selectOpening(id);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    this.dragStartX = clientX;

    const wall = this.configurator.state.walls[this.configurator.state.activeFace];
    const opening = wall.getOpening(id);
    if (opening) {
      this.dragStartPos = opening.position;
    }
  }

  handleMove(e) {
    if (!this.activeDragId) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - this.dragStartX;

    const state = this.configurator.state;
    const wall = state.walls[state.activeFace];
    const maxWallLength = Math.max(state.width, state.length);
    const scaleX = (800 - 100) / maxWallLength;

    const deltaFeet = deltaX / scaleX;
    const nextPosition = this.dragStartPos + deltaFeet;

    this.configurator.moveOpeningInActiveWall(this.activeDragId, nextPosition);
  }

  handleEnd() {
    if (!this.activeDragId) return;
    this.activeDragId = null;
  }
}

