module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'lib/qt.js',
      'tests/**/*.js'
    ],
    browsers: ['PhantomJS'],
    singleRun: true,
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type: 'lcov',
      dir: 'coverage/'
    },
    preprocessors: {
      'lib/qt.js': ['coverage']
    }
  });
};
