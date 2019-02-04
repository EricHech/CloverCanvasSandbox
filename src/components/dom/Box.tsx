import React from 'react';

type TState = {
  id: string | null;
};

type TProps = {
  canvasRef: React.RefObject<HTMLDivElement>;
  box: any; // TODO: properly type
  highestIdx: number;
  reorder: (id: string) => void;
};

const ROTATION_THRESHOLD = 5;

// w / h
const GRID = [150, 60];
const MAX_SIZE = [200, 200];
const MIN_SIZE = [50, 50];
type Degrees = '0deg' | '45deg' | '90deg' | '135deg' | '180deg' | '225deg' | '270deg' | '315deg';
type Degrees90 = '0deg' | '90deg' | '180deg' | '270deg';

const rotations: Degrees[] = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];
const rotations90: Degrees90[] = ['0deg', '90deg', '180deg', '270deg']; // no multiples of 90

const calculateNewCenterPos = (canvasPos: ClientRect, parentPos: ClientRect) => {
  const currLeft = parentPos.left - canvasPos.left;
  const currTop = parentPos.top - canvasPos.top;

  const nextLeft = currLeft + parentPos.width / 2 - parentPos.height / 2;
  const nextTop = currTop + parentPos.height / 2 - parentPos.width / 2;

  return { nextLeft, nextTop };
};

class Box extends React.Component<TProps, TState> {
  private element = React.createRef<HTMLDivElement>();
  private table = React.createRef<HTMLDivElement>();
  private tableDetails = React.createRef<HTMLDivElement>();
  private initialMouseX: number = 0;
  private initialMouseY: number = 0;
  private initialTableX: number = 0;
  private initialTableY: number = 0;
  private finalX: number = 0;
  private finalY: number = 0;
  private prevX: number = 0;
  private prevY: number = 0;
  private height: number = 100;
  private width: number = 100;
  private shouldRotate: boolean = false;
  private dragging: boolean = false;
  private rotationIdx: number = 0;

  setRotate = () => {
    this.shouldRotate = true;
  };

  mouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;
    const tablePos = this.element.current!.getBoundingClientRect() as DOMRect;

    // Save the intial mouse position // TODO:
    this.initialMouseX = clientX;
    this.initialMouseY = clientY;
    this.initialTableX = tablePos.x;
    this.initialTableY = tablePos.y;

    // Bring the selected element to the foreground
    this.props.reorder(this.props.box.name);

    // Initialize dragging
    this.startDrag(clientX, clientY);

