import React, { RefObject } from 'react';

type TState = {
  id: string | null;
};

type TProps = {
  floorplan: React.RefObject<HTMLDivElement>;
  box: any; // TODO: properly type
  highestIdx: number;
  reorder: (id: string) => void;
};

const ROTATION_THRESHOLD = 5;

// w / h
const GRID = [150, 60];
const TABLE_MAX_SIZE = [200, 200];
const TABLE_MIN_SIZE = [50, 50];
type Degrees = '0deg' | '45deg' | '90deg' | '135deg' | '180deg' | '225deg' | '270deg' | '315deg';
type Degrees90 = '0deg' | '90deg' | '180deg' | '270deg';

const rotations: Degrees[] = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];
const rotations90: Degrees90[] = ['0deg', '90deg', '180deg', '270deg']; // no multiples of 90

// TODO: fix this to work at any canvas resolution
const snapToGrid = (value: number): number => Math.round(value / 10) * 10;

const createCSSEditFunc = (el: React.RefObject<HTMLDivElement>) => (attrib: any, value: any, unit: string = 'px') => (el.current!.style[attrib] = value + unit);

const calculateNewCenterPos = (canvasRect: ClientRect, parentPos: ClientRect) => {
  const currLeft = parentPos.left - canvasRect.left;
  const currTop = parentPos.top - canvasRect.top;

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
    const containerPos = this.element.current!.getBoundingClientRect() as DOMRect;

    // Save the intial mouse position // TODO:
    this.initialMouseX = clientX;
    this.initialMouseY = clientY;
    this.initialTableX = containerPos.x;
    this.initialTableY = containerPos.y;

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
    if (Math.abs(this.initialMouseX - clientX) > ROTATION_THRESHOLD || Math.abs(this.initialMouseY - clientY) > ROTATION_THRESHOLD) {
      this.shouldRotate = false;
    }

    // Calculate the mouse position change from the first click
    const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;
    this.finalX = clientX - this.initialMouseX + this.initialTableX - canvasRect.left;
    this.finalY = clientY - this.initialMouseY + this.initialTableY - canvasRect.top;

    // Reposition the element
    const containerPos = this.element.current!.getBoundingClientRect() as DOMRect;

    const moveTable = createCSSEditFunc(this.element);

    // Table pos, and keep sliding when out of bounds
    if (this.finalX < canvasRect.width - containerPos.width && this.finalY < canvasRect.height - containerPos.height && this.finalX > 0 && this.finalY > 0) {
      moveTable('top', snapToGrid(this.finalY));
      moveTable('left', snapToGrid(this.finalX));

      // Check if the new position won't end up outside the boundaries
    } else if (this.finalX < canvasRect.width - containerPos.width && this.finalX > 0) {
      moveTable('left', snapToGrid(this.finalX));
    } else if (this.finalY < canvasRect.height - containerPos.height && this.finalY > 0) {
      moveTable('top', snapToGrid(this.finalY));
    }

    // Mouse pos, sets table to edge if mouse escapes
    if (this.finalX >= canvasRect.width - containerPos.width) {
      moveTable('left', snapToGrid(canvasRect.width - containerPos.width));
    }
    // TODO: Comments
    if (this.finalY >= canvasRect.height - containerPos.height) {
      moveTable('top', snapToGrid(canvasRect.height - containerPos.height));
    }
    // TODO: Comments
    if (this.finalX <= 0) {
      moveTable('left', 0);
    }
    // TODO: Comments
    if (this.finalY <= 0) {
      moveTable('top', 0);
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

    const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;
    const containerPos = this.element.current!.getBoundingClientRect();

    const resizeTable = createCSSEditFunc(this.element);

    // Check if the new size would grow past the boundaries of the layout
    if (clientX <= canvasRect.width + canvasRect.left) {
      // Check if the new size would be greater than the max
      if (clientX - containerPos.left <= TABLE_MAX_SIZE[0]) {
        // Calculate the new width and height based on the difference between the top/left and the position of the mouse at the bottom/right
        resizeTable('width', snapToGrid(clientX - containerPos.left));
      } else {
        resizeTable('width', TABLE_MAX_SIZE[0]);
      }
    } else {
      // Grow until the table either hits the boundaries or its max size
      if (canvasRect.left + canvasRect.width - containerPos.left < TABLE_MAX_SIZE[0]) {
        resizeTable('width', snapToGrid(canvasRect.left + canvasRect.width - containerPos.left));
      } else {
        resizeTable('width', TABLE_MAX_SIZE[0]);
      }
    }

    // Check if the new size would grow past the boundaries of the layout
    if (clientY <= canvasRect.height + canvasRect.top) {
      // Check if the new size would be greater than the max
      if (clientY - containerPos.top <= TABLE_MAX_SIZE[1]) {
        // Calculate the new width and height based on the difference between the top/left and the position of the mouse at the bottom/right
        resizeTable('height', snapToGrid(clientY - containerPos.top));
      } else {
        resizeTable('height', TABLE_MAX_SIZE[1]);
      }
    } else {
      // Grow until the table either hits the boundaries or its max size
      if (canvasRect.top + canvasRect.height - containerPos.top < TABLE_MAX_SIZE[1]) {
        resizeTable('height', snapToGrid(canvasRect.top + canvasRect.height - containerPos.top));
      } else {
        resizeTable('height', TABLE_MAX_SIZE[1]);
      }
    }

    // Keep the tables above the minimum size
    if (clientX - containerPos.left <= TABLE_MIN_SIZE[0]) {
      resizeTable('width', TABLE_MIN_SIZE[0]);
    }

    if (clientY - containerPos.top <= TABLE_MIN_SIZE[1]) {
      resizeTable('height', TABLE_MIN_SIZE[1]);
    }
  };

  // TODO: Check if any helper functions can be used instead
  rotate = () => {
    // Circularly iterate through the list of rotation degrees
    this.rotationIdx = (this.rotationIdx + 1) % rotations.length;
    this.forceUpdate();
    this.shouldRotate = false;

    const containerPos = this.element.current!.getBoundingClientRect();
    const currentRotation = rotations[this.rotationIdx];

    const adjustContainer = createCSSEditFunc(this.element);
    const adjustTable = createCSSEditFunc(this.table);
    const adjustTableDetails = createCSSEditFunc(this.tableDetails);

    if (rotations90.includes(currentRotation as Degrees90)) {
      // Reset the css transforms because 90 degree rotations are handled by swapping the width and height
      adjustTable('transform', 'rotate(0deg)', '');
      adjustTableDetails('transform', 'rotate(0deg)', '');

      const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;

      // Reverse the width and height
      adjustContainer('width', containerPos.height);
      adjustContainer('height', containerPos.width);

      // Because the rotation is anchored to the top/left, we shift that position to visually maintain the same center point
      const { nextLeft, nextTop } = calculateNewCenterPos(canvasRect, containerPos);

      // Reposition parent element

      // TODO: Comment
      adjustContainer('top', snapToGrid(nextTop));
      adjustContainer('left', snapToGrid(nextLeft));
      const newContainerPos = this.element.current!.getBoundingClientRect();

      if (newContainerPos.top + newContainerPos.height > canvasRect.height + canvasRect.top) {
        adjustContainer('top', snapToGrid(canvasRect.height - newContainerPos.height));
      }
      if (newContainerPos.left + newContainerPos.width > canvasRect.width + canvasRect.left) {
        adjustContainer('left', snapToGrid(canvasRect.width - newContainerPos.width));
      }
      if (newContainerPos.top - canvasRect.top < 0) {
        adjustContainer('top', 0);
      }
      if (newContainerPos.left - canvasRect.left < 0) {
        adjustContainer('left', 0);
      }
    } else {
      // If you resize a table from a skyscraper shape to a bridge, the rotations need to invert as well.
      // If the table is diagonal, check the current orientation and rotate it the correct way.

      // Determine the correct rotation
      let clockwise = false;
      if (currentRotation === '45deg' || currentRotation === '225deg') {
        clockwise = true;
      }

      // Rotate the table
      adjustTable('transform', `rotate(${clockwise ? '' : '-'}${currentRotation})`, '');
      // The table details need to rotate opposite the table to stay aligned
      adjustTableDetails('transform', `rotate(${clockwise ? '-' : ''}${currentRotation})`, '');
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
