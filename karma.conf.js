module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'lib/qt.js',
      'tests/common.js',
      'tests/*/**/*.js',
      { pattern: 'tests/*/**/*.qml', included: false }
    ],
    browsers: ['PhantomJS'],
    reporters: process.env.COVERALLS_REPO_TOKEN ?
                   ['progress', 'coverage', 'coveralls'] :
                   ['progress', 'coverage'],
    coverageReporter: {
      type: 'lcov',
      dir: 'coverage/'
    },
    preprocessors: {
      'lib/qt.js': ['coverage']
    },

  });
};
