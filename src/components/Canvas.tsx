import React from 'react';

interface IState {
  dragging: string;
}

interface box {
  pos: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  render: () => void;
}

const mousePos = (canvas: any, e: any) => {
  const rect = canvas.getBoundingClientRect(), // size of element
    scaleX = canvas.width / rect.width, // relationship bitmap vs. element for X
    scaleY = canvas.height / rect.height; // relationship bitmap vs. element for Y

  return {
    // scale mouse coordinates after they have been adjusted to be relative to element
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};

class Box {
  public pos: { x: number; y: number };
  public size: { width: number; height: number };
  public color: string;
  public ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.pos = { x: 10, y: 10 };
    this.size = { width: 10, height: 10 };
    this.color = 'lightgrey';
    this.ctx = ctx;
  }

  public set x(x: number) {
    this.pos.x = x;
    this.render();
  }

  public set y(y: number) {
    this.pos.y = y;
    this.render();
  }

  public set width(width: number) {
    this.size.width = width;
    this.render();
  }

  public set height(height: number) {
    this.size.height = height;
    this.render();
  }

  public render = () => {
    const { pos, size, color } = this;

    this.ctx.clearRect(0, 0, 500, 700);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(pos.x, pos.y, size.width, size.height);
  };
}

class Canvas extends React.Component<{}, IState> {
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private element: box | null;

  constructor(props: any) {
    super(props);

    this.canvas = null;
    this.ctx = null;
    this.element = null;
    this.state = {
      dragging: '',
    };
  }

  componentDidMount() {
    this.canvas = this.refs.canvas as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.element = new Box(this.ctx!);
    this.element.x = 200;
    this.element.width = 125;
    this.element.height = 50;
    this.element.render();

    this.canvas.onmousedown = (e) => {
      const { pos, size } = this.element!;
      const boxPosX = pos.x;
      const boxPosY = pos.y;
      const boxWidth = size.width;
      const boxHeight = size.height;

      const mousePosX = mousePos(this.canvas, e).x;
      const mousePosY = mousePos(this.canvas, e).y;

      if (mousePosX >= boxPosX && mousePosX <= boxPosX + boxWidth && mousePosY >= boxPosY && mousePosY <= boxPosY + boxHeight) {
        this.setState({ dragging: 'element' });
        this.addMoveListener();
      }
    };

    this.canvas!.onmouseup = (e) => {
      this.setState({ dragging: '' });
      this.removeMoveListener();
    };
  }

  addMoveListener = () => {
    this.canvas!.onmousemove = (e) => {
      const { dragging } = this.state;
      if (dragging === 'element') {
        const posX = mousePos(this.canvas, e).x;
        const posY = mousePos(this.canvas, e).y;

        // TODO: Why doesn't this work?
        // TODO: Consider adding more logic to mousePos func
        // const xAdjustment = posX - this.element!.pos.x;
        // const yAdjustment = posY - this.element!.pos.y;

        // this.element!.x = posX + xAdjustment;
        // this.element!.y = posY + yAdjustment;

        this.element!.x = posX;
        this.element!.y = posY;
      }
    };
  };

  removeMoveListener = () => (this.canvas!.onmousemove = null);

  render() {
    return (
      <div className="App-body">
        Here is some text.
        <canvas ref="canvas" width={500} height={700} />
      </div>
    );
  }
}

export default Canvas;
