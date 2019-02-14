import React from 'react';

function isTouchEvent(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent): e is React.TouchEvent<HTMLDivElement> {
  return 'touches' in e;
}

function getClientPos(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent): { clientX: number, clientY: number } {
  const { clientX, clientY } = isTouchEvent(e) ? e.touches[0] : (e as any);
  return { clientX, clientY };
}

type TProps = {
  floorplan: React.RefObject<HTMLDivElement>;
  box: any; // TODO: properly type
  highestIdx: number;
  reorder: (id: string) => void;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  pixToGrid: (x: number, y: number) => { x: number; y: number };
  gridToPix: (x: number, y: number) => { x: number; y: number };
  snapToGridW: (val: number) => number;
  snapToGridH: (val: number) => number;
};

const ROTATION_THRESHOLD = 5;

type size = {
  width: number;
  height: number;
};

// move to config file
const TABLE_MAX_SIZE: size = { width: 20, height: 20 };
const TABLE_MIN_SIZE: size = { width: 5, height: 5 };
type Degrees = '0deg' | '45deg' | '90deg' | '135deg' | '180deg' | '225deg' | '270deg' | '315deg';
type Degrees90 = '0deg' | '90deg' | '180deg' | '270deg';

const rotations: Degrees[] = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];
const rotations90: Degrees90[] = ['0deg', '90deg', '180deg', '270deg']; // no multiples of 90

const createCSSEditFunc = (el: React.RefObject<HTMLDivElement>) => (attrib: any, value: any, unit: string = 'px') => (el.current!.style[attrib] = value + unit);

const calculateNewCenterPos = (canvasRect: ClientRect, parentPos: ClientRect) => {
  const currLeft = parentPos.left - canvasRect.left;
  const currTop = parentPos.top - canvasRect.top;

  const nextLeft = currLeft + parentPos.width / 2 - parentPos.height / 2;
  const nextTop = currTop + parentPos.height / 2 - parentPos.width / 2;

  return { nextLeft, nextTop };
};

const constrainDrag = (canvasRect: ClientRect, containerRect: ClientRect, relativeX: number, relativeY: number): { top: number; left: number } => {
  let top = 0;
  let left = 0;

  const relativeWidth = canvasRect.width - containerRect.width;
  const relativeHeight = canvasRect.height - containerRect.height;

  // Table pos, and keep sliding when out of bounds
  if (relativeX < relativeWidth && relativeY < relativeHeight && relativeX > 0 && relativeY > 0) {
    top = relativeY;
    left = relativeX;

    // Check if the new position won't end up outside the boundaries
  } else if (relativeX < relativeWidth && relativeX > 0) {
    left = relativeX;
  } else if (relativeY < relativeHeight && relativeY > 0) {
    top = relativeY;
  }

  // Mouse pos, sets table to edge if mouse escapes
  if (relativeX >= relativeWidth) {
    left = relativeWidth;
  }
  if (relativeY >= relativeHeight) {
    top = relativeHeight;
  }
  if (relativeX <= 0) {
    left = 0;
  }
  if (relativeY <= 0) {
    top = 0;
  }

  return { top, left };
};

