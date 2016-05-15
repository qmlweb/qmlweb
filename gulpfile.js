const gulp = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const changed = require('gulp-changed');
const order = require('gulp-order');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const iife = require('gulp-iife');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const replace = require('gulp-replace');
const karma = require('karma');
const istanbul = require('gulp-istanbul');

const qtcoreSources = [
  'src/qtcore/qml/QMLBinding.js',
  'src/qtcore/qml/qmlstructure.js',
  'src/qtcore/qml/import.js',
  'src/qtcore/*.js',
  'src/qtcore/qml/qml.js',
  'src/qtcore/qml/*.js',
  'src/modules/**/*.js'
];

const parserSources = [
  'node_modules/qmlweb-parser/lib/*'
];

const licenseSources = [
  'LICENSE',
  'node_modules/qmlweb-parser/LICENSE'
];

const tests = [
  'tests/**/*.js'
];

// This is required because other values confuse PhantomJS, and are sometimes
// set by default by the system.
process.env.QT_QPA_PLATFORM = '';

gulp.task('license', function() {
  return gulp.src(licenseSources)
             .pipe(order(licenseSources, { base: __dirname }))
             .pipe(concat('LICENSE'))
             .pipe(changed('./lib'))
             .pipe(gulp.dest('./lib'));
});

gulp.task('parser', function() {
  return gulp.src(parserSources)
             .pipe(gulp.dest('./lib'));
});

gulp.task('parser-covered', function() {
  // This file is not covered here on a purpose.
  // Name *.covered.js is required to autoload from qt.covered.js.
  return gulp.src('node_modules/qmlweb-parser/lib/qmlweb.parser.js')
             .pipe(rename('qmlweb.parser.covered.js'))
             .pipe(changed('./tmp'))
             .pipe(gulp.dest('./tmp'));
});

gulp.task('qmlweb-covered', function() {
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

gulp.task('qmlweb-dev', function() {
  return gulp.src(qtcoreSources)
             .pipe(order(qtcoreSources, { base: __dirname }))
             .pipe(sourcemaps.init())
             .pipe(concat('qt.js'))
             .pipe(babel())
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

gulp.task('qmlweb', ['qmlweb-dev'], function() {
  return gulp.src('./lib/qt.js')
             .pipe(rename('qt.min.js'))
             .pipe(changed('./lib'))
             .pipe(sourcemaps.init({ loadMaps: true }))
             .pipe(uglify())
             .pipe(sourcemaps.write('./'))
             .pipe(gulp.dest('./lib'));
});

gulp.task('build-covered', ['parser-covered', 'qmlweb-covered']);

gulp.task('build-dev', ['qmlweb-dev', 'parser', 'license']);

gulp.task('build', ['qmlweb', 'parser', 'license']);

gulp.task('watch', ['build'], function() {
  gulp.watch(qtcoreSources, ['qmlweb']);
  gulp.watch(parserSources, ['parser']);
  gulp.watch(licenseSources, ['license']);
});

gulp.task('watch-dev', ['build-dev'], function() {
  gulp.watch(qtcoreSources, ['qmlweb-dev']);
  gulp.watch(parserSources, ['parser']);
  gulp.watch(licenseSources, ['license']);
});

gulp.task('lint-tests', function() {
  return gulp.src(tests)
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
