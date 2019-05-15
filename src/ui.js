const changeButtonUI = (camera = false) => {
  if (camera) {
    $('#pickimage').hide();
    $('#fps').show();
  } else {
    $('#pickimage').show();
    $('#fps').hide();
  }
};

const getUrlParam = (key) => {
  let searchParams = new URLSearchParams(location.search);
  return searchParams.get(key);
};

const hasUrlParam = (key) => {
  let searchParams = new URLSearchParams(location.search);
  return searchParams.has(key);
};

const isWebML = () => {
  if (navigator.ml && navigator.ml.getNeuralNetworkContext()) {
    if (!navigator.ml.isPolyfill) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

const toggleFullScreen = () => {
  let doc = window.document;
  let docEl = doc.documentElement;

  let requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  let cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
  }
};

const updateTitle = (name, backend, prefer, model, modeltype) => {
  model = model.replace(/_/g, ' ');
  $('#ictitle').html(`${name}`);
};

let up = getUrlParam('prefer');
let ub = getUrlParam('b');
let um = getUrlParam('m');
let us = getUrlParam('s');
let strsearch;

if (!location.search) {
  strsearch = `?prefer=none&b=WASM&m=none&s=image`;
  let path = location.href;
  location.href = path + strsearch;
}

const disableModel = () => {
  if (`${um}`) {
    let m_t = `${um}`;
    $('.model input').attr('disabled', false);
    $('.model label').removeClass('cursordefault');
    $('#' + m_t).attr('disabled', true);
    $('#l-' + m_t).addClass('cursordefault');
  }
}

const checkedModelStyle = () => {
  if (`${um}`) {
    $('.model input').removeAttr('checked');
    $('.model label').removeClass('checked');
    let m_t = `${um}`;
    $('#' + m_t).attr('checked', 'checked');
    $('#l-' + m_t).addClass('checked');
  }
}

$(document).ready(() => {

  if (us == 'camera') {
    $('.nav-pills li').removeClass('active');
    $('.nav-pills #cam').addClass('active');
    $('#imagetab').removeClass('active');
    $('#cameratab').addClass('active');
  } else {
    $('.nav-pills li').removeClass('active');
    $('.nav-pills #img').addClass('active');
    $('#cameratab').removeClass('active');
    $('#imagetab').addClass('active');
    $('#fps').html('');
  }

  if (hasUrlParam('b')) {
    $('.backend input').removeAttr('checked');
    $('.backend label').removeClass('checked');
    $('#' + getUrlParam('b')).attr('checked', 'checked');
    $('#l-' + getUrlParam('b')).addClass('checked');
  }

  if (hasUrlParam('m') && hasUrlParam('t')) {
    checkedModelStyle();
  }

  if (hasUrlParam('prefer')) {
    $('.prefer input').removeAttr('checked');
    $('.prefer label').removeClass('checked');
    $('#' + getUrlParam('prefer')).attr('checked', 'checked');
    $('#l-' + getUrlParam('prefer')).addClass('checked');
  }

  $('inpf:radio[name=m]').click(() => {
    $('.alert').hide();
    if (currentBackend && currentPrefer) {
      strsearch = `?prefer=${currentPrefer}&b=${currentBackend}&m=${um}&s=${us}`;
    } else {
      strsearch = `?prefer=${up}&b=${ub}&m=${um}&s=${us}}`;
    }
    window.history.pushState(null, null, strsearch);

    checkedModelStyle();
    disableModel();
    currentModel = `${um}`;
    main(us === 'camera');
  });

  $('#fullscreen i svg').click(() => {
    $('#fullscreen i').toggle();
    toggleFullScreen();
    $('video').toggleClass('fullscreen');
    $('#overlay').toggleClass('video-overlay');
    $('#fps').toggleClass('fullscreen');
    $('#fullscreen i').toggleClass('fullscreen');
    $('#ictitle').toggleClass('fullscreen');
    $('#inference').toggleClass('fullscreen');
  });

  $('#img').click(() => {
    $('.alert').hide();
    $('#fps').html('');
    $('ul.nav-pills li').removeClass('active');
    $('ul.nav-pills #img').addClass('active');
    $('#imagetab').addClass('active');
    $('#cameratab').removeClass('active');
  });

  $('#cam').click(() => {
    $('.alert').hide();
    $('ul.nav-pills li').removeClass('active');
    $('ul.nav-pills #cam').addClass('active');
    $('#cameratab').addClass('active');
    $('#imagetab').removeClass('active');
  });

  $('#img').click(() => {
    us = 'image';
    strsearch = `?prefer=${up}&b=${ub}&m=${um}&s=${us}`;
    window.history.pushState(null, null, strsearch);
    if (um === 'none') {
      showError('No model selected', 'Please select a model to start prediction.');
      return;
    }
    updateScenario();
  });

  $('#cam').click(() => {
    us = 'camera';
    strsearch = `?prefer=${up}&b=${ub}&m=${um}&s=${us}`;
    window.history.pushState(null, null, strsearch);
    if (um === 'none') {
      showError('No model selected', 'Please select a model to start prediction.');
      return;
    }
    updateScenario(true);
  });
});

const showProgress = async (text) => {
  $('#progressmodel').show();
  $('#progressstep').html(text);
  $('.shoulddisplay').hide();
  $('.icdisplay').hide();
  $('#resulterror').hide();
  await new Promise(res => setTimeout(res, 100));
}

const showResults = () => {
  $('#progressmodel').hide();
  $('.icdisplay').fadeIn();
  $('.shoulddisplay').fadeIn();
  $('#resulterror').hide();
}

const showError = (title, description) => {
  $('#progressmodel').hide();
  $('.icdisplay').hide();
  $('.shoulddisplay').hide();
  $('#resulterror').fadeIn();
  if (title && description) {
    $('.errortitle').html(title);
    $('.errordescription').html(description);
  } else {
    $('.errortitle').html('Prediction Failed');
    $('.errordescription').html('Please check error log for more details');
  }
}

const updateLoading = (loadedSize, totalSize, percentComplete) => {
  $('.loading-page .counter h1').html(`${loadedSize}/${totalSize}MB ${percentComplete}%`);
}

$(document).ready(() => {
  updateTitle('Real-time Person Segmentation', ub, up, um.replace(/_/g, ' '));

  input.addEventListener('change', (e) => {
    let files = e.target.files;
    if (files.length > 0) {
      image.src = URL.createObjectURL(files[0]);
    }
  }, false);

  image.addEventListener('load', () => {
    predictAndDraw(image, false);
  }, false);

  $('#img').click(() => {
    buttonUI(us === 'camera');
  });

  $('#cam').click(() => {
    buttonUI(us === 'camera');
  });

  $('#fullscreen i svg').click(() => {
    $('#canvasvideo').toggleClass('fullscreen');
  });

});

const selectBackgroundButton = chooseBackground;
const clearBackgroundButton = clearBackground;

$(window).load(() => {

  let colorPicker = new iro.ColorPicker('#color-picker-container', {
    width: 200,
    height: 200,
    color: {
      r: renderer.bgColor[0],
      g: renderer.bgColor[1],
      b: renderer.bgColor[2]
    },
    markerRadius: 5,
    sliderMargin: 12,
    sliderHeight: 20,
  });

  $('.bg-value').html(colorPicker.color.hexString);

  colorPicker.on('color:change', function (color) {
    $('.bg-value').html(color.hexString);
    renderer.bgColor = [color.rgb.r, color.rgb.g, color.rgb.b];
  });

  colorMapAlphaSlider.value = renderer.colorMapAlpha * 100;
  $('.color-map-alpha-value').html(renderer.colorMapAlpha);
  colorMapAlphaSlider.oninput = () => {
    let alpha = colorMapAlphaSlider.value / 100;
    $('.color-map-alpha-value').html(alpha);
    renderer.colorMapAlpha = alpha;
  };

  blurSlider.value = renderer.blurRadius;
  $('.blur-radius-value').html(renderer.blurRadius + 'px');
  blurSlider.oninput = () => {
    let blurRadius = parseInt(blurSlider.value);
    $('.blur-radius-value').html(blurRadius + 'px');
    renderer.blurRadius = blurRadius;
  };

  refineEdgeSlider.value = renderer.refineEdgeRadius;
  if (refineEdgeSlider.value === '0') {
    $('.refine-edge-value').html('DISABLED');
  } else {
    $('.refine-edge-value').html(refineEdgeSlider.value + 'px');
  }
  refineEdgeSlider.oninput = () => {
    let refineEdgeRadius = parseInt(refineEdgeSlider.value);
    if (refineEdgeRadius === 0) {
      $('.refine-edge-value').html('DISABLED');
    } else {
      $('.refine-edge-value').html(refineEdgeRadius + 'px');
    }
    renderer.refineEdgeRadius = refineEdgeRadius;
  };

  $('.effects-select .btn input').filter(function () {
    return this.value === renderer.effect;
  }).parent().toggleClass('active');

  $('.controls').attr('data-select', renderer.effect);

  $('.effects-select .btn').click((e) => {
    e.preventDefault();
    let effect = e.target.children[0].value;
    $('.controls').attr('data-select', effect);
    renderer.effect = effect;
  });

  selectBackgroundButton.addEventListener('change', (e) => {
    let files = e.target.files;
    if (files.length > 0) {
      let img = new Image();
      img.onload = function () {
        renderer.backgroundImageSource = img;
      };
      img.src = URL.createObjectURL(files[0]);
    }
  }, false);

  clearBackgroundButton.addEventListener('click', (e) => {
    renderer.backgroundImageSource = null;
  }, false);

  function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: Math.ceil(evt.clientX - rect.left),
      y: Math.ceil(evt.clientY - rect.top)
    };
  }

  canvasvideo.addEventListener('mousemove', (e) => {
    hoverPos = getMousePos(canvasvideo, e);
    renderer.highlightHoverLabel(hoverPos);
  });
  canvasvideo.addEventListener('mouseleave', (e) => {
    hoverPos = null;
    renderer.highlightHoverLabel(hoverPos);
  });

});

$(window).load(() => {
  if (um === 'none') {
    showError('No model selected', 'Please select a model to start prediction.');
    return;
  }
  disableModel();
  main(us === 'camera');
})