const constrainResize = (canvasRect: ClientRect, containerRect: ClientRect, clientX: number, clientY: number, gridToPix: any): { height: number; width: number } => {
  let width = 0;
  let height = 0;

  const canvasWidthWithOffset = canvasRect.width + canvasRect.left;
  const containerResizeWidth = clientX - containerRect.left;
  const containerAndCanvasBorderDiffWidth = canvasWidthWithOffset - containerRect.left;

  const canvasHeightWithOffset = canvasRect.height + canvasRect.top;
  const containerResizeHeight = clientY - containerRect.top;
  const containerAndCanvasBorderDiffHeight = canvasHeightWithOffset - containerRect.top;

  const { x: maxWidth, y: maxHeight } = gridToPix(TABLE_MAX_SIZE.width, TABLE_MAX_SIZE.height);
  const { x: minWidth, y: minHeight } = gridToPix(TABLE_MIN_SIZE.width, TABLE_MIN_SIZE.height);
  // Check if the new size would grow past the boundaries of the layout
  if (clientX <= canvasWidthWithOffset) {
    // Check if the new size would be greater than the max
    if (containerResizeWidth <= maxWidth) {
      // Calculate the new width and height based on the difference between the top/left and the position of the mouse at the bottom/right
      width = containerResizeWidth;
    } else {
      width = maxWidth;
    }
  } else {
    // Grow until the table either hits the boundaries or its max size
    if (containerAndCanvasBorderDiffWidth < maxWidth) {
      width = containerAndCanvasBorderDiffWidth;
    } else {
      width = maxWidth;
    }
  }

  // Check if the new size would grow past the boundaries of the layout
  if (clientY <= canvasHeightWithOffset) {
    // Check if the new size would be greater than the max
    if (containerResizeHeight <= maxHeight) {
      // Calculate the new width and height based on the difference between the top/left and the position of the mouse at the bottom/right
      height = containerResizeHeight;
    } else {
      height = maxHeight;
    }
  } else {
    // Grow until the table either hits the boundaries or its max size
    if (containerAndCanvasBorderDiffHeight < maxHeight) {
      height = containerAndCanvasBorderDiffHeight;
    } else {
      height = maxHeight;
    }
  }

  // Keep the tables above the minimum size
  if (containerResizeWidth <= minWidth) {
    width = minWidth;
  }

  if (containerResizeHeight <= minHeight) {
    height = minHeight;
  }

  return { height, width };
};

const constrainRotate = (canvasRect: ClientRect, width: number, height: number, top: number, left: number): { top: number; left: number } => {
  if (top + height > canvasRect.height) {
    top = canvasRect.height - height;
  } else if (top < 0) {
    top = 0;
  }

  if (left + width > canvasRect.width) {
    left = canvasRect.width - width;
  } else if (left < 0) {
    left = 0;
  }

  return { top, left };
};

