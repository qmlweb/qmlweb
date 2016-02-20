
module.exports = function(config) {
  require("./karma.conf.js")(config)
  config.browsers.push("Chrome")
  config.set({
    debug: true,
  });
};
