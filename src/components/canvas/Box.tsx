const TABLE_BORDER_WIDTH = 4;
const HANDLE_SIZE = 10;

export class Box {
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

    // this.ctx.fillStyle = colors[Math.round(Math.random() * 10)];
    this.ctx.fillStyle = 'black';
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
