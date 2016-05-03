var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var changed = require('gulp-changed');
var order = require('gulp-order');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var iife = require('gulp-iife');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
var replace = require('gulp-replace');
var karma = require('karma');
var istanbul = require('gulp-istanbul');

var qtcoreSources = [
  'src/qtcore/qml/QMLBinding.js',
  'src/qtcore/qml/lib/parser.js',
  'src/qtcore/qml/lib/qmlstructure.js',
  'src/qtcore/qml/lib/import.js',
  'src/qtcore/*.js',
  'src/qtcore/qml/qml.js',
  'src/qtcore/qml/QMLBaseObject.js',
  'src/qtcore/qml/elements/Item.js',
  'src/qtcore/qml/**/*.js'
];

var tests = [
  'tests/**/*.js'
];

// This is required because other values confuse PhantomJS, and are sometimes
// set by default by the system.
process.env.QT_QPA_PLATFORM = '';

gulp.task('build-covered', function() {
  return gulp.src(qtcoreSources)
             .pipe(order(qtcoreSources, { base: __dirname }))
             .pipe(sourcemaps.init())
             .pipe(istanbul({
               // This is what karma uses
               coverageVariable: '__coverage__'
             }))
             .pipe(babel())
             .pipe(concat('qt.covered.js'))
             .pipe(replace(/["']use strict["'];/g, ''))
             .pipe(iife({
               useStrict: false,
               params: ['global'],
               args: ['typeof global != \'undefined\' ? global : window']
             }))
             .pipe(changed('./tmp'))
             .pipe(sourcemaps.write('./'))
             .pipe(gulp.dest('./tmp'));
});

gulp.task('build-dev', function() {
  return gulp.src(qtcoreSources)
             .pipe(order(qtcoreSources, { base: __dirname }))
             .pipe(sourcemaps.init())
             .pipe(babel())
             .pipe(concat('qt.js'))
             .pipe(replace(/"use strict";/g, ''))
             .pipe(iife({
                useStrict: false,
                params: ['global'],
                args: ['typeof global != \'undefined\' ? global : window']
             }))
             .pipe(changed('./lib'))
             .pipe(sourcemaps.write('./'))
             .pipe(gulp.dest('./lib'));
});

gulp.task('build', ['build-dev'], function() {
  return gulp.src('./lib/qt.js')
             .pipe(rename('qt.min.js'))
             .pipe(changed('./lib'))
             .pipe(sourcemaps.init({ loadMaps: true }))
             .pipe(uglify())
             .pipe(sourcemaps.write('./'))
             .pipe(gulp.dest('./lib'));
});

gulp.task('watch', ['build'], function() {
  gulp.watch(qtcoreSources, ['build']);
});

gulp.task('watch-dev', ['build-dev'], function() {
  gulp.watch(qtcoreSources, ['build-dev']);
});

gulp.task('lint-tests', function() {
  gulp.src(tests)
      .pipe(eslint())
      .pipe(eslint.formatEach('compact', process.stderr))
      .pipe(eslint.failAfterError());
});

gulp.task('lint', ['lint-tests']);

gulp.task('test', ['lint', 'build-covered'], function(done) {
  new karma.Server({
    singleRun: true,
    configFile: __dirname + '/karma.conf.js'
  }, function(code) {
    process.exit(code);
  }).start();
});

gulp.task('test-watch', ['watch-dev'], function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('test-debug', ['watch-dev'], function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    browsers: ['PhantomJSCustom', 'Chrome'],
    preprocessors: {},
    reporters: ['progress'],
    debug: true
  }, done).start();
});

gulp.task('default', ['watch']);
