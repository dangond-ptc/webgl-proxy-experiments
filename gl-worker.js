const gl = {};
let id = 0;

const pending = {};
let render;
let workerId;

function makeStub(functionName) {
  return function() {
    const invokeId = id;
    id += 1;

    window.parent.postMessage({
      workerId,
      id: invokeId,
      name: functionName,
      args: Array.from(arguments),
    }, '*');

    return new Promise(res => {
      pending[invokeId] = res;
    });
  };
}

window.addEventListener('message', function(event) {
  const message = event.data;
  if (message.name === 'bootstrap') {
    for (const fnName of message.functions) {
      gl[fnName] = makeStub(fnName);
    }

    for (const constName in message.constants) {
      gl[constName] = message.constants[constName];
    }

    main();
    return;
  }

  if (pending.hasOwnProperty(message.id)) {
    pending[message.id](message.result);
    delete pending[message.id];
  }

  if (message.name === 'frame') {
    render(message.time);

    window.parent.postMessage({
      workerId,
      isFrameEnd: true,
    }, '*');
  }
});
