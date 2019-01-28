import React from 'react';

type TState = {
  id: string | null,
}

// TODO: Type props/state
class Box extends React.Component<any, TState> {
  private element = React.createRef<HTMLDivElement>();
  private x: number = 0;
  private y: number = 0;
  private finalX: number = 0;
  private finalY: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;

  state = {
    id: null,
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
    document.onmouseup = null;
    document.onmousemove = null;
    this.props.reorder(this.state.id);
    this.setState({ id: null });
  }

  render() {
    const { name, idx, color } = this.props.box;
    const { highestIdx } = this.props;
    const { id } = this.state;
    const dragging = id === name;

    return <div
      ref={this.element}
      id={name}
      onMouseDown={this.mouseDown}
      className='element'
      style={{ zIndex: dragging ? highestIdx : idx, background: color }}>
      {name}
    </div>;
  }
}

export default Box;
