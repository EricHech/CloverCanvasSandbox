import React, { Component } from 'react';
import axios from 'axios';

import Canvas from './components/Canvas';

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
    if(!data.results.length) return null;
    return (
      <Canvas characters={data.results} />
    );
  }
}

export default Container;
