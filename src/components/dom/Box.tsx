// * Everything is stored in grid positions but calculated in pixels

import React from 'react';

// Type Guard for handling mouse/touch events
function isTouchEvent(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent): e is React.TouchEvent<HTMLDivElement> | TouchEvent {
  return 'touches' in e;
}

// Abstracted getter for clientX/clientY to handle the possiblity of touch vs mouse events
function getClientMousePos(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent): { clientX: number; clientY: number } {
  const { clientX, clientY } = isTouchEvent(e) ? e.touches[0] : (e as any);
  return { clientX, clientY };
}

type size = {
  width: number;
  height: number;
};

type position = {
  x: number;
  y: number;
};

type TProps = {
  floorplan: React.RefObject<HTMLDivElement>;
  box: any; // TODO: properly type
  highestIdx: number;
  reorder: (id: string) => void;
  position: position;
  size: size;
  pixToGrid: (x: number, y: number) => position;
  gridToPix: (x: number, y: number) => position;
  snapToGridW: (val: number) => number;
  snapToGridH: (val: number) => number;
};

// TODO: Dining: move to config file
const TABLE_MAX_SIZE: size = { width: 20, height: 20 };
const TABLE_MIN_SIZE: size = { width: 5, height: 5 };
type Degrees = '0deg' | '45deg' | '90deg' | '135deg' | '180deg' | '225deg' | '270deg' | '315deg';
type Degrees90 = '0deg' | '90deg' | '180deg' | '270deg';
const rotations: Degrees[] = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];
const rotations90: Degrees90[] = ['0deg', '90deg', '180deg', '270deg']; // no multiples of 90
const ROTATION_THRESHOLD = 0.5; // in grid values

// A function which returns a function that allows you to modify the CSS of the element passed into the first call
const createCSSEditFunc = (el: React.RefObject<HTMLDivElement>) => (attrib: any, value: any, unit: string = 'px') => void (el.current!.style[attrib] = value + unit);

// This function calculates the box's new positions so that 90 degree rotation occurs upon the same centerpoint
const calculateNewCenterPos = (canvasRect: ClientRect, parentPos: ClientRect) => {
  const currLeft = parentPos.left - canvasRect.left;
  const currTop = parentPos.top - canvasRect.top;

  const nextLeft = currLeft + parentPos.width / 2 - parentPos.height / 2;
  const nextTop = currTop + parentPos.height / 2 - parentPos.width / 2;

  return { nextLeft, nextTop };
};

// This function calculates the box's new positions in order to keep it within the bounds of the floorplan
const constrainDrag = (canvasRect: ClientRect, containerRect: ClientRect, relativeX: number, relativeY: number): { top: number; left: number } => {
  let top = 0;
  let left = 0;

  const relativeWidth = canvasRect.width - containerRect.width;
  const relativeHeight = canvasRect.height - containerRect.height;

  // Drag the box when it is within the proper bounds
  if (relativeX < relativeWidth && relativeY < relativeHeight && relativeX > 0 && relativeY > 0) {
    top = relativeY;
    left = relativeX;

    // If the y axis is out of bounds, only move along the x axis
  } else if (relativeX < relativeWidth && relativeX > 0) {
    left = relativeX;
    // If the x axis is out of bounds, only move along the y axis
  } else if (relativeY < relativeHeight && relativeY > 0) {
    top = relativeY;
  }

  // If the mouse escapes the floorplan boundary:
  // - set the table to the edge on the far x axis
  if (relativeX >= relativeWidth) {
    left = relativeWidth;
  }
  // - set the table to the edge on the far y axis
  if (relativeY >= relativeHeight) {
    top = relativeHeight;
  }
  // - set the table to the edge on the near x axis
  if (relativeX <= 0) {
    left = 0;
  }
  // - set the table to the edge on the near y axis
  if (relativeY <= 0) {
    top = 0;
  }

  return { top, left };
};

