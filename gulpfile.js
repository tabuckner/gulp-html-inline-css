const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const autoprefixer = require('gulp-autoprefixer');
const inlineSource = require('gulp-inline-source');
const purgeCss = require('gulp-purgecss');
const cleanCSS = require('gulp-clean-css');
const inlineCss = require('@thasmo/gulp-juice');
const runSequence = require('run-sequence');
const pug = require('gulp-pug');


gulp.task('default', ['browser-sync', 'html:views'], () => {
  gulp.watch('app/**/*.html').on('change', reload);
  gulp.watch('app/**/*.css').on('change', reload);
  gulp.watch('app/src/**/*.pug', ['html:views']);
});

/**
 * Live Server for Development.
 * (Styles not inlined at this point)
 * Will serve compiled Pug and live reload on all changes
 * to `app/src/**`
 */
gulp.task('browser-sync', () => {
  browserSync.init({
    server: {
      baseDir: "./app/src"
    },
    port: 3000,
    open: false
  });
});

/**
 * Build Task to Handle Inlining of All CSS
 * AND creating a individual HTML file to be made available
 * in Public/ directory of DCP API
 */
gulp.task('build', (done) => {
  runSequence(
    'imgMin',
    'html:views',
    'html:copy',
    'css:copy',
    'css:prefix',
    'css:min',
    'css:clean',
    'css:inject',
    'css:inline',
    'html:min',
    done);
});

/**
 * CSS TASKS
 */
// Copies to build dir.
gulp.task('css:copy', () => {
  return gulp.src('app/src/styles/**/*.css')
    .pipe(gulp.dest('app/build/styles/'));
});

// Adds vendor prefixes to TAL CSS in place.
gulp.task('css:prefix', () => {
  return gulp.src('app/build/styles/**/*.css') // FIXME: test this.
    .pipe(autoprefixer({
      browsers: ['cover 99.5%'],
    }))
    .pipe(gulp.dest('app/build/styles/'));
});

// Minifies source CSS in place.
gulp.task('css:min', () => {
  return gulp.src('app/build/styles/**/*.css')
    .pipe(cleanCSS({}, (details) => {
      const reduction = details.stats.originalSize - details.stats.minifiedSize;
      const percentage = Math.round((reduction / details.stats.originalSize) * 100)
      console.log(`${details.name}: Reduced [${percentage}%]`);
      console.log(`Original: ${details.stats.originalSize}, Minified: ${details.stats.minifiedSize}`);
    }))
    .pipe(gulp.dest('app/build/styles'));
});

// Removes unused CSS.
gulp.task('css:clean', () => {
  return gulp.src('app/build/styles/**/*.css')
    .pipe(purgeCss({ content: ['app/src/**/*.html'] }))
    .pipe(gulp.dest('app/build/styles'));
})

// Injects all used CSS into style tags in head.
gulp.task('css:inject', () => {
  return gulp.src('app/build/**/*.html')
    .pipe(inlineSource())
    .pipe(gulp.dest('dist/'));
});

// Inlines all CSS that is able to be inlined.
gulp.task('css:inline', () => {
  return gulp.src('dist/*.html')
    .pipe(inlineCss({
      insertPreservedExtraCss: true,
      preserveMediaQueries: true
    }))
    .pipe(gulp.dest('dist/'));
});

/**
 * IMAGE TASKS
 */
// Minifies images. (not currently used)
gulp.task('imgMin', () => {
  return gulp.src('app/src/img/**/*')
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true,
        colors: 48,
        optimizationLevel: 3
      })
    ]))
    .pipe(gulp.dest('dist/img'))
});

/**
 * HTML TASKS
 */
// Builds pug views.
gulp.task('html:views', () => {
  return gulp.src('app/src/views/**/*.pug')
    .pipe(pug({
      pretty: true,
    }))
    .pipe(gulp.dest('app/src/'));
});

// Copies HTML into build dir.
gulp.task('html:copy', () => {
  return gulp.src('app/src/**/*.html')
    .pipe(gulp.dest('app/build/'));
})

// Minifies HTML
gulp.task('html:min', () => {
  return gulp.src('dist/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyURLs: true,
      minifyCSS: true,
    }))
    .pipe(gulp.dest('dist/'));
});
