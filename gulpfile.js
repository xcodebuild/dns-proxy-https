var gulp = require("gulp"),
    util = require("gulp-util"),
    mocha = require("gulp-mocha")
    compiler = require("gulp-babel"),
    sourcemap = require("gulp-sourcemaps");
    header = require("gulp-header"),
    eslint = require('gulp-eslint'),
    plumber = require('gulp-plumber'),
    clean = require("gulp-clean");

gulp.task('default', ['test']);

gulp.task("watch", function(){
  gulp.watch('src/**/*.js', ['default']);
});

gulp.task('test', ['clean','compile'], function(){
  return gulp.src("build/src/**/*.spec.js")
    .pipe(mocha());
});

gulp.task('compile',['lint'], function(){
  return gulp.src('src/**/*.js')
    .pipe(header("require('source-map-support').install();"))
    .pipe(sourcemap.init())
    .pipe(compiler())
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/src"));
});

gulp.task('lint', function(done) {
  return gulp.src("src/**/*.js")
    .pipe(plumber())
    .pipe(eslint({
      configFile: './.eslintrc',
      envs: [
        'node'
      ]
    }))
    .pipe(eslint.formatEach('stylish', process.stderr))
    .pipe(eslint.failOnError())
});

gulp.task('clean', function(){
  return gulp.src('build/src/*', {read: false})
    .pipe(clean());
});
