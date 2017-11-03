const   gulp            = require("gulp"),
        typescript      = require("typescript"),
        ts              = require("gulp-typescript"),
        browserify      = require("browserify"),
        source          = require("vinyl-source-stream"),
        del             = require("del"),
        tcm             = require("typed-css-modules"),
        gulp_tcm        = require("gulp-typed-css-modules"),
        css_modulsify   = require("css-modulesify"),
        path            = require("path"),
        concat          = require("gulp-concat"),
        stylus          = require("gulp-stylus"),
        rename          = require("gulp-rename"),
        autoprefixer    = require("autoprefixer"),
        mqp             = require("css-mqpacker"),
        cssnano         = require("cssnano"),
        camelCase       = require("postcss-camel-case");


let project = ts.createProject('tsconfig.json', {typescript: typescript});

let assets = [
    'src/index.html'
];

gulp.task("through", function () {
    return gulp.src(assets)
        .pipe(gulp.dest('dist'));
});

gulp.task("tcm", function () {
    return gulp.src("src/**/*.styl")
        .pipe(stylus())
        .pipe(gulp.dest('build'))
        .pipe(gulp_tcm({
            tcm: tcm,
            camelCase: true
        }))
        .pipe(gulp.dest("build/tcm"));
});

gulp.task("compile", ["tcm"], function () {
    let result = gulp.src('src/**/*.{ts,tsx}')
        .pipe(project());

    return result.js.pipe(gulp.dest("build"));
});

gulp.task("bundle", ["through", "compile"], function () {
    let b = browserify('build/app.js', {'standalone': 'App'});
    b.plugin(css_modulsify, {
        'rootDir': path.join(__dirname, "build/tcm/"),
        'output': 'dist/app.css',
        'generateScopedName': css_modulsify.generateShortName,
        'before': [camelCase()],
        'after': [autoprefixer(), mqp(), cssnano()]
    });

    return b.bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function (done) {
    return del(['build', 'dist'], done.bind(this));
});