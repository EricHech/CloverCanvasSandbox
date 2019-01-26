import React from 'react';

type TState = {
  id: string | null,
  x: number | null,
  y: number | null
}

// TODO: Type props/state
class Box extends React.Component<any, TState> {
  state = {
    id: null,
    x: null,
    y: null,
  }

  mouseDown = (e: any) => {
    const { target } = e;

    const x: string = target.style.left.slice(0, target.style.left.length - 2);
    const y: string = target.style.top.slice(0, target.style.left.length - 2);
    this.setState({ id: target.id, x: Number(x), y: Number(y) })
  }

  mouseMove = (e: any) => {
    const { movementX, movementY } = e;
    // !: Start Here
    console.log(this.state.y, e.clientY);
    this.setState((prev) => ({ x: prev.x! + (movementX / 2), y: prev.y! + (movementY / 2) }));
  }

  mouseUp = (e: any) => {
    this.setState({ id: null, x: null, y: null })
    // target.onmousemove = null;
  }

  render() {
    const { name, idx, highestIdx, color } = this.props;
    const { id, x, y } = this.state;
    const dragging = id === name;

    return <div
      id={name}
      onMouseDown={this.mouseDown}
      onMouseMove={dragging ? this.mouseMove : undefined}
      onMouseUp={dragging ? this.mouseUp : undefined}
      className='element'
      style={{ "left": `${dragging ? x : x}px`, "top": `${dragging ? y : y}px`, zIndex: dragging ? highestIdx : idx, background: color }}>{name}</div>;
  }
}

export default Box;