    // Initialize rotation
    this.setRotate();
  };

  mouseUp = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    document.onmouseup = null;
    document.onmousemove = null;
    this.dragging = false;

    if (this.shouldRotate) {
      this.rotate();
    }
  };

  startDrag = (clientX: number, clientY: number) => {
    // Store the mouse position for use in the next iteration
    this.prevX = clientX;
    this.prevY = clientY;

    // Set the listener on the document as well so that the object is never lost
    document.onmousemove = this.continueDrag;
    document.onmouseup = this.mouseUp;

    this.dragging = true;
  };

  continueDrag = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;

    // The threshold for the rotation to stop if the table is moved
    // Rotate it if it's just nudged a little
    if (Math.abs(this.initialMouseX - clientX) > ROTATION_THRESHOLD
    || Math.abs(this.initialMouseY - clientY) > ROTATION_THRESHOLD) {
      this.shouldRotate = false;
    }

    // Calculate the mouse position change from the first click
    // const canvasPos = this.props.canvasRef.current!.getBoundingClientRect();
    const canvasRect = this.props.canvasRef.current!.getBoundingClientRect() as DOMRect;
    this.finalX = clientX - this.initialMouseX + this.initialTableX - canvasRect.left;
    this.finalY = clientY - this.initialMouseY + this.initialTableY - canvasRect.top;

    // Reposition the element
    const tableRect = this.element.current!.getBoundingClientRect() as DOMRect;

    let top = this.finalY + 'px';
    let left = this.finalX + 'px';

    // Table pos, and keep sliding when out of bounds
    if (this.finalX < canvasRect.width - tableRect.width&& this.finalY < canvasRect.height - tableRect.height && this.finalX > 0 && this.finalY > 0) {
      this.element.current!.style.top = top;
      this.element.current!.style.left = left;
    } else if (this.finalX < canvasRect.width - tableRect.width && this.finalX > 0) {
      this.element.current!.style.left = left;
    } else if (this.finalY < canvasRect.height - tableRect.height && this.finalY > 0) {
      this.element.current!.style.top = top;
    }

    // Mouse pos, sets table to edge if mouse escapes
    if (this.finalX >= canvasRect.width + canvasRect.left) {
      this.element.current!.style.left = canvasRect.width - tableRect.width + 'px';
    }
    if (this.finalY >= canvasRect.height + canvasRect.top) {
      this.element.current!.style.top = canvasRect.height - tableRect.height + 'px';
    }
    if (this.finalX <= 0) {
      this.element.current!.style.left = '0px';
    }
    if (this.finalY <= 0) {
      this.element.current!.style.top = '0px';
    }
  };

  startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    document.onmousemove = this.continueResize;
    document.onmouseup = this.mouseUp;
  };

  continueResize = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;

    const parentPos = this.element.current!.getBoundingClientRect();

    // Calculate the new width and height based on the difference between the top/left and the position of the mouse at the bottom/right
    if(clientX - parentPos.left <= MAX_SIZE[0]) {
      this.element.current!.style.width = clientX - parentPos.left + 'px';
    } else {
      this.element.current!.style.width = MAX_SIZE[0] + 'px';
    }
      
    if (clientY - parentPos.top <= MAX_SIZE[1]) {
      this.element.current!.style.height = clientY - parentPos.top + 'px';
    } else {
      this.element.current!.style.height = MAX_SIZE[1] + 'px';
    }

    if(clientX - parentPos.left <= MIN_SIZE[0]) {
      this.element.current!.style.width = MIN_SIZE[0] + 'px';
    }
      
    if (clientY - parentPos.top <= MIN_SIZE[1]) {
      this.element.current!.style.height = MIN_SIZE[1] + 'px';
    }
  };

  rotate = () => {
    // Circularly iterate through the list of rotation degrees
    this.rotationIdx = (this.rotationIdx + 1) % rotations.length;
    this.forceUpdate(); // When commented out, `rotations[this.rotationIdx]` in render is one behind the actual position
    this.shouldRotate = false;

    const parentPos = this.element.current!.getBoundingClientRect();
    const parentStyle = this.element.current!.style;
    const tableStyle = this.table.current!.style;
    const tableDetailsStyle = this.tableDetails.current!.style;
    const currentRotation = rotations[this.rotationIdx];

    if (rotations90.includes(currentRotation as Degrees90)) {
      // Reset the css transforms because 90 degree rotations are handled by swapping the width and height
      tableStyle.transform = 'rotate(0deg)';
      tableDetailsStyle.transform = 'rotate(0deg)';

      const canvasPos = this.props.canvasRef.current!.getBoundingClientRect();

      // Reverse the width and height
      parentStyle.width = parentPos.height + 'px';
      parentStyle.height = parentPos.width + 'px';

      // Because the rotation is anchored to the top/left, we shift that position to visually maintain the same center point
      const { nextLeft, nextTop } = calculateNewCenterPos(canvasPos, parentPos);

      // Reposition parent element
      parentStyle.left = nextLeft + 'px';
      parentStyle.top = nextTop + 'px';
    } else {
      // If you resize a table from a skyscraper shape to a bridge, the rotations need to invert as well.
      // If the table is diagonal, check the current orientation and rotate it the correct way.

      // Determine the correct rotation
      let clockwise = false;
      if (currentRotation === '45deg' || currentRotation === '225deg') {
        clockwise = true;
      }

      // Rotate the table
      tableStyle.transform = `rotate(${clockwise ? '' : '-'}${currentRotation})`;
      // The table details need to rotate opposite the table to stay aligned
      tableDetailsStyle.transform = `rotate(${clockwise ? '-' : ''}${currentRotation})`;
    }
  };

  render() {
    const { name, idx } = this.props.box;
    const { highestIdx } = this.props;

    const rotation = rotations[this.rotationIdx];
    return (
      <div ref={this.element} id={name} onMouseDown={this.mouseDown} className="element" style={{ zIndex: this.dragging ? highestIdx : idx, width: `${this.width}px`, height: `${this.height}px` }}>
        <div ref={this.table} className="table">
          <div ref={this.tableDetails} className="table-details">
            {name}
            <br />
            {rotation}
          </div>
        </div>
        <div onMouseDown={this.startResize} className="handle" style={{ bottom: '-10px', right: '-10px' }} />
      </div>
    );
  }
}

export default Box;
