import React, { Component } from 'react';
import axios from 'axios';

import Canvas from './components/Canvas';
import CanvasElements from './components/CanvasElements';

const API = 'https://swapi.co/api/people/';

interface IState {
  data: {
    results: any[]
  }
}

class Container extends Component<{}, IState> {
  state = {
    data: {
      results: []
    }
  }
  componentDidMount() {
    axios.get(API).then(({ data }) => this.setState({ data })).catch(console.error);
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
