import React from 'react';
import Grid from './Grid';

// move to config file
const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'lightgrey', 'black', 'lightgreen'];
const HANDLE_SIZE = 10;
const CANVAS_WIDTH: number = 1500;
const CANVAS_HEIGHT: number = 600;
export const THROTTLE_SPEED: number = 50;

type size = {
  width: number,
  height: number,
}

const GRID: size = { width: 150, height: 60 };

export function throttle(fn: Function, delay: number) {
  let isCalled = false;

  return function (...args: any) {
    if (!isCalled) {
      fn(...args);
      isCalled = true;
      setTimeout(function () {
        isCalled = false;
      }, delay)
    }
  };
}

type TState = {
  GRID_SIZE_H: number;
  GRID_SIZE_W: number;
  characters: any[];
}

type TProps = {
  characters: any[];
}

class CanvasElements extends React.Component<TProps, TState> {
  private floorplan: React.RefObject<HTMLDivElement> = React.createRef();
  private canvas: React.RefObject<HTMLCanvasElement> = React.createRef();
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;

  state = {
    characters: this.props.characters,
    GRID_SIZE_H: 0,
    GRID_SIZE_W: 0,
  }

  handleResize = throttle(() => {
    this.ctx = this.setupCanvas(this.canvas.current!);

    this.drawGrid();
  }, THROTTLE_SPEED)

  componentDidMount() {
    this.ctx = this.setupCanvas(this.canvas.current!);

    this.drawGrid();

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  drawGrid = () => {
    const GRID_SIZE_H = (Math.trunc(this.height) / GRID.height);
    const GRID_SIZE_W = (Math.trunc(this.width) / GRID.width);

    this.ctx!.clearRect(0, 0, this.width, this.height);
    /*
      TODO:
      # We're geniuses and figured out that the only way it works is to draw infinitesimally small diagonals
      # <!–– (this.GRID_SIZE_H & this.state.GRID_SIZE_W) -->
    */
    for (let i = 0; i < GRID.height; i++) {
      this.ctx!.beginPath();
      this.ctx!.strokeStyle = "white";
      if (i % 10 === 0) this.ctx!.lineWidth = 0.5;
      else this.ctx!.lineWidth = 0.2;
      this.ctx!.moveTo(0, i * GRID_SIZE_W);
      this.ctx!.lineTo(this.width, i * GRID_SIZE_H);
      this.ctx!.stroke();
    }
    for (let i = 0; i < GRID.width; i++) {
      this.ctx!.beginPath();
      this.ctx!.strokeStyle = "white";
      if (i % 10 === 0) this.ctx!.lineWidth = 0.5;
      else this.ctx!.lineWidth = 0.2;
      this.ctx!.moveTo(i * GRID_SIZE_H, 0);
      this.ctx!.lineTo(i * GRID_SIZE_W, this.height);
      this.ctx!.stroke();
    }

    this.setState({ GRID_SIZE_H, GRID_SIZE_W });
  }

  setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    // assume the device pixel ratio is 1 if the browser doesn't specify it
    const devicePixelRatio = window.devicePixelRatio || 1;
    const context = canvas.getContext('2d')!;

    // TODO: rename vars
    const rect2 = this.floorplan.current!.getBoundingClientRect();

    // assure the floorplan is the correct aspect ratio
    // the height is 40% of the width aka 5:2
    this.floorplan.current!.style.height = rect2.width * 0.4 + 'px';

    const rect = this.floorplan.current!.getBoundingClientRect();

    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    this.width = rect.width;
    this.height = rect.height;

    context.scale(devicePixelRatio, devicePixelRatio);
    return context;
  }

  reorder = (id: string) => {
    // reorder the tables to ensure the one being dragged is on top of the stack
    const newArr: {}[] = [];
    let found: {} | null = null;
    this.setState(({ characters }) => {
      for (let i = 0; i < characters.length; i++) {
        if (characters[i].name === id) found = characters[i]
        else newArr.push(characters[i]);
      }
      if (found) newArr.push(found);

      return {
        characters: newArr,
      }
    });
  }

  render() {
    const toDisplay = this.state.characters.map((each: any, i: number) => {
      each.idx = i;
      each.color = colors[i];
      each.x = 12;
      each.y = 0;
      each.width = 10;
      each.height = 10;
      return each;
    });

    const test = toDisplay;

      return (
        <div className="App-body">
          <div ref={this.floorplan} className='floorplan'>
            <canvas className="actual-canvas" ref={this.canvas} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
            {
              (this.state.GRID_SIZE_H || this.state.GRID_SIZE_W) &&
              <Grid
                tables={test}
                floorplan={this.floorplan}
                reorder={this.reorder}
                canvasDimensions={{ width: this.width, height: this.height }}
                grid={{ width: this.state.GRID_SIZE_W, height: this.state.GRID_SIZE_H }}
              />
            }
          </div>
        </div>
      );
  }
}

export default CanvasElements;
