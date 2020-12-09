import React, { createRef } from 'react';

import { CanvasState } from './CanvasState';
import { Box } from './Box';

const colors = ['darkslategrey', 'bisque', 'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'lightgrey', 'black'];
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 300;

const mousePos = (canvas: HTMLCanvasElement, e: MouseEvent) => {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect(), // size of element
    scaleX = (canvas.width / dpr) / rect.width, // relationship bitmap vs. element for X
    scaleY = (canvas.height / dpr) / rect.height; // relationship bitmap vs. element for Y

  return {
    // scale mouse coordinates after they have been adjusted to be relative to element
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};

// TODO: Type props/state
class Canvas extends React.Component<any, {}> {
  private canvas: React.RefObject<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D | null;
  private canvasState: CanvasState;

  // TODO: Type this
  constructor(props: any) {
    super(props);

    this.canvas = createRef<HTMLCanvasElement>();
    this.ctx = null;
    this.canvasState = new CanvasState(700, 500);
  }

  componentDidMount() {
    this.ctx = this.setupCanvas(this.canvas.current!);
    this.canvasState.addContext(this.ctx);
    this.ctx.font = "10px Comic Sans MS";

    this.canvas.current!.style.position = 'relative';
    this.canvas.current!.style.border = '2px solid white';
    this.canvas.current!.style.borderRadius = '5px';

    // TODO: Type this:
    this.props.characters.forEach((each: any, i: number) => {
      const box = new Box(this.ctx!);
      const element = this.canvasState.addTable(box);
      element.changeColor = colors[i];
      element.name = each.name;
    })

    this.canvasState.render();


    this.canvas.current!.onmousedown = (e) => {
      const mousePosX = mousePos(this.canvas.current!, e).x;
      const mousePosY = mousePos(this.canvas.current!, e).y;

      // We have to loop backwards due to draw order, topmost things are last
      for (let i = this.canvasState.tables.length - 1; i >= 0; i--) {
        const table = this.canvasState.tables[i];

        if (table.inHandle(mousePosX, mousePosY)) {
          this.canvasState.dx = mousePosX;
          this.canvasState.dy = mousePosY;

          const xAdjustment = mousePosX - table.pos.x;
          const yAdjustment = mousePosY - table.pos.y;
          this.canvasState.mouseRelativePosX = xAdjustment;
          this.canvasState.mouseRelativePosY = yAdjustment;

          this.canvasState.resizing = table;

          this.addMoveListener();
          break;

        } else if (table.inBox(mousePosX, mousePosY)) {
          this.canvasState.dx = mousePosX;
          this.canvasState.dy = mousePosY;

          const xAdjustment = mousePosX - table.pos.x;
          const yAdjustment = mousePosY - table.pos.y;
          this.canvasState.mouseRelativePosX = xAdjustment;
          this.canvasState.mouseRelativePosY = yAdjustment;

          this.canvasState.dragging = table;

          // Move dragged table to the end of the array to ensure it moves to the top
          this.canvasState.tables.splice(i, 1);
          this.canvasState.tables.push(table);

          this.addMoveListener();
          break;
        }
      }
    };

    this.canvas.current!.onmouseup = _e => {
      this.removeMoveListener();
      this.canvasState.dragging = null;
      this.canvasState.resizing = null;
    };
  }

  setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(dpr * rect.right) - Math.round(dpr * rect.left);
    canvas.height = Math.round(dpr * rect.bottom) - Math.round(dpr * rect.top);
    const ctx = canvas.getContext('2d')!;

    ctx.scale(dpr, dpr);
    return ctx;
  }

  addMoveListener = () => {
    this.canvas.current!.onmousemove = (e) => {

      const posX = mousePos(this.canvas.current!, e).x;
      const posY = mousePos(this.canvas.current!, e).y;

      if (this.canvasState.dragging) {
        this.canvasState.dragging.x = posX - this.canvasState.mouseRelativePosX;
        this.canvasState.dragging.y = posY - this.canvasState.mouseRelativePosY;
      } else if (this.canvasState.resizing) {
        this.canvasState.resizing.width = posX - this.canvasState.resizing.pos.x;
        this.canvasState.resizing.height = posY - this.canvasState.resizing.pos.y;
      }
    };
  };

  removeMoveListener = () => (this.canvas.current!.onmousemove = null);

  render() {
    return (
      <div className="App-body">
        <div style={{ width: 200, height: '100%', background: 'grey', color: 'black' }}>Here is the sidebar</div>
        <canvas ref={this.canvas} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </div>
    );
  }
}

export default Canvas;
