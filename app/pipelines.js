import { getPipeline } from "./pipeline.js";
import { examplePipeline } from "./example.js";
import { updatePipelineOnAwesomeBar } from "./awesomebar-pipeline.js";

export function updateAwesomeBar() {
  updatePipelineOnAwesomeBar(pipeline.currentPipeline(),
    pipeline.currentPipeIndex(),
    pipelinePrettyNames[currentPipelineIndex],
    pipeline.currentPipe().files()); 
}
// Helper functions to navigate pipes and pipelines.
export async function updateDisplayedPipe(pipe) {
  if (!pipe) { return; }
  editor.getDoc().setValue(pipe.program());
  outputWrapper.updateContent(pipe.output());
  updateAwesomeBar();
  inputWrapper.updateContent(await pipe.input(), pipeline.currentPipeIndex() == 0);
}
async function insertBefore() {
  pipeline.currentPipe().updateProgram(editor.getValue());
  let pipe = await pipeline.insertBefore();
  updateDisplayedPipe(pipe);
}
async function deleteCurrent() {
  let pipe = await pipeline.deleteCurrent();
  updateDisplayedPipe(pipe);
}
async function insertAfter() {
  pipeline.currentPipe().updateProgram(editor.getValue());
  let pipe = await pipeline.insertAfter();
  updateDisplayedPipe(pipe);
}
async function previousPipe() {
  editor.getDoc().clearHistory();
  pipeline.currentPipe().updateProgram(editor.getValue());
  let pipe = await pipeline.moveToPreviousPipe();
  updateDisplayedPipe(pipe);
}
export async function moveToFirstPipe() {
  editor.getDoc().clearHistory();
  pipeline.currentPipe().updateProgram(editor.getValue());
  let pipe = await pipeline.moveToFirstPipe();
  updateDisplayedPipe(pipe);
  return pipe;
}
export async function nextPipe() {
  editor.getDoc().clearHistory();
  if (!pipeline.currentPipeIndex())
    pipeline.currentPipe().updateInput(inputWrapper.getValue());
  pipeline.currentPipe().updateProgram(editor.getValue());
  let pipe = await pipeline.moveToNextPipe();
  updateDisplayedPipe(pipe);
  return pipe;
}
async function nextPipeline() {
  editor.getDoc().clearHistory();
  if (!pipeline.currentPipeIndex())
    pipeline.currentPipe().updateInput(inputWrapper.getValue());
  pipeline.currentPipe().updateProgram(editor.getValue());
  if (currentPipelineIndex < pipelines.length - 1) {
    currentPipelineIndex++;
    pipeline = await getPipeline(pipelines[currentPipelineIndex]);
    updateDisplayedPipe(pipeline.currentPipe());
    return;
  }
  let cur = pipelines.length;
  pipelines.push("New Pipeline " + cur);
  pipelinePrettyNames.push("New Pipeline " + cur);
  currentPipelineIndex = pipelines.length - 1;
  localStorage.setItem("pipelines", JSON.stringify(pipelines));
  localStorage.setItem("pipelinePrettyNames", JSON.stringify(pipelinePrettyNames));
  pipeline = await getPipeline(pipelines[currentPipelineIndex]);
  updateDisplayedPipe(pipeline.currentPipe());
}
async function prevPipeline() {
  if (!pipeline.currentPipeIndex())
    pipeline.currentPipe().updateInput(inputWrapper.getValue());
  pipeline.currentPipe().updateProgram(editor.getValue());
  if (!currentPipelineIndex) {
    return;
  }
  currentPipelineIndex--;
  pipeline = await getPipeline(pipelines[currentPipelineIndex]);
  updateDisplayedPipe(pipeline.currentPipe());
}
async function deletePipeline() {
  if (!currentPipelineIndex) return;
  pipelines.splice(currentPipelineIndex, 1);
  pipelinePrettyNames.splice(currentPipelineIndex, 1);
  localStorage.setItem("pipelines", JSON.stringify(pipelines));
  localStorage.setItem("pipelinePrettyNames", JSON.stringify(pipelinePrettyNames));
  if (currentPipelineIndex) currentPipelineIndex--;
  pipeline = await getPipeline(pipelines[currentPipelineIndex]);
  updateDisplayedPipe(pipeline.currentPipe());
}
function openFile() {
  const fileUpload = document.getElementById('file-upload');
  fileUpload.click();
}

