'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');

gulp.task('babel', () => {
    gulp
        .src('./script/kujirax/**/*.js')
        .pipe(plumber())
        .pipe(babel({
            'presets': [
                'stage-3', ['env', { 'targets': { 'node': '6.12.2' } }]
            ],
            'plugins': ['transform-runtime']
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch', () => gulp.watch('./script/kujirax/**/*.js', ['babel']));

gulp.task('default', ['babel', 'watch']);