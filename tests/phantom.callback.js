/* global page */
/*eslint prefer-spread: 1 */

module.exports = function(command, options) {
  if (command === "render") {
    if (options.offset) {
      page.clipRect = options.offset;
    }

    var system = require("system");
    if (options.fileName && system.env.QMLWEB_SAVE_RENDER) {
      page.render("tmp/render/" + options.fileName);
    }

    return page.renderBase64("PNG");
  } else
  if (command === "sendEvent") {
    page.sendEvent.apply(page, options);
  }
  return undefined;
};
