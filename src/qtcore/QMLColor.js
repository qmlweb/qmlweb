// TODO
function QMLColor(val) {
  if (typeof val === "number") {
    // we assume it is int value and must be converted to css hex with padding
    // http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
    val = "#" + (Math.round(val) + 0x1000000).toString(16).substr(-6).toUpperCase();
  } else {
    if(typeof val === "array" && val.length >= 3) {
      // array like [r,g,b] where r,g,b are in 0..1 range
      var m = 255;
      val = "rgb(" + Math.round(m * val[0]) + "," + Math.round(m * val[1]) + "," + Math.round(m * val[2]) + ")";
    }
  }
  return val;
};
