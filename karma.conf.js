module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'lib/qt.js',
      'tests/**/*.js'
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
    }
  });
};
