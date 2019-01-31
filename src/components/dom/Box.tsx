import React from 'react';

type TState = {
  id: string | null,
}

const rotations = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];
const rotations90 = ['0deg', '90deg', '180deg', '270deg']; // no multiples of 90
const posRef: any = {
  '0deg': {
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '45deg': {
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '90deg': {
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '135deg': {
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '180deg': {
    handleFixedPos: {
      top: '10px',
      left: '10px'
    }
  },
  '225deg': {
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '270deg': {
    handleFixedPos: {
      bottom: '-10px',
      left: '-10px'
    }
  },
  '315deg': {
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  }
}

// TODO: Type props/state
class Box extends React.Component<any, TState> {
  private element = React.createRef<HTMLDivElement>();
  private x: number = 0;
  private y: number = 0;
  private finalX: number = 0;
  private finalY: number = 0;
  private prevX: number = 0;
  private prevY: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;
  private height: number = 100;
  private width: number = 100;
  private shouldRotate: boolean = false;
  private dragging: boolean = false;
  private rotationIdx: number = 0;
  private table: React.RefObject<HTMLDivElement> = React.createRef();
  private tableDetails: React.RefObject<HTMLDivElement> = React.createRef();

  mouseDown = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;

    this.prevX = clientX;
    this.prevY = clientY;

    this.initialX = clientX;
    this.initialY = clientY;

    document.onmousemove = this.mouseMove;
    document.onmouseup = this.mouseUp;

    this.dragging = true;

    // this.props.reorder(this.props.box.name);

    this.setRotate();
  }

  mouseMove = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;

    // threshold for the rotation to stop if the table is moved
    // keep rotating it if its just nudged a little
    if (Math.abs(this.initialX - clientX) > 20 || Math.abs(this.initialY - clientY) > 20) {
      this.shouldRotate = false;
    }

    this.finalX = this.prevX - clientX;
    this.finalY = this.prevY - clientY;
    this.prevX = clientX;
    this.prevY = clientY;
    this.x = (this.element.current!.offsetLeft - this.finalX);
    this.y = (this.element.current!.offsetTop - this.finalY);


    this.element.current!.style.left = this.x + "px";
    this.element.current!.style.top = this.y + "px";
  }

  mouseUp = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    document.onmouseup = null;
    document.onmousemove = null;
    this.dragging = false;

    if (this.shouldRotate) {
      this.rotate();
    }
  }

  startResize = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const { target, clientX, clientY } = e;

    this.prevX = clientX;
    this.prevY = clientY;

    document.onmousemove = this.continueResize;
    document.onmouseup = this.mouseUp;
  }

  continueResize = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;

    this.finalX = this.prevX - clientX;
    this.finalY = this.prevY - clientY;
    this.prevX = clientX;
    this.prevY = clientY;

    const parentPos = this.element.current!.getBoundingClientRect();

    this.element.current!.style.width = (clientX - parentPos.left) + "px";
    this.element.current!.style.height = (clientY - parentPos.top) + "px";


    this.shouldRotate = false;
  }

  rotate = () => {
    this.rotationIdx = (this.rotationIdx + 1) % rotations.length;
    this.forceUpdate();
    this.shouldRotate = false;

    const parentPos = this.element.current!.getBoundingClientRect();
    const parentStyle = this.element.current!.style;
    const tableStyle = this.table.current!.style;
    const tableDetailsStyle = this.tableDetails.current!.style;
    const currRotation = rotations[this.rotationIdx];


    if (rotations90.includes(currRotation)) {
      tableStyle.transform = 'rotate(0deg)';
      tableDetailsStyle.transform = 'rotate(0deg)';
      // ─────────────────────────────────────────────────────────────────
      // debugger;
      const canvasPos = this.props.canvasRef.current.getBoundingClientRect();
      const currLeft = parentPos.left - canvasPos.left;
      const currTop = parentPos.top - canvasPos.top;

      const currWidth = parentPos.width;
      const currHeight = parentPos.height;

      const nextLeft = currLeft + (currWidth / 2) - (currHeight / 2);
      const nextTop = currTop + (currHeight / 2) - (currWidth / 2);

      parentStyle.width = currHeight + "px";
      parentStyle.height = currWidth + "px";
      parentStyle.left = nextLeft + "px";
      parentStyle.top = nextTop + "px";

      // ─────────────────────────────────────────────────────────────────
    } else {
        if(currRotation === '45deg' ||
        currRotation === '225deg') {
         tableStyle.transform = `rotate(${currRotation})`;
         tableDetailsStyle.transform = `rotate(-${currRotation})`;
       } else {
         tableStyle.transform = `rotate(-${currRotation})`;
         tableDetailsStyle.transform = `rotate(${currRotation})`;
       }
    }
  }

  setRotate = () => {
    this.shouldRotate = true;
  }

  getStyleValues = (width: number, height: number, rotation: string) => {
    switch (rotation) {
      case '90deg':
      case '270deg':
        rotation = '90deg';
        break;
      case '0deg':
      case '180deg':
        rotation = '0deg';
        break;

      case '45deg':
      case '225deg':
        rotation = '45deg';
        break;

      case '135deg':
      case '315deg':
        rotation = '315deg';
        break;

      default:
        break;
    }

    return { width, height, rotation };
  }

  render() {
    const { name, idx } = this.props.box;
    const { highestIdx } = this.props;

    const { width, height, rotation } = this.getStyleValues(this.width, this.height, rotations[this.rotationIdx]);

    return (
      <div
        ref={this.element}
        id={name}
        onMouseDown={this.mouseDown}
        className='element'
        style={{ zIndex: this.dragging ? highestIdx : idx, width: `${width}px`, height: `${height}px` }}>
        <div ref={this.table} className="table">
          <div ref={this.tableDetails} className="table-details">{name}<br />{rotation}</div>
        </div>
        <div onMouseDown={this.startResize} className="handle" style={posRef[rotation].handleFixedPos} />
      </div>
    );
  }
}

export default Box;