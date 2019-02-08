import React from 'react';
import Box from './Box';

// move to config file
const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'lightgrey', 'black', 'lightgreen'];
const TABLE_BORDER_WIDTH = 4;
const HANDLE_SIZE = 10;
const CANVAS_WIDTH: number = 1500;
const CANVAS_HEIGHT: number = 600;
const GRID_SIZE = 10;

type TState = {
  characters: any[]
}

type TProps = {
  characters: any[]
}

class CanvasElements extends React.Component<TProps, TState> {
  // private characters: any[] = this.props.characters;
  private floorplan: React.RefObject<HTMLDivElement> = React.createRef();
  private canvas: React.RefObject<HTMLCanvasElement> = React.createRef();
  private ctx: CanvasRenderingContext2D | null = null;

  state = {
    characters: this.props.characters,
  }

  componentDidMount() {
    this.ctx = this.setupCanvas(this.canvas.current!, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < CANVAS_HEIGHT / GRID_SIZE; i++) {
      this.ctx!.beginPath();
      this.ctx!.strokeStyle = "white";
      if (i % GRID_SIZE === 0) this.ctx!.lineWidth = 0.5;
      else this.ctx!.lineWidth = .2;
      this.ctx!.moveTo(0, i * GRID_SIZE);
      this.ctx!.lineTo(CANVAS_WIDTH, i * GRID_SIZE);
      this.ctx!.stroke();
    }
    for (let i = 0; i < CANVAS_WIDTH / GRID_SIZE; i++) {
      this.ctx!.beginPath();
      this.ctx!.strokeStyle = "white";
      if (i % GRID_SIZE === 0) this.ctx!.lineWidth = 0.5;
      else this.ctx!.lineWidth = .2;
      this.ctx!.moveTo(i * GRID_SIZE, 0);
      this.ctx!.lineTo(i * GRID_SIZE, CANVAS_HEIGHT);
      this.ctx!.stroke();
    }

  }

  setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    // assume the device pixel ratio is 1 if the browser doesn't specify it
    const devicePixelRatio = window.devicePixelRatio || 1;
    const context = canvas.getContext('2d')!;

    // canvas
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

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
      return each;
    });

    const test = toDisplay;
    return (
      <div className="App-body">
        <div ref={this.floorplan} className='floorplan'>
          <canvas ref={this.canvas} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
          {test.map((each: any, i: number, arr: any[]) => (
            <Box key={each.name} floorplan={this.floorplan} box={each} highestIdx={arr.length} reorder={this.reorder} />
          ))}
        </div>
      </div>
    );
  }
}

export default CanvasElements;