var enc = new TextEncoder(); // always utf-8
// Initialize the example pipeline if necessary.
let savedPipelines = localStorage.getItem("pipelines");
if (!savedPipelines) {
  localStorage.setItem("pipelines", JSON.stringify(["Example Pipeline"]));
  localStorage.setItem("pipelinePrettyNames", JSON.stringify(["Example Pipeline"]));
  await Promise.all(examplePipeline.map(async (p) => {
    await localforage.setItem(p.key+"-input", p.input);
    await localforage.setItem(p.key+"-program", p.program);
    await localforage.setItem(p.key+"-output", p.output);
    await localforage.setItem(p.key+"-metadata", { files: p.files, lang: p.lang });
  }));
  // Add the example file.
  await localforage.setItem('file.tsv', enc.encode(`fjkdlsjfdkl\tfjkdslfdslk
  fdsjklfdjfkls\tfjdsklfjkdslfd
  dsjkldsjak\tdjskaldsjakl`).buffer);
  await localforage.setItem('table.csv', enc.encode(`id\tvalue
  fdsjklfdjfkls\tfjdsklfjkdslfd
  dsjkldsjak\tdjskaldsjakl`).buffer);

  let newPipeline = [];
  examplePipeline.forEach(p => {
    newPipeline.push({pid: p.key, lang: p.lang});
  });
  localStorage.setItem("Example Pipeline", JSON.stringify(newPipeline));
}

// Initialize the main pipeline data.
let pipelines = JSON.parse(localStorage.pipelines);
let pipelinePrettyNames = JSON.parse(localStorage.pipelinePrettyNames);
let currentPipelineIndex = pipelines.length - 1;
export let pipeline = await getPipeline(pipelines[currentPipelineIndex]);

// Update the awesome bar.
updateAwesomeBar();

// Set up the editor and input and output panes.
let editor = null;
let inputWrapper = null;
let outputWrapper = null;
export function setUpPanes(e, i, o, determineLanguageAndRun, runPipeline, interruptExecution) {
  editor = e;
  inputWrapper = i;
  outputWrapper = o;
  editor.setOption("extraKeys", {
        "Ctrl-Enter": determineLanguageAndRun,
        "Alt-Right": nextPipe,
        "Alt-Left": previousPipe,
        "Alt-A": insertAfter,
        "Alt-B": insertBefore,
        "Alt-D": deleteCurrent,
        "Alt-Up": nextPipeline,
        "Alt-Down": prevPipeline,
        "Alt-Q": deletePipeline,
        "Alt-R": runPipeline,
        "Ctrl-O": openFile,
        "Ctrl-C": interruptExecution,
        "Shift-Tab": false,
        "Ctrl-Space": "autocomplete",
      });
  [inputWrapper, outputWrapper].forEach(x => {
    let extraKeys = x.editor().getOption("extraKeys");
    x.editor().setOption("extraKeys", {
        ...extraKeys,
        "Ctrl-Enter": determineLanguageAndRun,
        "Alt-Right": nextPipe,
        "Alt-Left": previousPipe,
        "Alt-A": insertAfter,
        "Alt-B": insertBefore,
        "Alt-D": deleteCurrent,
        "Alt-Up": nextPipeline,
        "Alt-Down": prevPipeline,
        "Alt-Q": deletePipeline,
        "Alt-R": runPipeline,
        "Ctrl-O": openFile,
      });
  });
}

// Handle changes to the current pipeline's pretty name.
function updatePipelinePrettyName(name) {
  pipelinePrettyNames[currentPipelineIndex] = name;
  localStorage.setItem("pipelinePrettyNames", JSON.stringify(pipelinePrettyNames));
  updateAwesomeBar();
};
document.getElementById("pipeline-name").addEventListener('keydown', (event) => {
  const keyName = event.key;
  if (keyName == 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    updatePipelinePrettyName(event.target.textContent);
    event.target.blur();
  }
});

