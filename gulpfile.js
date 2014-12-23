var gulp   = require('gulp');
var gutil  = require('gulp-util');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var qtcoreSources = [
  './src/helpers/encapsulate.begin.js',
  './src/qtcore.prototype.js',
  './src/qtcore/qt.js',
  './src/qtcore/signal.js',
  './src/qtcore/font.js',
  './src/qtcore/easing.js',
  './src/qtcore/qml/*.js',
  './src/qtcore/qml/**/*.js',
  './src/qmlweb/**/*.js',
  './src/helpers/encapsulate.end.js'
];

var allSources = [
  './lib/parser.js', './lib/process.js', './lib/import.js', './lib/qtcore.js'
];

gulp.task('qtcore', function() {
  return gulp.src(qtcoreSources).pipe(concat('qtcore.js')).pipe(gulp.dest('./lib'));
});

gulp.task('qt', function() {
  return gulp.src(allSources).pipe(concat('qt.js')).pipe(gulp.dest('./lib'));
});

gulp.task('default', ['qtcore', 'qt'],function() {
   gulp.watch(qtcoreSources, ['qtcore']);
   gulp.watch(allSources,    ['qt']);
});
