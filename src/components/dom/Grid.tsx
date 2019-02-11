import React from 'react';
import Box from './Box';

class Grid extends React.Component<any> {
  pixToGrid = (x: number, y: number) => {
    const newX = x / this.props.grid.w;
    const newY = y / this.props.grid.h;

    return { x: isNaN(newX) ? 0 : newX, y: isNaN(newY) ? 0 : newY };
  }

  gridToPix = (x: number, y: number) => {
    const newX = x * this.props.grid.w;
    const newY = y * this.props.grid.h;

    return { x: newX, y: newY };
  }

  render() {
    return (
      <>
        {this.props.tables.map((each: any, i: number, arr: any[]) => (
          <Box key={each.name} floorplan={this.props.floorplan} box={each}
               highestIdx={arr.length} reorder={this.props.reorder}
               position={this.gridToPix(each.x, each.y)} />
        ))}
      </>
    );
  }
}

export default Grid;
