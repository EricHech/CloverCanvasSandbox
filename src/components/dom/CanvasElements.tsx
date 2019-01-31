import React from 'react';
import Box from './Box';

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'lightgrey', 'black', 'lightgreen'];
const TABLE_BORDER_WIDTH = 4;
const HANDLE_SIZE = 10;
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

type TState = {
  characters: any[]
}

type TProps = {
  characters: any[]
}

class CanvasElements extends React.Component<TProps, TState> {
  // private characters: any[] = this.props.characters;
  state = {
    characters: this.props.characters,
  }

  reorder = (id: string) => {
    // reorder the tables to ensure the one being dragged is on top of the stack
    const newArr: {}[] = [];
    let found: {} | null = null;
    this.setState(({characters}) => {
      for(let i = 0; i < characters.length; i++) {
        if(characters[i].name === id) found = characters[i]
        else newArr.push(characters[i]);
      }
      if(found) newArr.push(found);

      return {
      characters: newArr,
      }
    });
    // for(let i = 0; i < this.characters.length; i++) {
    //   if(this.characters[i].name === id) found = this.characters[i]
    //   else newArr.push(this.characters[i]);
    // }
    // if(found) newArr.push(found);

    // this.characters = newArr;
    // this.forceUpdate();
  }

  render() {
    const toDisplay = this.state.characters.map((each: any, i: number) => {
      each.idx = i;
      each.color = colors[i];
      return each;
    });

    const test = toDisplay;
    return (
      <div className="App-body">
        Here is some text.
        <div className='custom-canvas'>
          {test.map((each: any, i: number, arr: any[]) => (
            <Box key={each.name} box={each} highestIdx={arr.length} reorder={this.reorder} />
          ))}
        </div>
      </div>
    );
  }
}

export default CanvasElements;
