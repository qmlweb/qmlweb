var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var changed = require('gulp-changed');
var order = require('gulp-order');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var eslint = require('gulp-eslint');
var karma = require('karma');

var qtcoreSources = [
  'src/helpers/encapsulate.begin.js',
  'src/qtcore/qml/QMLBinding.js',

  'src/qtcore/qml/lib/parser.js',
  'src/qtcore/qml/lib/process.js',
  'src/qtcore/qml/lib/import.js',

  'src/qtcore/qrc.js',
  'src/qtcore/qt.js',
  'src/qtcore/signal.js',
  'src/qtcore/font.js',
  'src/qtcore/easing.js',
  'src/qtcore/qml/qml.js',
  'src/qtcore/qml/**/*.js',

  'src/qmlweb/**/*.js',
  'src/helpers/encapsulate.end.js'
];

var tests = [
  'tests/**/*.js'
];

gulp.task('build-dev', function() {
  return gulp.src(qtcoreSources)
             .pipe(order(qtcoreSources, { base: __dirname }))
             .pipe(sourcemaps.init())
             .pipe(concat('qt.js'))
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

gulp.task('test', ['lint', 'build'], function(done) {
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
