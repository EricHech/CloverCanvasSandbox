import React from 'react';

const mousePos = (canvas, e) => {
  const rect = canvas.getBoundingClientRect(), // size of element
    scaleX = canvas.width / rect.width, // relationship bitmap vs. element for X
    scaleY = canvas.height / rect.height; // relationship bitmap vs. element for Y

  return {
    // scale mouse coordinates after they have been adjusted to be relative to element
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};

class Canvas extends React.Component {
  state = {
    redBox: {
      x: 50,
      y: 50,
      width: 150,
      height: 100,
    },
    greenBox: {
      x: 50,
      y: 250,
      width: 150,
      height: 100,
    },
  };

  componentDidMount() {
    const { redBox, greenBox } = this.state;

    const canvas = this.refs.canvas;

    const redThing = canvas.getContext('2d');
    const greenThing = canvas.getContext('2d');

    redThing.fillStyle = 'red';
    redThing.fillRect(redBox.x, redBox.y, redBox.width, redBox.height);

    greenThing.fillStyle = 'green';
    greenThing.fillRect(greenBox.x, greenBox.y, greenBox.width, greenBox.height);

    canvas.onmousedown = (e) => {
      console.log('downing', e);
      const posX = mousePos(canvas, e).x;
      const posY = mousePos(canvas, e).y;
      if (posX >= redBox.x && posX <= redBox.x + redBox.width && posY >= redBox.y && posY <= redBox.y + redBox.height) {
        canvas.onmousemove = (e) => {
          console.log('You clicked the red thing!!');
          this.setState((prev) => ({ redBox: { ...prev.redBox, x: posX, y: posY } }));
          redThing.fillRect(posX, posY, redBox.width, redBox.height);
        };
      }
    };
    canvas.onmouseup = (e) => {
      console.log('upping', e);
      canvas.onmousemove = null;
    };

    canvas.onclick = (e) => {
      const posX = mousePos(canvas, e).x;
      const posY = mousePos(canvas, e).y;

      if (posX >= redBox.x && posX <= redBox.x + redBox.width && posY >= redBox.y && posY <= redBox.y + redBox.height) {
        console.log('You clicked the red thing.');
      }
      if (posX >= greenBox.x && posX <= greenBox.x + greenBox.width && posY >= greenBox.y && posY <= greenBox.y + greenBox.height) {
        console.log('You clicked the green thing.');
      }
    };

    console.dir(canvas);
  }

  render() {
    return (
      <div className="App-body">
        Here is some text.
        <canvas ref="canvas" width={500} height={700} />
      </div>
    );
  }
}

export default Canvas;
