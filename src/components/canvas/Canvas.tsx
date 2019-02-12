import React from 'react';

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'lightgrey', 'black', 'lightgreen'];
const TABLE_BORDER_WIDTH = 4;
const HANDLE_SIZE = 10;
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

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

class CanvasState {
  public tables: Box[];
  public dragging: Box | null;
  public resizing: Box | null;
  public selected: Box | null;
  public height: number;
  public width: number;
  public ctx: CanvasRenderingContext2D | null;
  public mouseRelativePosX: number;
  public mouseRelativePosY: number;
  public dx: number;
  public dy: number;

  constructor(width: number, height: number) {
    this.ctx = null;
    this.tables = [];
    this.dragging = null;
    this.resizing = null;
    this.selected = null;
    this.width = width;
    this.height = height;

    this.mouseRelativePosX = 0;
    this.mouseRelativePosY = 0;

    this.dx = 0;
    this.dy = 0;
  }

  addContext = (ctx: CanvasRenderingContext2D) => {
    this.ctx = ctx;
  }

  addTable = (table: Box): Box => {
    this.tables.push(table);
    return table;
  }

  render = () => {
    this.ctx!.clearRect(0, 0, this.width, this.height);
    this.tables.forEach((table) => table.render());

    requestAnimationFrame(() => this.render());
  }
}

class Box {
  public pos: { x: number; y: number };
  public size: { width: number; height: number };
  public color: string;
  public ctx: CanvasRenderingContext2D;
  public name: string;

  constructor(ctx: CanvasRenderingContext2D) {
    this.pos = { x: 100, y: 100 };
    this.size = { width: 100, height: 100 };
    this.color = 'lightgrey';
    this.ctx = ctx;

    this.name = '';

  }

  public set changeColor(color: string) {
    this.color = color;
  }

  public set x(x: number) {
    this.pos.x = x;
  }

  public set y(y: number) {
    this.pos.y = y;
  }

  public set width(width: number) {
    this.size.width = width;
  }

  public set height(height: number) {
    this.size.height = height;
  }

  public set dx(dx: number) {
    this.dx = dx;
  }

  public set dy(dy: number) {
    this.dy = dy;
  }

  public render = () => {
    const { pos, size, color } = this;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(pos.x, pos.y, size.width, size.height);

    this.ctx.fillStyle = colors[Math.round(Math.random() * 10)];
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.name, pos.x + (size.width / 2), pos.y + (size.height / 2));

    this.ctx.beginPath();
    this.ctx.lineWidth = TABLE_BORDER_WIDTH;

    this.ctx.strokeStyle = "black";
    this.ctx.rect(pos.x, pos.y, size.width, size.height);
    this.ctx.stroke();

    this.ctx.fillStyle = "white";
    this.ctx.fillRect(pos.x + size.width - (HANDLE_SIZE / 2), pos.y + size.height - (HANDLE_SIZE / 2), HANDLE_SIZE, HANDLE_SIZE);
  };

  public inBox = (x: number, y: number): boolean => {
    if (x > this.pos.x + (TABLE_BORDER_WIDTH / 2) && x < this.pos.x + this.size.width - (TABLE_BORDER_WIDTH / 2)
      && y > this.pos.y + (TABLE_BORDER_WIDTH / 2) && y < this.pos.y + this.size.height - (TABLE_BORDER_WIDTH / 2)) {
      return true;
    }
    return false;
  }
  public inHandle = (x: number, y: number): boolean => {
    const handlePointZeroX = this.pos.x + this.size.width - (HANDLE_SIZE / 2);
    const handlePointZeroY = this.pos.y + this.size.height - (HANDLE_SIZE / 2);

    if (x > handlePointZeroX
     && x < handlePointZeroX + HANDLE_SIZE
     && y > handlePointZeroY
     && y < handlePointZeroY + HANDLE_SIZE) {
      return true;
    }
    return false;
  }
}

// TODO: Type props/state
class Canvas extends React.Component<any, {}> {
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private canvasState: CanvasState;

  // TODO: Type this
  constructor(props: any) {
    super(props);

    this.canvas = null;
    this.ctx = null;
    this.canvasState = new CanvasState(700, 500);
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

  componentDidMount() {
    this.canvas = this.refs.canvas as HTMLCanvasElement;
    this.ctx = this.setupCanvas(this.canvas);
    this.canvasState.addContext(this.ctx);
    this.ctx.font = "10px Comic Sans MS";



    const elements = [];
    // TODO: Type this:
    this.props.characters.forEach((each: any, i: number) => {
      const element = this.canvasState.addTable(new Box(this.ctx!));
      element.x = each.height * 1.5;
      element.y = each.height * 1.5;
      element.changeColor = colors[i];
      element.name = each.name;
      elements.push(element);
    })

    this.canvasState.render();


    this.canvas.onmousedown = (e) => {
      const mousePosX = mousePos(this.canvas!, e).x;
      const mousePosY = mousePos(this.canvas!, e).y;

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

    this.canvas!.onmouseup = (e) => {
      this.removeMoveListener();
      this.canvasState.dragging = null;
      this.canvasState.resizing = null;
    };
  }

  addMoveListener = () => {
    this.canvas!.onmousemove = (e) => {

      const posX = mousePos(this.canvas!, e).x;
      const posY = mousePos(this.canvas!, e).y;

      if (this.canvasState.dragging) {
        this.canvasState.dragging!.x = posX - this.canvasState.mouseRelativePosX;
        this.canvasState.dragging!.y = posY - this.canvasState.mouseRelativePosY;
      } else if (this.canvasState.resizing) {
        this.canvasState.resizing.width = posX - this.canvasState.resizing.pos.x;
        this.canvasState.resizing.height = posY - this.canvasState.resizing.pos.y;
      }
    };
  };

  removeMoveListener = () => (this.canvas!.onmousemove = null);

  render() {
    return (
      <div className="App-body">
        Here is some text.
        <canvas ref="canvas" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </div>
    );
  }
}

export default Canvas;
