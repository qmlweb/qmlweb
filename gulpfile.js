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
const path = require('path');

const qtcoreSources = [
  'src/engine/QmlWeb.js',
  'src/engine/QMLBinding.js',
  'src/engine/qmlstructure.js',
  'src/engine/import.js',
  'src/engine/qml.js',
  'src/engine/*.js',
  'src/qtbase/QObject.js',
  'src/qtbase/*.js',
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

gulp.task('license', () =>
  gulp.src(licenseSources)
    .pipe(order(licenseSources, { base: __dirname }))
    .pipe(concat('LICENSE'))
    .pipe(changed('./lib'))
    .pipe(gulp.dest('./lib'))
);

gulp.task('parser', () =>
  gulp.src(parserSources)
    .pipe(gulp.dest('./lib'))
);

gulp.task('parser-covered', () =>
  // This file is not covered here on a purpose.
  // Name *.covered.js is required to autoload from qt.covered.js.
  gulp.src('node_modules/qmlweb-parser/lib/qmlweb.parser.js')
    .pipe(rename('qmlweb.parser.covered.js'))
    .pipe(changed('./tmp'))
    .pipe(gulp.dest('./tmp'))
);

gulp.task('qmlweb-covered', () =>
  gulp.src(qtcoreSources)
    .pipe(order(qtcoreSources, { base: __dirname }))
    .pipe(sourcemaps.init())
    .pipe(istanbul({
      // This is what karma uses
      coverageVariable: '__coverage__'
    }))
    .pipe(concat('qt.covered.js'))
    .pipe(babel())
    .pipe(replace(/["']use strict["'];/g, ''))
    .pipe(iife({
      useStrict: false,
      params: ['global'],
      args: ['typeof global != \'undefined\' ? global : window']
    }))
    .pipe(changed('./tmp'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./tmp'))
);

gulp.task('qmlweb-dev', () =>
  gulp.src(qtcoreSources)
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
    .pipe(gulp.dest('./lib'))
);

gulp.task('qmlweb', ['qmlweb-dev'], () =>
  gulp.src('./lib/qt.js')
    .pipe(rename('qt.min.js'))
    .pipe(changed('./lib'))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./lib'))
);

gulp.task('build-covered', ['parser-covered', 'qmlweb-covered']);

gulp.task('build-dev', ['qmlweb-dev', 'parser', 'license']);

gulp.task('build', ['qmlweb', 'parser', 'license']);

gulp.task('watch', ['build'], () => {
  gulp.watch(qtcoreSources, ['qmlweb']);
  gulp.watch(parserSources, ['parser']);
  gulp.watch(licenseSources, ['license']);
});

gulp.task('watch-dev', ['build-dev'], () => {
  gulp.watch(qtcoreSources, ['qmlweb-dev']);
  gulp.watch(parserSources, ['parser']);
  gulp.watch(licenseSources, ['license']);
});

gulp.task('lint-tests', () =>
  gulp.src(tests)
    .pipe(eslint())
    .pipe(eslint.formatEach('compact', process.stderr))
    .pipe(eslint.failAfterError())
);

gulp.task('lint', ['lint-tests']);

gulp.task('test', ['lint', 'build-dev'], done => {
  new karma.Server({
    singleRun: true,
    configFile: path.join(__dirname, 'karma.conf.js')
  }, code => {
    process.exit(code);
  }).start();
});

gulp.task('coverage', ['lint', 'build-covered'], done => {
  new karma.Server({
    singleRun: true,
    coverageEnabled: true,
    configFile: path.join(__dirname, 'karma.conf.js')
  }, code => {
    process.exit(code);
  }).start();
});

gulp.task('test-watch', ['watch-dev'], done => {
  new karma.Server({
    configFile: path.join(__dirname, 'karma.conf.js')
  }, done).start();
});

gulp.task('test-debug', ['watch-dev'], done => {
  new karma.Server({
    configFile: path.join(__dirname, 'karma.conf.js'),
    browsers: ['PhantomJSCustom', 'Chrome'],
    reporters: ['progress'],
    debug: true
  }, done).start();
});

gulp.task('default', ['watch']);
