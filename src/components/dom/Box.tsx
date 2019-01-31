import React from 'react';

type TState = {
  id: string | null,
  // rotationIdx: number,
}

// const rotations = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];
const rotations = ['0deg', '90deg', '180deg', '270deg']; // no multiples of 90
const posRef: any = {
  '0deg': {
    parentTransform: {
      transform: 'rotate(0deg)',
    },
    childTransform: 'rotate(0deg)',
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '45deg': {
    parentTransform: {
      transform: 'rotate(0deg)',
    },
    childTransform: 'rotate(45deg)',
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '90deg': {
    parentTransform: {
      transform: 'rotate(90deg)',
    },
    childTransform: 'rotate(0deg)',
    handleFixedPos: {
      top: '-10px',
      right: '-10px'
    }
  },
  '135deg': {
    parentTransform: {
      transform: 'rotate(0deg)',
    },
    childTransform: 'rotate(135deg)',
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '180deg': {
    parentTransform: {
      transform: 'rotate(180deg)',
    },
    childTransform: 'rotate(0deg)',
    handleFixedPos: {
      top: '10px',
      left: '10px'
    }
  },
  '225deg': {
    parentTransform: {
      transform: 'rotate(0deg)',
    },
    childTransform: 'rotate(225deg)',
    handleFixedPos: {
      bottom: '-10px',
      right: '-10px'
    }
  },
  '270deg': {
    parentTransform: {
      transform: 'rotate(270deg)',
    },
    childTransform: 'rotate(0deg)',
    handleFixedPos: {
      bottom: '-10px',
      left: '-10px'
    }
  },
  '315deg': {
    parentTransform: {
      transform: 'rotate(0deg)',
    },
    childTransform: 'rotate(315deg)',
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

  mouseDown = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('mousedown', this.shouldRotate);

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

    console.log('this.shouldRotate', this.shouldRotate)

    if (this.shouldRotate) {
      // console.log('rotating here ', this.shouldRotate);
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

    // if (rotations[this.rotationIdx] === '90deg' || rotations[this.rotationIdx] === '270deg') {
    //   this.element.current!.style.width = (clientX - elementPos.left) + "px";
    //   this.element.current!.style.height = (clientY - elementPos.top) + "px";
    // } else {
    this.element.current!.style.width = (clientX - elementPos.left) + "px";
    this.element.current!.style.height = (clientY - elementPos.top) + "px";
    // }

    // this.width = (clientX - elementPos.left);
    // this.height = (clientY - elementPos.top);

    // if (rotations[this.rotationIdx] === '90deg' || rotations[this.rotationIdx] === '270deg') {
    //   this.element.current!.style.width = this.height + "px";
    //   this.element.current!.style.height = this.width + "px";
    // } else {
    //   this.element.current!.style.width = this.width + "px";
    //   this.element.current!.style.height = this.height + "px";
    // }


    this.shouldRotate = false;
  }

  rotate = () => {
    // this.setState((prev) => ({
    //   rotationIdx: (prev.rotationIdx + 1) % rotations.length,
    // }), () => {
    //   this.shouldRotate = false;
    // });

    // manually forcing react to update here so we can change it later without a rerender
    // console.log(rotations[this.rotationIdx]);
    // this.rotationIdx = (this.rotationIdx + 1) % rotations.length;
    // this.forceUpdate();
    // this.shouldRotate = false;
    // console.log(rotations[this.rotationIdx]);


    // ─────────────────────────────────────────────────────────────────
    debugger;
    const elementPos = this.element.current!.getBoundingClientRect();
    const currLeft = elementPos.left;
    const currTop = elementPos.top;

    const currWidth = elementPos.width;
    const currHeight = elementPos.height;

    const nextLeft = currLeft + (currWidth / 2) - (currHeight / 2);
    const nextTop = currTop + (currHeight / 2) - (currWidth / 2);

    this.element.current!.style.width = currHeight + "px";
    this.element.current!.style.height = currWidth + "px";
    this.element.current!.style.left = nextLeft + "px";
    this.element.current!.style.top = nextTop + "px";

    // ─────────────────────────────────────────────────────────────────
  }

  setRotate = () => {
    console.log('should set rotate')
    this.shouldRotate = true;
  }

  getStyleValues = (width: number, height: number, rotation: string) => {
    // console.log('rotation:', rotation, 'shouldRotate:', this.shouldRotate);'
    // let newTop;
    // let newLeft;
    // if (this.element.current) {
    //   newTop = this.element.current!.style.top;
    //   newLeft = this.element.current!.style.left;
    // }

    // IN SWITCH
    // const top = +this.element.current!.style.top!.slice(0, this.element.current!.style.top!.length - 2);
    // const left = +this.element.current!.style.left!.slice(0, this.element.current!.style.left!.length - 2);
    // const prevCenterH: number = top + tempH;
    // const prevCenterW: number = left + tempW;

    // const newCenterH: number = top + height;
    // const newCenterW: number = left + width;

    // const toMoveX: number = newCenterH - prevCenterH;
    // const toMoveY: number = newCenterW - prevCenterW;

    // newTop = (top - toMoveY) + "px";
    // newLeft = (left - toMoveX) + "px";

    // const rotations = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];

    switch (rotation) {
      case '90deg':
      case '270deg':
        //swap width and height
        rotation = '90deg';

        //   if (this.shouldRotate) {
        //     const tempH = height;
        //     const tempW = width;
        //     height = width;
        //     width = tempH;
        //   }

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
    console.log({ ridx: this.rotationIdx, rotation });

    // TODO: On 90/270, the width/height swap but rotation idx doesn't
    // TODO: height/width swap on 90/270 when they shouldn't
    return (
      <div
        ref={this.element}
        id={name}
        onMouseDown={this.mouseDown}
        className='element'
        style={{ zIndex: this.dragging ? highestIdx : idx, width: `${width}px`, height: `${height}px`, /* transform: posRef[rotation].parentTransform.transform */ }}>
        <div className="table" /* style={{ transform: posRef[rotation].childTransform }} */>
          {/* <div className="table-details" style={{transform: `rotate(-${rotations[rotation]})`}}>{name}</div> */}
          <div className="table-details" style={{ transform: `rotate(-${rotation})` }}>{name}<br />{rotation}</div>
        </div>
        <div onMouseDown={this.startResize} className="handle" style={posRef[rotation].handleFixedPos} />
      </div>
    );
  }
}

export default Box;