import React from 'react';

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

type size = {
  width: number,
  height: number,
}

const GRID: size = { width: 150, height: 60 };
const TABLE_MAX_SIZE: size = { width: 200, height: 200 };
const TABLE_MIN_SIZE: size = { width: 50, height: 50 };
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

const constrainDrag = (canvasRect: ClientRect, containerRect: ClientRect, relativeX: number, relativeY: number): { top: number, left: number } => {
  let top = 0;
  let left = 0;

  const relativeWidth = canvasRect.width - containerRect.width;
  const relativeHeight = canvasRect.height - containerRect.height;

  // Table pos, and keep sliding when out of bounds
  if (relativeX < relativeWidth && relativeY < relativeHeight && relativeX > 0 && relativeY > 0) {
    top = snapToGrid(relativeY);
    left = snapToGrid(relativeX);

    // Check if the new position won't end up outside the boundaries
  } else if (relativeX < relativeWidth && relativeX > 0) {
    left = snapToGrid(relativeX);

  } else if (relativeY < relativeHeight && relativeY > 0) {
    top = snapToGrid(relativeY);
  }

  // Mouse pos, sets table to edge if mouse escapes
  if (relativeX >= relativeWidth) {
    left = snapToGrid(relativeWidth);
  }
  if (relativeY >= relativeHeight) {
    top = snapToGrid(relativeHeight);
  }
  if (relativeX <= 0) {
    left = 0;
  }
  if (relativeY <= 0) {
    top = 0;
  }

  return { top, left };
}

const constrainResize = (canvasRect: ClientRect, containerRect: ClientRect, clientX: number, clientY: number): { height: number, width: number } => {
  let width = 0;
  let height = 0;

  const canvasWidthWithOffset = canvasRect.width + canvasRect.left;
  const containerResizeWidth = clientX - containerRect.left;
  const containerAndCanvasBorderDiffWidth = canvasWidthWithOffset - containerRect.left;
  
  const canvasHeightWithOffset = canvasRect.height + canvasRect.top;
  const containerResizeHeight = clientY - containerRect.top;
  const containerAndCanvasBorderDiffHeight = canvasHeightWithOffset - containerRect.top;

  // Check if the new size would grow past the boundaries of the layout
  if (clientX <= canvasWidthWithOffset) {
    // Check if the new size would be greater than the max
    if (containerResizeWidth <= TABLE_MAX_SIZE.width) {
      // Calculate the new width and height based on the difference between the top/left and the position of the mouse at the bottom/right
      width = snapToGrid(containerResizeWidth);
    } else {
      width = TABLE_MAX_SIZE.width;
    }
  } else {
    // Grow until the table either hits the boundaries or its max size
    if (containerAndCanvasBorderDiffWidth < TABLE_MAX_SIZE.width) {
      width = snapToGrid(containerAndCanvasBorderDiffWidth);
    } else {
      width = TABLE_MAX_SIZE.width;
    }
  }

  // Check if the new size would grow past the boundaries of the layout
  if (clientY <= canvasHeightWithOffset) {
    // Check if the new size would be greater than the max
    if (containerResizeHeight <= TABLE_MAX_SIZE.height) {
      // Calculate the new width and height based on the difference between the top/left and the position of the mouse at the bottom/right
      height = snapToGrid(containerResizeHeight);
    } else {
      height = TABLE_MAX_SIZE.height;
    }
  } else {
    // Grow until the table either hits the boundaries or its max size
    if (containerAndCanvasBorderDiffHeight < TABLE_MAX_SIZE.height) {
      height = snapToGrid(containerAndCanvasBorderDiffHeight);
    } else {
      height = TABLE_MAX_SIZE.height;
    }
  }

  // Keep the tables above the minimum size
  if (containerResizeWidth <= TABLE_MIN_SIZE.width) {
    width = TABLE_MIN_SIZE.width;
  }

  if (containerResizeHeight <= TABLE_MIN_SIZE.height) {
    height = TABLE_MIN_SIZE.height;
  }

  return { height, width };
}

const constrainRotate = (canvasRect: ClientRect, width: number, height: number, top: number, left: number): { top: number, left: number } => {
  if (top + height > canvasRect.height) {
    top = snapToGrid(canvasRect.height - height);
  } else if (top < 0) {
    top = 0;
  } 

  if (left + width > canvasRect.width) {
    left = snapToGrid(canvasRect.width - width);
  } else if (left < 0) {
    left = 0;
  }

  return { top, left };
}

class Box extends React.Component<TProps, TState> {
  private element: React.RefObject<HTMLDivElement> = React.createRef();
  private table: React.RefObject<HTMLDivElement> = React.createRef();
  private tableDetails: React.RefObject<HTMLDivElement> = React.createRef();
  private initialMouseX: number = 0;
  private initialMouseY: number = 0;
  private initialTableX: number = 0;
  private initialTableY: number = 0;
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

    const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;
    const containerRect = this.element.current!.getBoundingClientRect() as DOMRect;
    
    // Calculate the mouse position change from the first click
    const relativeX = clientX - this.initialMouseX + this.initialTableX - canvasRect.left;
    const relativeY = clientY - this.initialMouseY + this.initialTableY - canvasRect.top;

    
    const moveTable = createCSSEditFunc(this.element);
    
    const { top , left } = constrainDrag(canvasRect, containerRect, relativeX, relativeY);
    
    // Reposition the element
    moveTable('top', top);
    moveTable('left', left);
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
    const containerRect = this.element.current!.getBoundingClientRect();

    const resizeTable = createCSSEditFunc(this.element);

    const { height, width } = constrainResize(canvasRect, containerRect, clientX, clientY);

    resizeTable('height', height);
    resizeTable('width', width);
  };

  // TODO: Check if any helper functions can be used instead
  rotate = () => {
    // Circularly iterate through the list of rotation degrees
    this.rotationIdx = (this.rotationIdx + 1) % rotations.length;
    this.forceUpdate();
    this.shouldRotate = false;

    const containerRect = this.element.current!.getBoundingClientRect();
    const currentRotation = rotations[this.rotationIdx];

    const adjustContainer = createCSSEditFunc(this.element);
    const adjustTable = createCSSEditFunc(this.table);
    const adjustTableDetails = createCSSEditFunc(this.tableDetails);

    if (rotations90.includes(currentRotation as Degrees90)) {
      // Reset the css transforms because 90 degree rotations are handled by swapping the width and height
      adjustTable('transform', 'rotate(0deg)', '');
      adjustTableDetails('transform', 'rotate(0deg)', '');

      const canvasRect = this.props.floorplan.current!.getBoundingClientRect();

      // Reverse the width and height
      adjustContainer('width', containerRect.height);
      adjustContainer('height', containerRect.width);

      // Because the rotation is anchored to the top/left, we shift that position to visually maintain the same center point
      const { nextLeft, nextTop } = calculateNewCenterPos(canvasRect, containerRect);

      // Reposition parent element
      const nextWidth = containerRect.height;
      const nextHeight = containerRect.width;

      const { top, left } = constrainRotate(canvasRect, nextWidth, nextHeight, nextTop, nextLeft);

      adjustContainer('top', top);
      adjustContainer('left', left);

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
      <div ref={this.element} id={name} onMouseDown={this.mouseDown} className="element" style={{ zIndex: this.dragging ? highestIdx : idx }}>
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
