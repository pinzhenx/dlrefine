let currentBackend = getSearchParamsBackend();
let currentModel = getSearchParamsModel();
let currentPrefer = getSearchParamsPrefer();
let streaming = false;
let stats = new Stats();
let track;
let currentTab = 'image';
let hoverPos = null;
const counterN = 20;
let counter = 0;
let inferTimeAcc = 0;
let drawTimeAcc = 0;


const semanticSegmentationModels = [{
  modelName: 'Deeplab 513 (TFLite)',
  modelFormatName: 'model_513',
  modelSize: '8.4MB',
  modelFile: './model/model513.tflite',
  labelsFile: './model/labels.txt',
  inputSize: [513, 513, 3],
  outputSize: [513, 513, 1],
  preOptions: {
    mean: [127.5, 127.5, 127.5],
    std: [127.5, 127.5, 127.5],
  },
}];

const showAlert = (error) => {
  console.error(error);
  let div = document.createElement('div');
  div.setAttribute('class', 'backendAlert alert alert-warning alert-dismissible fade show');
  div.setAttribute('role', 'alert');
  div.innerHTML = `<strong>${error}</strong>`;
  div.innerHTML += `<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>`;
  let container = document.getElementById('container');
  container.insertBefore(div, container.firstElementChild);
};

const updateProgress = (ev) => {
  if (ev.lengthComputable) {
    let totalSize = ev.total / (1000 * 1000);
    let loadedSize = ev.loaded / (1000 * 1000);
    let percentComplete = ev.loaded / ev.total * 100;
    percentComplete = percentComplete.toFixed(0);
    progressBar.style = `width: ${percentComplete}%`;
    updateLoading(loadedSize.toFixed(1), totalSize.toFixed(1), percentComplete);
  }
};

let renderer = new Renderer(canvasvideo);
renderer.setup();

let utils = new Utils();
utils.updateProgress = updateProgress;

const logConfig = () => {
  console.log(`Model: ${currentModel}, Backend: ${currentBackend}, Prefer: ${currentPrefer}`);
};

const errorHandler = (e) => {
  showAlert(e);
  showError(null, null);
};

const getSupportedOps = (backend, prefer) => {
  return getDefaultSupportedOps(backend, prefer);
};

let requiredOps = async () => {
  return utils.getRequiredOps();
};

const getOffloadOps = async (backend, preder) => {
  // update the global variable `supportedOps` defined in the base.js
  supportedOps = getSupportedOps(backend, preder);
  let requiredops = await requiredOps();
  let intersection = new Set([...supportedOps].filter(x => requiredops.has(x)));
  console.log('NN supported: ' + [...supportedOps]);
  console.log('Model required: ' + [...requiredops]);
  console.log('Ops offload: ' + [...intersection]);
};

const startPredict = async () => {
  if (streaming) {
    try {
      stats.begin();
      await predictAndDraw(video, true);
      stats.end();
      setTimeout(startPredict, 0);
    } catch (e) {
      errorHandler(e);
    }
  }
};

const predictCamera = async () => {
  try {
    let init = await utils.init(currentBackend, currentPrefer);    
    if (init == 'NOT_LOADED') {
      return;
    }
    streaming = true;
    // let res = utils.getFittedResolution(4 / 3);
    // setCamResolution(res);
    let stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user' } });
    video.srcObject = stream;
    track = stream.getTracks()[0];
    showProgress('Inferencing ...');
    video.onloadeddata = startPredict;
  } catch (e) {
    errorHandler(e);
  }
};

const predictAndDraw = async (source, camera = false) => {
  if (!camera) {
    streaming = false;
    if (track) track.stop();
  }
  const clippedSize = utils.prepareInput(source);
  renderer.uploadNewTexture(source, clippedSize);
  let result = await utils.predict();
  let inferTime = result.time;
  console.log(`Inference time: ${inferTime.toFixed(2)} ms`);
  inferenceTime.innerHTML = `inference time: <span class='ir'>${inferTime.toFixed(2)} ms</span>`;
  renderer.drawOutputs(result.segMap)
  renderer.highlightHoverLabel(hoverPos);
  showResults();
  changeButtonUI(us === 'camera');
};

const predictPath = (camera) => {
  camera ? predictCamera() : predictAndDraw(image, false);
};

const updateScenario = async (camera = false) => {
  streaming = false;
  logConfig();
  predictPath(camera);
};

const main = async (camera = false) => {
  if (currentModel === 'none_none') {
    errorHandler('No model selected');
    return;
  }
  console.log(currentModel)
  streaming = false;
  try { utils.deleteAll(); } catch (e) { }
  logConfig();
  showProgress('Loading model and initializing...');
  try {
    let model = semanticSegmentationModels.filter(f => f.modelFormatName == currentModel);
    await utils.loadModel(model[0]);
    getOffloadOps(currentBackend, currentPrefer);
    await utils.init(currentBackend, currentPrefer);
  } catch (e) {
    errorHandler(e);
  }
  predictPath(camera);
};