// This function calculates the new width/height of the box in order to keep it within the proper bounds: floorplan border and min/max table size
const constrainResize = (canvasRect: ClientRect, containerRect: ClientRect, clientX: number, clientY: number, gridToPix: (x: number, y: number) => position): size => {
  let width = 0;
  let height = 0;

  const canvasWidthWithOffset = canvasRect.width + canvasRect.left;
  const containerResizeWidth = clientX - containerRect.left;
  const containerAndCanvasBorderDiffWidth = canvasWidthWithOffset - containerRect.left;

  const canvasHeightWithOffset = canvasRect.height + canvasRect.top;
  const containerResizeHeight = clientY - containerRect.top;
  const containerAndCanvasBorderDiffHeight = canvasHeightWithOffset - containerRect.top;

  // Find the max sizes in pixels
  const { x: maxWidth, y: maxHeight } = gridToPix(TABLE_MAX_SIZE.width, TABLE_MAX_SIZE.height);
  const { x: minWidth, y: minHeight } = gridToPix(TABLE_MIN_SIZE.width, TABLE_MIN_SIZE.height);

  // Check if the new size would grow past the boundaries of the layout
  if (clientX <= canvasWidthWithOffset) {
    // Check if the new size would be greater than the max table width
    if (containerResizeWidth <= maxWidth) {
      // Decide on the new width
      width = containerResizeWidth;
    } else {
      // Decide on the new width
      width = maxWidth;
    }
  } else {
    // Grow until the table either hits the boundaries...
    if (containerAndCanvasBorderDiffWidth < maxWidth) {
      width = containerAndCanvasBorderDiffWidth;
    } else {
      // ...or its max size
      width = maxWidth;
    }
  }

  // This repeats the functionality above for the height
  if (clientY <= canvasHeightWithOffset) {
    if (containerResizeHeight <= maxHeight) {
      height = containerResizeHeight;
    } else {
      height = maxHeight;
    }
  } else {
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

// Rotation can sometimes position part of the box out of bounds, and this function repositions it to remain inside
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
  private tableOriginalRotationPos: position = { x: 0, y: 0 };
  private tableNewRotationPos: position = { x: 0, y: 0 };
  private tablePosOnGrid: position = { x: 0, y: 0 };
  private tableSizeOnGrid: size = { width: 0, height: 0 };

  componentDidMount() {
    // Position the table on the floorplan
    const editContainer = createCSSEditFunc(this.container);
    editContainer('top', this.props.position.y);
    editContainer('left', this.props.position.x);
    editContainer('height', this.props.size.height);
    editContainer('width', this.props.size.width);

    const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;
    const containerRect = this.container.current!.getBoundingClientRect() as DOMRect;

    // Store the grid values of the current table position and current table size
    this.tablePosOnGrid = this.props.pixToGrid(this.props.position.x, this.props.position.y);
    const size = this.props.pixToGrid(this.props.size.width, this.props.size.height);
    this.tableSizeOnGrid = { width: size.x, height: size.y };

    // Store the grid values of the two 90 degree rotation positions (using `caclulateNewCenterPos`)
    this.tableOriginalRotationPos = this.props.pixToGrid(containerRect.left - canvasRect.left, containerRect.top - canvasRect.top);
    const { nextLeft, nextTop } = calculateNewCenterPos(canvasRect, containerRect);
    this.tableNewRotationPos = this.props.pixToGrid(nextLeft, nextTop);

    // Add all of the initial listeners
    window.addEventListener('resize', this.handleWindowResize());

    this.container.current!.addEventListener('mousedown', this.mouseDown);
    this.container.current!.addEventListener('touchstart', this.mouseDown, { passive: false });

    this.handle.current!.addEventListener('mousedown', this.startResize);
    this.handle.current!.addEventListener('touchstart', this.startResize, { passive: false });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize());
  }

  /*
  ██╗    ██╗ ██╗ ███╗   ██╗ ██████╗   ██████╗  ██╗    ██╗     ██████╗  ███████╗ ███████╗ ██╗ ███████╗ ███████╗
  ██║    ██║ ██║ ████╗  ██║ ██╔══██╗ ██╔═══██╗ ██║    ██║     ██╔══██╗ ██╔════╝ ██╔════╝ ██║ ╚══███╔╝ ██╔════╝
  ██║ █╗ ██║ ██║ ██╔██╗ ██║ ██║  ██║ ██║   ██║ ██║ █╗ ██║     ██████╔╝ █████╗   ███████╗ ██║   ███╔╝  █████╗
  ██║███╗██║ ██║ ██║╚██╗██║ ██║  ██║ ██║   ██║ ██║███╗██║     ██╔══██╗ ██╔══╝   ╚════██║ ██║  ███╔╝   ██╔══╝
  ╚███╔███╔╝ ██║ ██║ ╚████║ ██████╔╝ ╚██████╔╝ ╚███╔███╔╝     ██║  ██║ ███████╗ ███████║ ██║ ███████╗ ███████╗
   ╚══╝╚══╝  ╚═╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═════╝   ╚══╝╚══╝      ╚═╝  ╚═╝ ╚══════╝ ╚══════╝ ╚═╝ ╚══════╝ ╚══════╝
  */
  // Adjusts the table position and size to line up with the resizing of the floorplan
  handleWindowResize = () => {
    let timeout: number;

    return () => {
      if (timeout) cancelAnimationFrame(timeout);

      timeout = requestAnimationFrame(() => {
        const editContainer = createCSSEditFunc(this.container);

        const { x, y } = this.props.gridToPix(this.tablePosOnGrid.x, this.tablePosOnGrid.y);
        const { x: width, y: height } = this.props.gridToPix(this.tableSizeOnGrid.width, this.tableSizeOnGrid.height);

        editContainer('top', y);
        editContainer('left', x);
        editContainer('width', width);
        editContainer('height', height);
      });
    };
  };

  /*
  ███████╗ ███████╗ ████████╗     ██████╗   ██████╗  ████████╗  █████╗  ████████╗ ███████╗
  ██╔════╝ ██╔════╝ ╚══██╔══╝     ██╔══██╗ ██╔═══██╗ ╚══██╔══╝ ██╔══██╗ ╚══██╔══╝ ██╔════╝
  ███████╗ █████╗      ██║        ██████╔╝ ██║   ██║    ██║    ███████║    ██║    █████╗
  ╚════██║ ██╔══╝      ██║        ██╔══██╗ ██║   ██║    ██║    ██╔══██║    ██║    ██╔══╝
  ███████║ ███████╗    ██║        ██║  ██║ ╚██████╔╝    ██║    ██║  ██║    ██║    ███████╗
  ╚══════╝ ╚══════╝    ╚═╝        ╚═╝  ╚═╝  ╚═════╝     ╚═╝    ╚═╝  ╚═╝    ╚═╝    ╚══════╝
  */
  setRotate = () => void (this.shouldRotate = true);

  /*
  ███╗   ███╗  ██████╗  ██╗   ██╗ ███████╗ ███████╗     ██████╗   ██████╗  ██╗    ██╗ ███╗   ██╗
  ████╗ ████║ ██╔═══██╗ ██║   ██║ ██╔════╝ ██╔════╝     ██╔══██╗ ██╔═══██╗ ██║    ██║ ████╗  ██║
  ██╔████╔██║ ██║   ██║ ██║   ██║ ███████╗ █████╗       ██║  ██║ ██║   ██║ ██║ █╗ ██║ ██╔██╗ ██║
  ██║╚██╔╝██║ ██║   ██║ ██║   ██║ ╚════██║ ██╔══╝       ██║  ██║ ██║   ██║ ██║███╗██║ ██║╚██╗██║
  ██║ ╚═╝ ██║ ╚██████╔╝ ╚██████╔╝ ███████║ ███████╗     ██████╔╝ ╚██████╔╝ ╚███╔███╔╝ ██║ ╚████║
  ╚═╝     ╚═╝  ╚═════╝   ╚═════╝  ╚══════╝ ╚══════╝     ╚═════╝   ╚═════╝   ╚══╝╚══╝  ╚═╝  ╚═══╝
  */
  mouseDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = getClientMousePos(e);

    const containerRect = this.container.current!.getBoundingClientRect() as DOMRect;

    // Save the intial mouse position (if we drag, the table position is calculated relative to where it was initially)
    this.initialMouseX = clientX;
    this.initialMouseY = clientY;
    this.initialTableX = containerRect.x;
    this.initialTableY = containerRect.y;

    // Bring the selected element to the foreground
    this.props.reorder(this.props.box.name);

    // Initialize dragging and rotation (`this.continueDrag` will cancel rotation)
    this.startDrag(clientX, clientY);
    this.setRotate();
  };

  /*
  ███╗   ███╗  ██████╗  ██╗   ██╗ ███████╗ ███████╗     ██╗   ██╗ ██████╗
  ████╗ ████║ ██╔═══██╗ ██║   ██║ ██╔════╝ ██╔════╝     ██║   ██║ ██╔══██╗
  ██╔████╔██║ ██║   ██║ ██║   ██║ ███████╗ █████╗       ██║   ██║ ██████╔╝
  ██║╚██╔╝██║ ██║   ██║ ██║   ██║ ╚════██║ ██╔══╝       ██║   ██║ ██╔═══╝
  ██║ ╚═╝ ██║ ╚██████╔╝ ╚██████╔╝ ███████║ ███████╗     ╚██████╔╝ ██║
  ╚═╝     ╚═╝  ╚═════╝   ╚═════╝  ╚══════╝ ╚══════╝      ╚═════╝  ╚═╝
  */
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
    // If `this.continueDrag` never canceled rotation, it should rotate...
    if (this.shouldRotate) {
      this.rotate();
    } else {
      // ...otherwise, the table moved and new two 90 degree rotation positions need to be stored
      const canvasRect = this.props.floorplan.current!.getBoundingClientRect() as DOMRect;
      const containerRect = this.container.current!.getBoundingClientRect() as DOMRect;

      this.tableOriginalRotationPos = this.props.pixToGrid(containerRect.left - canvasRect.left, containerRect.top - canvasRect.top);
      const { nextLeft, nextTop } = calculateNewCenterPos(canvasRect, containerRect);
      this.tableNewRotationPos = this.props.pixToGrid(nextLeft, nextTop);
    }
  };

  /*
  ███████╗ ████████╗  █████╗  ██████╗  ████████╗     ██████╗  ██████╗   █████╗   ██████╗
  ██╔════╝ ╚══██╔══╝ ██╔══██╗ ██╔══██╗ ╚══██╔══╝     ██╔══██╗ ██╔══██╗ ██╔══██╗ ██╔════╝
  ███████╗    ██║    ███████║ ██████╔╝    ██║        ██║  ██║ ██████╔╝ ███████║ ██║  ███╗
  ╚════██║    ██║    ██╔══██║ ██╔══██╗    ██║        ██║  ██║ ██╔══██╗ ██╔══██║ ██║   ██║
  ███████║    ██║    ██║  ██║ ██║  ██║    ██║        ██████╔╝ ██║  ██║ ██║  ██║ ╚██████╔╝
  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝    ╚═╝        ╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝  ╚═════╝
  */
  startDrag = (clientX: number, clientY: number) => {
    // Set the listener on the document as well so that the object is never lost by rapid mouse movement
    document.addEventListener('mousemove', this.continueDrag);
    document.addEventListener('mouseup', this.mouseUp);

    document.addEventListener('touchmove', this.continueDrag, { passive: false });
    document.addEventListener('touchend', this.mouseUp, { passive: false });

    this.dragging = true;
  };

  /*
   ██████╗  ██████╗  ███╗   ██╗ ████████╗ ██╗ ███╗   ██╗ ██╗   ██╗ ███████╗     ██████╗  ██████╗   █████╗   ██████╗
  ██╔════╝ ██╔═══██╗ ████╗  ██║ ╚══██╔══╝ ██║ ████╗  ██║ ██║   ██║ ██╔════╝     ██╔══██╗ ██╔══██╗ ██╔══██╗ ██╔════╝
  ██║      ██║   ██║ ██╔██╗ ██║    ██║    ██║ ██╔██╗ ██║ ██║   ██║ █████╗       ██║  ██║ ██████╔╝ ███████║ ██║  ███╗
  ██║      ██║   ██║ ██║╚██╗██║    ██║    ██║ ██║╚██╗██║ ██║   ██║ ██╔══╝       ██║  ██║ ██╔══██╗ ██╔══██║ ██║   ██║
  ╚██████╗ ╚██████╔╝ ██║ ╚████║    ██║    ██║ ██║ ╚████║ ╚██████╔╝ ███████╗     ██████╔╝ ██║  ██║ ██║  ██║ ╚██████╔╝
   ╚═════╝  ╚═════╝  ╚═╝  ╚═══╝    ╚═╝    ╚═╝ ╚═╝  ╚═══╝  ╚═════╝  ╚══════╝     ╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝  ╚═════╝
  */
  continueDrag = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = getClientMousePos(e);

    const { x: thresholdInPixels } = this.props.gridToPix(ROTATION_THRESHOLD, ROTATION_THRESHOLD);

    // The threshold for the rotation to stop if the table is moved
    // Rotate it if it's just nudged a little
    if (Math.abs(this.initialMouseX - clientX) > thresholdInPixels || Math.abs(this.initialMouseY - clientY) > thresholdInPixels) {
      this.shouldRotate = false;
    }

    const canvasRect = this.props.floorplan.current!.getBoundingClientRect();
    const containerRect = this.container.current!.getBoundingClientRect();

    // Calculate the mouse position relative to where it was on the intial mousedown/touchstart
    const relativeX = clientX - this.initialMouseX + this.initialTableX - canvasRect.left;
    const relativeY = clientY - this.initialMouseY + this.initialTableY - canvasRect.top;

    // Find the proper position for the element within bounds and snapped to the grid
    const { top, left } = constrainDrag(canvasRect, containerRect, relativeX, relativeY);
    const newTop = this.props.snapToGridH(top);
    const newLeft = this.props.snapToGridW(left);

    // Reposition the element
    const moveContainer = createCSSEditFunc(this.container);
    moveContainer('top', newTop);
    moveContainer('left', newLeft);

    // Update the saved grid position
    this.tablePosOnGrid = this.props.pixToGrid(newLeft, newTop);
  };

  /*
  ███████╗ ████████╗  █████╗  ██████╗ ████████╗    ██████╗ ███████╗███████╗██╗███████╗███████╗
  ██╔════╝ ╚══██╔══╝ ██╔══██╗ ██╔══██╗╚══██╔══╝    ██╔══██╗██╔════╝██╔════╝██║╚══███╔╝██╔════╝
  ███████╗    ██║    ███████║ ██████╔╝   ██║       ██████╔╝█████╗  ███████╗██║  ███╔╝ █████╗
  ╚════██║    ██║    ██╔══██║ ██╔══██╗   ██║       ██╔══██╗██╔══╝  ╚════██║██║ ███╔╝  ██╔══╝
  ███████║    ██║    ██║  ██║ ██║  ██║   ██║       ██║  ██║███████╗███████║██║███████╗███████╗
  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝   ╚═╝       ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚══════╝╚══════╝
  */
  startResize = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    document.addEventListener('mousemove', this.continueResize);
    document.addEventListener('mouseup', this.mouseUp);

    document.addEventListener('touchmove', this.continueResize, { passive: false });
    document.addEventListener('touchend', this.mouseUp, { passive: false });
  };

  /*
   ██████╗  ██████╗  ███╗   ██╗ ████████╗ ██╗ ███╗   ██╗ ██╗   ██╗ ███████╗    ██████╗  ███████╗ ███████╗ ██╗ ███████╗ ███████╗
  ██╔════╝ ██╔═══██╗ ████╗  ██║ ╚══██╔══╝ ██║ ████╗  ██║ ██║   ██║ ██╔════╝    ██╔══██╗ ██╔════╝ ██╔════╝ ██║ ╚══███╔╝ ██╔════╝
  ██║      ██║   ██║ ██╔██╗ ██║    ██║    ██║ ██╔██╗ ██║ ██║   ██║ █████╗      ██████╔╝ █████╗   ███████╗ ██║   ███╔╝  █████╗
  ██║      ██║   ██║ ██║╚██╗██║    ██║    ██║ ██║╚██╗██║ ██║   ██║ ██╔══╝      ██╔══██╗ ██╔══╝   ╚════██║ ██║  ███╔╝   ██╔══╝
  ╚██████╗ ╚██████╔╝ ██║ ╚████║    ██║    ██║ ██║ ╚████║ ╚██████╔╝ ███████╗    ██║  ██║ ███████╗ ███████║ ██║ ███████╗ ███████╗
   ╚═════╝  ╚═════╝  ╚═╝  ╚═══╝    ╚═╝    ╚═╝ ╚═╝  ╚═══╝  ╚═════╝  ╚══════╝    ╚═╝  ╚═╝ ╚══════╝ ╚══════╝ ╚═╝ ╚══════╝ ╚══════╝
   */
  continueResize = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = getClientMousePos(e as MouseEvent);

    const canvasRect = this.props.floorplan.current!.getBoundingClientRect();
    const containerRect = this.container.current!.getBoundingClientRect();

    // Find the proper size for the element within bounds and snapped to the grid
    const { height, width } = constrainResize(canvasRect, containerRect, clientX, clientY, this.props.gridToPix);
    const newWidth = this.props.snapToGridW(width);
    const newHeight = this.props.snapToGridH(height);

    // Resize the element
    const resizeContainer = createCSSEditFunc(this.container);
    resizeContainer('height', newHeight);
    resizeContainer('width', newWidth);

    // Update the saved grid size
    const { x: _width, y: _height } = this.props.pixToGrid(newWidth, newHeight);
    this.tableSizeOnGrid = { width: _width, height: _height };
  };

  /*
  ██████╗   ██████╗  ████████╗  █████╗  ████████╗ ███████╗
  ██╔══██╗ ██╔═══██╗ ╚══██╔══╝ ██╔══██╗ ╚══██╔══╝ ██╔════╝
  ██████╔╝ ██║   ██║    ██║    ███████║    ██║    █████╗
  ██╔══██╗ ██║   ██║    ██║    ██╔══██║    ██║    ██╔══╝
  ██║  ██║ ╚██████╔╝    ██║    ██║  ██║    ██║    ███████╗
  ╚═╝  ╚═╝  ╚═════╝     ╚═╝    ╚═╝  ╚═╝    ╚═╝    ╚══════╝
  */
  rotate = () => {
    // Circularly iterate through the list of rotation degrees
    this.rotationIdx = (this.rotationIdx + 1) % rotations.length;
    // If we want the `rotations[this.rotationIdx]` in render to be updated, we have to call `this.forceUpdate()` because the values are not in state:
    // this.forceUpdate();
    this.shouldRotate = false;

    const currentRotation = rotations[this.rotationIdx];

    const adjustContainer = createCSSEditFunc(this.container);
    const adjustTable = createCSSEditFunc(this.table);
    const adjustTableDetails = createCSSEditFunc(this.tableDetails);

    // If the rotation is setting the table to a 90 degree angle
    if (rotations90.includes(currentRotation as Degrees90)) {
      const canvasRect = this.props.floorplan.current!.getBoundingClientRect();
      const containerRect = this.container.current!.getBoundingClientRect();

      // Reset the css transforms because 90 degree rotations are handled by swapping the width and height
      adjustTable('transform', 'rotate(0deg)', '');
      adjustTableDetails('transform', 'rotate(0deg)', '');

      // Reverse the width and height
      const nextWidth = containerRect.height;
      const nextHeight = containerRect.width;

      // Reposition parent element
      adjustContainer('width', nextWidth);
      adjustContainer('height', nextHeight);

      // Save the grid size of the swapped width and height
      this.tableSizeOnGrid = { width: this.tableSizeOnGrid.height, height: this.tableSizeOnGrid.width };

      let nextTop = 0;
      let nextLeft = 0;

      // Get rotation values in pixels for positioning
      const tableOriginalRotationPosPixels = this.props.gridToPix(this.tableOriginalRotationPos.x, this.tableOriginalRotationPos.y);
      const tableNewRotationPosPixels = this.props.gridToPix(this.tableNewRotationPos.x, this.tableNewRotationPos.y);

      // Check which state the table is in, horizontal or vertical, and then swap it in the if/else
      const containerRectGrid = this.props.pixToGrid(containerRect.left - canvasRect.left, containerRect.top - canvasRect.top);
      if (containerRectGrid.x === this.tableOriginalRotationPos.x && containerRectGrid.y === this.tableOriginalRotationPos.y) {
        nextLeft = tableNewRotationPosPixels.x;
        nextTop = tableNewRotationPosPixels.y;
      } else {
        nextLeft = tableOriginalRotationPosPixels.x;
        nextTop = tableOriginalRotationPosPixels.y;
      }

      // Protect against being out of bounds
      const { top, left } = constrainRotate(canvasRect, nextWidth, nextHeight, nextTop, nextLeft);

      // Snap the resulting position to the grid
      const _top = this.props.snapToGridH(top);
      const _left = this.props.snapToGridW(left);

      // Save and set the new position
      this.tablePosOnGrid = this.props.pixToGrid(_left, _top);
      adjustContainer('top', _top);
      adjustContainer('left', _left);
    } else {
      // If the table is diagonal, check the current orientation and rotate it the correct way
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
    return (
      <div ref={this.container} id={name} className="element" style={{ zIndex: this.dragging ? highestIdx : idx }}>
        <div ref={this.table} className="table">
          <div ref={this.tableDetails} className="table-details">
            {name}
          </div>
        </div>
        <div ref={this.handle} className="handle" style={{ bottom: '-10px', right: '-10px' }} />
      </div>
    );
  }
}

export default Box;
