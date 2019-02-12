import React from 'react';
import Box from './Box';

const snapToGridCreator = (gridSize: number) => (value: number): number => Math.round(value / gridSize) * gridSize;

class Grid extends React.Component<any> {
  private snapToGrid: (pos: number) => number = snapToGridCreator(this.props.grid.height);

  componentDidUpdate() {
    this.snapToGrid = snapToGridCreator(this.props.grid.height);
  }

  pixToGrid = (x: number, y: number) => {
    const newX = Math.round(x / this.props.grid.width);
    const newY = Math.round(y / this.props.grid.height);

    const thing = { x: isNaN(newX) ? 0 : newX, y: isNaN(newY) ? 0 : newY };
    return thing;
  }

  gridToPix = (x: number, y: number) => {
    const newX = x * this.props.grid.width;
    const newY = y * this.props.grid.height;

    return { x: newX, y: newY };
  }

  render() {
    return (
      <>
        {this.props.tables.map((each: any, i: number, arr: any[]) => {
          const position = this.gridToPix(each.x, each.y);
          const size = this.gridToPix(each.width, each.height);
          return (<Box key={each.name} floorplan={this.props.floorplan} box={each}
            highestIdx={arr.length} reorder={this.props.reorder}
            position={position}
            size={{ width: size.x, height: size.y }}
            pixToGrid={this.pixToGrid}
            gridToPix={this.gridToPix}
            snapToGrid={this.snapToGrid}
          />)
        })}
      </>
    );
  }
}

export default Grid;