class Box extends React.Component<TProps> {
  private container: React.RefObject<HTMLDivElement> = React.createRef();
  private table: React.RefObject<HTMLDivElement> = React.createRef();
  private tableDetails: React.RefObject<HTMLDivElement> = React.createRef();
  private handle: React.RefObject<HTMLDivElement> = React.createRef();
  private initialMouseX: number = 0;
  private initialMouseY: number = 0;
  private initialTableX: number = 0;
  private initialTableY: number = 0;
  private shouldRotate: boolean = false;
  private dragging: boolean = false;
  private rotationIdx: number = 0;
  private tableOriginalRotationPos: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };
  private tableNewRotationPos: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };
  private tablePosOnGrid: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };
  private tableSizeOnGrid: {
    width: number;
    height: number;
  } = { width: 0, height: 0 };

  componentDidMount() {
    const editTable = createCSSEditFunc(this.container);

    editTable('top', this.props.position.y);
    editTable('left', this.props.position.x);

    editTable('height', this.props.size.height);
    editTable('width', this.props.size.width);

    const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;
    const containerRect = this.container.current!.getBoundingClientRect() as DOMRect;

    this.tableOriginalRotationPos = this.props.pixToGrid(containerRect.left - canvasRect.left, containerRect.top - canvasRect.top);
    const { nextLeft, nextTop } = calculateNewCenterPos(canvasRect, containerRect);
    this.tableNewRotationPos = this.props.pixToGrid(nextLeft, nextTop);

    this.tablePosOnGrid = this.props.pixToGrid(this.props.position.x, this.props.position.y);
    const size = this.props.pixToGrid(this.props.size.width, this.props.size.height);
    this.tableSizeOnGrid = { width: size.x, height: size.y };

    window.addEventListener('resize', this.handleWindowResize());
    this.container.current!.addEventListener('mousedown', this.mouseDown);
    this.container.current!.addEventListener('touchstart', this.mouseDown, { passive: false });

    this.handle.current!.addEventListener('mousedown', this.startResize);
    this.handle.current!.addEventListener('touchstart', this.startResize, { passive: false });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize());
  }

  handleWindowResize = () => {
    let timeout: number;

    return () => {
      if (timeout) cancelAnimationFrame(timeout);

      timeout = requestAnimationFrame(() => {
        const containerRect = this.container.current!.getBoundingClientRect();

        const editTable = createCSSEditFunc(this.container);

        const { x, y } = this.props.gridToPix(this.tablePosOnGrid.x, this.tablePosOnGrid.y);
        const { x: width, y: height } = this.props.gridToPix(this.tableSizeOnGrid.width, this.tableSizeOnGrid.height);

        editTable('top', y);
        editTable('left', x);
        editTable('width', width);
        editTable('height', height);
      });
    };
  };

  setRotate = () => {
    this.shouldRotate = true;
  };

  mouseDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = getClientPos(e);

    // const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;
    const containerRect = this.container.current!.getBoundingClientRect() as DOMRect;

    // const { nextLeft, nextTop } = calculateNewCenterPos(canvasRect, containerRect);
    // this.tableNewRotationPos = { x: nextLeft, y: nextTop };

    // this.tableOriginalRotationPos = { x: containerRect.left, y: containerRect.top };

    // Save the intial mouse position
    this.initialMouseX = clientX;
    this.initialMouseY = clientY;
    this.initialTableX = containerRect.x;
    this.initialTableY = containerRect.y;

    // Bring the selected element to the foreground
    this.props.reorder(this.props.box.name);

    // Initialize dragging
    this.startDrag(clientX, clientY);

    // Initialize rotation
    this.setRotate();
  };

  mouseUp = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    document.removeEventListener('touchend', this.mouseUp);
    document.removeEventListener('mouseup', this.mouseUp);

    document.removeEventListener('touchmove', this.continueDrag);
    document.removeEventListener('mousemove', this.continueDrag);

    document.removeEventListener('touchmove', this.continueResize);
    document.removeEventListener('mousemove', this.continueResize);

    this.dragging = false;

    if (this.shouldRotate) {
      this.rotate();
    } else {
      const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;
      const containerRect = this.container.current!.getBoundingClientRect() as DOMRect;

      this.tableOriginalRotationPos = this.props.pixToGrid(containerRect.left - canvasRect.left, containerRect.top - canvasRect.top);
      const { nextLeft, nextTop } = calculateNewCenterPos(canvasRect, containerRect);
      this.tableNewRotationPos = this.props.pixToGrid(nextLeft, nextTop);
    }
  };

  startDrag = (clientX: number, clientY: number) => {
    // Set the listener on the document as well so that the object is never lost
    document.addEventListener('mousemove', this.continueDrag);
    document.addEventListener('mouseup', this.mouseUp);

    document.addEventListener('touchmove', this.continueDrag, { passive: false });
    document.addEventListener('touchend', this.mouseUp, { passive: false });

    this.dragging = true;
  };

  continueDrag = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = getClientPos(e);

    // The threshold for the rotation to stop if the table is moved
    // Rotate it if it's just nudged a little
    if (Math.abs(this.initialMouseX - clientX) > ROTATION_THRESHOLD || Math.abs(this.initialMouseY - clientY) > ROTATION_THRESHOLD) {
      this.shouldRotate = false;
    }

    const canvasRect = this.props.floorplan.current!.getBoundingClientRect();
    const containerRect = this.container.current!.getBoundingClientRect();

    // Calculate the mouse position change from the first click
    const relativeX = clientX - this.initialMouseX + this.initialTableX - canvasRect.left;
    const relativeY = clientY - this.initialMouseY + this.initialTableY - canvasRect.top;

    const moveTable = createCSSEditFunc(this.container);

    const { top, left } = constrainDrag(canvasRect, containerRect, relativeX, relativeY);

    // Reposition the element
    const newTop = this.props.snapToGridH(top);
    const newLeft = this.props.snapToGridW(left);

    moveTable('top', newTop);
    moveTable('left', newLeft);

    this.tablePosOnGrid = this.props.pixToGrid(newLeft, newTop);
  };

  startResize = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    document.addEventListener('mousemove', this.continueResize);
    document.addEventListener('mouseup', this.mouseUp);

    document.addEventListener('touchmove', this.continueResize, { passive: false });
    document.addEventListener('touchend', this.mouseUp, { passive: false });
  };

  continueResize = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = getClientPos(e as MouseEvent);

    const canvasRect = this.props.floorplan.current!.getBoundingClientRect();
    const containerRect = this.container.current!.getBoundingClientRect();

    const resizeTable = createCSSEditFunc(this.container);

    const { height, width } = constrainResize(canvasRect, containerRect, clientX, clientY, this.props.gridToPix);

    const newWidth = this.props.snapToGridW(width);
    const newHeight = this.props.snapToGridH(height);

    resizeTable('height', newHeight);
    resizeTable('width', newWidth);

    const { x: _width, y: _height } = this.props.pixToGrid(newWidth, newHeight);
    this.tableSizeOnGrid = { width: _width, height: _height };
  };

  // TODO: Check if any helper functions can be used instead
  rotate = () => {
    // Circularly iterate through the list of rotation degrees
    this.rotationIdx = (this.rotationIdx + 1) % rotations.length;
    this.forceUpdate();
    this.shouldRotate = false;

    const containerRect = this.container.current!.getBoundingClientRect();
    const currentRotation = rotations[this.rotationIdx];

    const adjustContainer = createCSSEditFunc(this.container);
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
      // const { nextLeft, nextTop } = calculateNewCenterPos(canvasRect, containerRect);

      // Reposition parent element
      const nextWidth = containerRect.height;
      const nextHeight = containerRect.width;

      // TODO: This was for the server, we still need it somewhere, maybe here
      const { x: _width, y: _height } = this.props.pixToGrid(nextWidth, nextHeight);
      this.tableSizeOnGrid = { width: _width, height: _height };

      let topTest = 0;
      let leftTest = 0;

      const tableOriginalRotationPosPixels = this.props.gridToPix(this.tableOriginalRotationPos.x, this.tableOriginalRotationPos.y);
      const tableNewRotationPosPixels = this.props.gridToPix(this.tableNewRotationPos.x, this.tableNewRotationPos.y);

      const containerRectGrid = this.props.pixToGrid(containerRect.left - canvasRect.left, containerRect.top - canvasRect.top);
      if (containerRectGrid.x === this.tableOriginalRotationPos.x && containerRectGrid.y === this.tableOriginalRotationPos.y) {
        leftTest = tableNewRotationPosPixels.x;
        topTest = tableNewRotationPosPixels.y;
      } else {
        leftTest = tableOriginalRotationPosPixels.x;
        topTest = tableOriginalRotationPosPixels.y;
      }

      // TODO: Constrain the rotate again
      const { top, left } = constrainRotate(canvasRect, nextWidth, nextHeight, topTest, leftTest);

      const _top = this.props.snapToGridH(top);
      const _left = this.props.snapToGridW(left);

      this.tablePosOnGrid = this.props.pixToGrid(_left, _top);
      adjustContainer('top', _top);
      adjustContainer('left', _left);
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
      <div ref={this.container} id={name} /* onMouseDown={this.mouseDown} onTouchStart={this.mouseDown} */ className="element" style={{ zIndex: this.dragging ? highestIdx : idx }}>
        <div ref={this.table} className="table">
          <div ref={this.tableDetails} className="table-details">
            {name}
            <br />
            {rotation}
          </div>
        </div>
        <div ref={this.handle}/* onMouseDown={this.startResize} onTouchStart={this.startResize} */ className="handle" style={{ bottom: '-10px', right: '-10px' }} />
      </div>
    );
  }
}

export default Box;
