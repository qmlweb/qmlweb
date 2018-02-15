QmlWeb.screenshot = function(div, options) {
  const rect = div.getBoundingClientRect();
  const offset = {
    width: div.offsetWidth,
    height: div.offsetHeight,
    top: rect.top,
    left: rect.left
  };
  for (let win = window; win !== window.top; win = win.parent) {
    const rectframe = win.frameElement.getBoundingClientRect();
    offset.top += rectframe.top;
    offset.left += rectframe.left;
  }
  const fileName = options && options.fileName || undefined;

  let image;
  if (window.top.chromeScreenshot) {
    image = document.createElement("img");
    window.top.chromeScreenshot({ offset, fileName })
      .then(base64 => {
        image.src = `data:image/png;base64,${base64}`;
      });
  } else if (window.top.callPhantom) {
    const base64 = window.top.callPhantom("render", { offset, fileName });
    image = document.createElement("img");
    image.src = `data:image/png;base64,${base64}`;
  } else {
    throw new Error("Screenshots are not supported on this platform");
  }
  return image;
};

QmlWeb.image2canvas = function(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.height = img.height;
  canvas.width = img.width;
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
};

QmlWeb.image2dataUrl = function(img) {
  const { canvas } = QmlWeb.image2canvas(img);
  return canvas.toDataURL("image/png", 1);
};

QmlWeb.image2pixels = function(img) {
  const { ctx } = QmlWeb.image2canvas(img);
  return ctx.getImageData(0, 0, img.width, img.height).data;
};

QmlWeb.imagesEqual = function(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    return false;
  }
  return QmlWeb.image2dataUrl(a) === QmlWeb.image2dataUrl(b);
};
