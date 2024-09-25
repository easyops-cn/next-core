const render = () => {
  // $('#purehtml-container').html('Hello, render with jQuery');
  return Promise.resolve();
};

((global) => {
  global['purehtml'] = {
    bootstrap: () => {
      console.log('purehtml bootstrap');
      return Promise.resolve();
    },
    mount: (...args) => {
      console.log('purehtml mount', args);
      return render();
    },
    unmount: () => {
      console.log('purehtml unmount');
      return Promise.resolve();
    },
  };
})(window);
