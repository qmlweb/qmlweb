module.exports = function(command, options) {
  if (options.offset)
    page.clipRect = options.offset;

  var system = require('system');
  if (options.fileName && system.env.QMLWEB_SAVE_RENDER)
    page.render('tmp/render/' + options.fileName);

  return page.renderBase64('PNG');
};
