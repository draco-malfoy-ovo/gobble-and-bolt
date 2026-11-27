// input.js — the keyboard (and a click to start), as a plain input object
// the simulation consumes: {left, right, up, down, sprint, jump, crouch}.
//
// jump is edge-triggered — it reports true for exactly one step per press,
// so holding Space does not bunny-hop on its own.

export function createInput() {
  const held = new Set();
  let jumpQueued = false;

  const keyMap = {
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ShiftLeft: 'sprint',
    ShiftRight: 'sprint',
    KeyC: 'crouch',
  };

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      if (!event.repeat) jumpQueued = true;
      event.preventDefault();
      return;
    }
    const action = keyMap[event.code];
    if (action) {
      held.add(action);
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    const action = keyMap[event.code];
    if (action) held.delete(action);
  });
  window.addEventListener('blur', () => held.clear());

  return {
    read() {
      const input = {
        left: held.has('left'),
        right: held.has('right'),
        up: held.has('up'),
        down: held.has('down'),
        sprint: held.has('sprint'),
        crouch: held.has('crouch'),
        jump: jumpQueued,
      };
      jumpQueued = false;
      return input;
    },
    pressJump() {
      jumpQueued = true;
    },
  };
}
