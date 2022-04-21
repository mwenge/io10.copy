// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.data`, `.json`,
// and `.wasm` files as well:
importScripts("../3rdparty/perl/webperl.js");
importScripts("../3rdparty/localforage.min.js");

async function loadPyodideAndPackages() {
  function init() {
    Perl.init();
  }
  await Perl.start(init);
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  // make sure loading is done
  await pyodideReadyPromise;
  // Don't bother yet with this line, suppose our API is built in such a way:
  const { id, python, stdin, files } = event.data;
  // Load all the files, and wait until they're all loaded.
  // Now is the easy part, the one that is similar to working in the main thread:
  try {
    let results = await Perl.eval(python);
    self.postMessage({ results, id });
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
};
