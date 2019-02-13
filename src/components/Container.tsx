import React, { Component } from 'react';

import Canvas from './canvas/Canvas';
import CanvasElements from './dom/CanvasElements';

const API = 'https://swapi.co/api/people/';

interface IState {
  data: {
    results: any[];
  };
}

class Container extends Component<{}, IState> {
  state = {
    data: {
      results: []
    }
  };

  componentDidMount() {
    // axios.get(API).then(({ data }) => this.setState({ data })).catch(console.error);
    this.setState({
      data: {
        results: [
          { name: 'Look Skywacker', x: 10, y: 10 }
          // { name: 'Princess Lay-a', x: 10, y: 10 }
        ]
      }
    });
  }
  render() {
    const { data } = this.state;
    if (!data.results.length) return null;

    // ! For CanvasElements Component Only:
    const characters = this.state.data.results.map((each: any, i: number) => {
      each.x = 20 * (i + 1);
      each.y = 20 * (i + 1);
      return each;
    });

    return (
      <>
        {/* <Canvas characters={data.results} /> */}
        <CanvasElements characters={characters} />
      </>
    );
  }
}

export default Container;
