import React from 'react';
import Box from './Box';

class Grid extends React.Component<any> {
  pixToGrid = (x: number, y: number) => {
    console.log('props:', { x, y });
    console.log('grid:', this.props.grid);
    const newX = Math.round(x / this.props.grid.w);
    const newY = Math.round(y / this.props.grid.h);

    const thing = { x: isNaN(newX) ? 0 : newX, y: isNaN(newY) ? 0 : newY };
    console.log('PixToGrid:', thing);
    return thing;
  }

  gridToPix = (x: number, y: number) => {
    console.log('gridToPix props:', { x, y });
    console.log('grid:', this.props.grid);
    const newX = x * this.props.grid.w;
    const newY = y * this.props.grid.h;

    console.log('GridToPix', { x: newX, y: newY })
    console.log('---------')
    return { x: newX, y: newY };
  }

  render() {
    return (
      <>
        {this.props.tables.map((each: any, i: number, arr: any[]) => (
          <Box key={each.name} floorplan={this.props.floorplan} box={each}
            highestIdx={arr.length} reorder={this.props.reorder}
            position={this.gridToPix(each.x, each.y)}
            pixToGrid={this.pixToGrid} />
        ))}
      </>
    );
  }
}

export default Grid;
