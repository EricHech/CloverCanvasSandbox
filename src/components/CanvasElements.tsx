import React from 'react';
import Box from './Box';

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'lightgrey', 'black', 'lightgreen'];
const TABLE_BORDER_WIDTH = 4;
const HANDLE_SIZE = 10;
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

// TODO: Type props/state
class CanvasElements extends React.Component<any> {
  state = {
    
  }
  render() {
    // console.log(this.props.characters);
    return (
      <div className="App-body">
        Here is some text.
        <div className='custom-canvas'>{this.props.characters.map((each: any, i: number, arr:[]) => (<Box key={each.name} name={each.name} idx={i} highestIdx={arr.length} color={colors[i]}/>))}</div>
      </div>
    );
  }
}

export default CanvasElements;
