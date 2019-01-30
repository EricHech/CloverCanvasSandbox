import React from 'react';

type TState = {
  id: string | null,
  rotationIdx: number,
}

const rotations = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];

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

  state = {
    id: null,
    rotationIdx: 0,
  }

  mouseDown = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('in other place', this.shouldRotate);

    const { clientX, clientY } = e;

    this.prevX = clientX;
    this.prevY = clientY;

    this.initialX = clientX;
    this.initialY = clientY;

    document.onmousemove = this.mouseMove;
    document.onmouseup = this.mouseUp;

    this.dragging = true;
    // this.setState({ id: target.id });
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
    this.props.reorder(this.state.id);
    // this.setState({ id: null });
    this.dragging = false;

    if (this.shouldRotate) {
      console.log('rotating here ', this.shouldRotate);
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

    const elementPos = this.element.current!.getBoundingClientRect();

    // this.element.current!.style.width = (clientX - elementPos.left) + "px";
    // this.element.current!.style.height = (clientY - elementPos.top) + "px";

    this.width = (clientX - elementPos.left);
    this.height = (clientY - elementPos.top);

    this.element.current!.style.width = this.width + "px";
    this.element.current!.style.height = this.height + "px";

    this.shouldRotate = false;
  }

  rotate = () => {
    this.setState((prev) => ({
      rotationIdx: (prev.rotationIdx + 1) % rotations.length,
    }), () => {
      this.shouldRotate = false;
    });
  }

  setRotate = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    this.shouldRotate = true;
  }

  getStyleValues = (width: number, height: number, rotation: string) => {
    console.log('rotation:', rotation, 'shouldRotate:', this.shouldRotate);
    switch (rotation) {
      case '90deg':
      case '270deg':
        //swap width and height
        if(this.shouldRotate) {
          const temp = height;
          height = width;
          width = temp;
        }

      //fall through
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
    const { id, rotationIdx } = this.state;
    // const dragging = id === name;

    // console.log('before,', this.width, this.height, rotations[rotationIdx]);
    const { width, height, rotation } = this.getStyleValues(this.width, this.height, rotations[rotationIdx]);
    // console.log('after,', width, height, rotations[rotationIdx]);

    // TODO: On 90/270, the width/height swap but rotation idx doesn't
    // TODO: height/width swap on 90/270 when they shouldn't

    return (
      <div
        ref={this.element}
        id={name}
        onMouseDown={this.mouseDown}
        className='element'
        style={{ zIndex: this.dragging ? highestIdx : idx, width: `${width}px`, height: `${height}px` }}>
        <div className="table" onClick={this.setRotate} style={{ transform: `rotate(${rotation})` }}>
          {/* <div className="table-details" style={{transform: `rotate(-${rotations[rotation]})`}}>{name}</div> */}
          <div className="table-details" style={{ transform: `rotate(-${rotation})` }}>{name}</div>
        </div>
        <div onMouseDown={this.startResize} className="handle" />
      </div>
    );
  }
}

export default Box;
