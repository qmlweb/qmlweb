var gulp    = require('gulp');
var gutil   = require('gulp-util');
var uglify  = require('gulp-uglify');
var concat  = require('gulp-concat');
var rename  = require('gulp-rename');
var jasmine = require('gulp-jasmine-phantom');

var qtcoreSources = [
  './src/helpers/encapsulate.begin.js',
  './src/qtcore/qml/QMLBinding.js',

  './src/uglify/ast.js',
  './src/uglify/parse.js',
  './src/uglify/utils.js',

  './src/qtcore/qml/lib/parser.js',
  './src/qtcore/qml/lib/process.js',
  './src/qtcore/qml/lib/import.js',

  './src/qtcore/qrc.js',
  './src/qtcore/qt.js',
  './src/qtcore/signal.js',
  './src/qtcore/font.js',
  './src/qtcore/easing.js',
  './src/qtcore/utils.js',
  './src/qtcore/qml/qml.js',
  './src/qtcore/qml/**/*.js',

  './src/qmlweb/**/*.js',
  './src/helpers/encapsulate.end.js'
];

var tests = [ './lib/qt.js', './spec/**/*.js' ];

gulp.task('qt', function() {
  return gulp.src(qtcoreSources).pipe(concat('qt.js')).pipe(gulp.dest('./lib'));
});

gulp.task('min-qt', ['qt'], function() {
  return gulp.src('./lib/qt.js').pipe(rename('qt.min.js')).pipe(uglify()).pipe(gulp.dest('./lib'));
});

gulp.task('compile-tests', ['qt'], function() {
  return gulp.src(tests).pipe(concat('spec.js')).pipe(gulp.dest('.'));
});

gulp.task('tests', ['compile-tests'], function() {
  return gulp.src('spec.js').pipe(jasmine({ integration: true }));
});

gulp.task('default', ['qt', 'min-qt', 'compile-tests'],function() {
   gulp.watch(qtcoreSources, ['qt', 'min-qt', 'compile-tests']);
   gulp.watch(['.spec/**/*.js'], ['compile-tests']);
});
