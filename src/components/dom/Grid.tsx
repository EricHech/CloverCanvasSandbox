import React from 'react';
import Box from './Box';

export const accurateNum = (number: number): number => parseFloat(number.toFixed(6));
const snapToGridCreator = (gridSize: number) => (value: number): number => accurateNum(gridSize * Math.round(value / gridSize));

class Grid extends React.Component<any> {
  private snapToGridW: (pos: number) => number = snapToGridCreator(this.props.grid.width);
  private snapToGridH: (pos: number) => number = snapToGridCreator(this.props.grid.height);

  componentDidUpdate() {
    this.snapToGridW = snapToGridCreator(this.props.grid.width);
    this.snapToGridH = snapToGridCreator(this.props.grid.height);
  }

  pixToGrid = (x: number, y: number) => {
    const newX = Math.round(x / this.props.grid.width);
    const newY = Math.round(y / this.props.grid.height);

    return { x: isNaN(newX) ? 0 : newX, y: isNaN(newY) ? 0 : newY };
  }

  gridToPix = (x: number, y: number) => {
    const newX = accurateNum(x * this.props.grid.width);
    const newY = accurateNum(y * this.props.grid.height);

    return { x: newX, y: newY };
  }

  render() {
    return (
      <>
        {this.props.tables.map((each: any, i: number, arr: any[]) => {
          const position = this.gridToPix(each.x, each.y);
          const size = this.gridToPix(each.width, each.height);
          return (
            <Box key={each.name} floorplan={this.props.floorplan} box={each}
              highestIdx={arr.length} reorder={this.props.reorder}
              position={position}
              size={{ width: size.x, height: size.y }}
              pixToGrid={this.pixToGrid}
              gridToPix={this.gridToPix}
              snapToGridW={this.snapToGridW}
              snapToGridH={this.snapToGridH}
            />
          )
        })}
      </>
    );
  }
}

export default Grid;
