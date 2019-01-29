import React from 'react';

type TState = {
  id: string | null,
  rotation: number,
}

const rotations = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];

// TODO: Type props/state
class Box extends React.Component<any, TState> {
  private element = React.createRef<HTMLDivElement>();
  private x: number = 0;
  private y: number = 0;
  private finalX: number = 0;
  private finalY: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;
  private height: number = 100;
  private width: number = 100;

  state = {
    id: null,
    rotation: 0,
  }

  mouseDown = (e: any) => {
    e.preventDefault();
    const { target, clientX, clientY } = e;

    this.initialX = clientX;
    this.initialY = clientY;

    document.onmousemove = this.mouseMove;
    document.onmouseup = this.mouseUp;
    this.setState({ id: target.id });
  }

  mouseMove = (e: any) => {
    e.preventDefault();
    const { clientX, clientY } = e;

    this.finalX = this.initialX - clientX;
    this.finalY = this.initialY - clientY;
    this.initialX = clientX;
    this.initialY = clientY;
    this.x = (this.element.current!.offsetLeft - this.finalX);
    this.y = (this.element.current!.offsetTop - this.finalY);

    this.element.current!.style.left = this.x + "px";
    this.element.current!.style.top = this.y + "px";
  }

  mouseUp = (e: any) => {
    e.stopPropagation();
    document.onmouseup = null;
    document.onmousemove = null;
    this.props.reorder(this.state.id);
    this.setState({ id: null });
  }

  startResize = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const { target, clientX, clientY } = e;

    this.initialX = clientX;
    this.initialY = clientY;

    document.onmousemove = this.continueResize;
    document.onmouseup = this.mouseUp;
  }

  continueResize = (e: any) => {
    e.preventDefault();
    const { clientX, clientY } = e;

    this.finalX = this.initialX - clientX;
    this.finalY = this.initialY - clientY;
    this.initialX = clientX;
    this.initialY = clientY;

    const elementPos = this.element.current!.getBoundingClientRect();

    this.element.current!.style.width = (clientX - elementPos.left) + "px";
    this.element.current!.style.height = (clientY - elementPos.top) + "px";

    this.element.current!.style.width = (clientX - elementPos.left) + "px";
    this.element.current!.style.height = (clientY - elementPos.top) + "px";
  }

  rotate = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState((prev) => ({
      rotation: (prev.rotation + 1) % rotations.length,
    }));
  }

  render() {
    const { name, idx, color } = this.props.box;
    const { highestIdx } = this.props;
    const { id, rotation } = this.state;
    const dragging = id === name;

    return (
      <div
        ref={this.element}
        id={name}
        onMouseDown={this.mouseDown}
        className='element'
        style={{ zIndex: dragging ? highestIdx : idx }}>
        <div className="table" onClick={this.rotate} style={{ background: color, transform: `rotate(${rotations[rotation]})`}}>
          {name}
        </div>
        <div onMouseDown={this.startResize} className="handle" />
      </div>
    );
  }
}

export default Box;
