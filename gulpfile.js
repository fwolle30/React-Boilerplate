/* Gulp plugins */
const gulp = require('gulp'); // gulp base api
const stylus = require('gulp-stylus'); // needed for converting .styl files to css
const gtcm = require('gulp-typed-css-module4'); // create type definition for css modules used in typescript
const gulpReplace = require('gulp-replace');

/* Utilitys */
const path = require('path');
const del = require('del'); // rm -rf in node.
const rollup = require('rollup'); // module bundler
const merge2 = require('merge2'); // stream merger

/* Rollup Plugins */
const replace = require('rollup-plugin-replace');
const typescript = require('rollup-plugin-typescript2'); // add typescript support
const resolve = require('rollup-plugin-node-resolve'); // needed for nodejs modules
const commonjs = require('rollup-plugin-commonjs'); //  needed for nodejs modules
const postCss = require('rollup-plugin-postcss'); // css processor for prefixing/minimizing/packing
const { uglify } = require('rollup-plugin-uglify');

/* PostCSS Plugins */
const autoprefixer = require('autoprefixer'); // use the caniuse-db to add browser prefixes
// const cssnano = require('cssnano'); // minimize css files
const mqp = require('css-mqpacker'); // combine equal mediaquerys to one

const DEFAULT_TYPE = 'development';
// const DEFAULT_TYPE = 'production';

var options = {
  'type': DEFAULT_TYPE
};

var keyRegex = new RegExp(`^(--${Object.keys(options).join('|--')})`);
process.argv
  .filter(arg => keyRegex.test(arg))
  .forEach((param) => {
    let [key, value] = param.split('=');
    options[key.replace('--', '')] = value;
  });

const isPrd = (options.type === 'production');

const PROJECT_NAME = 'example';

const BUILD_DIR = './build/';
const DIST_DIR = './dist/';
const OUT_NAME = `${PROJECT_NAME}-bundle${isPrd ? '.min' : ''}.js`;
const CSS_OUT_NAME = `${PROJECT_NAME}-bundle${isPrd ? '.min' : ''}.css`;
const SRC_MAP_NAME = `${PROJECT_NAME}-bundle${isPrd ? '.min' : ''}.map`;

const CONF_VARS = {
  BUILD_DIR,
  DIST_DIR,
  OUT_NAME,
  CSS_OUT_NAME,
  SRC_MAP_NAME
};

const confVarsRegex = new RegExp(`__(${Object.keys(CONF_VARS).join('|')})__`, 'g');
const regexedBuildDir = regexPath(BUILD_DIR);

/* Helper */

function regexPath (dir) {
  let normDir = dir.replace(/(\\|\/)/g, path.sep);
  if (!normDir.endsWith(path.sep)) {
    normDir = normDir + path.sep;
  }

  normDir = normDir.replace(/^\.+/, '');

  if (!normDir.startsWith(path.sep)) {
    normDir = path.sep + normDir;
  }

  normDir = normDir.replace(/\\/g, '\\\\');

  return normDir;
}

/* Tasks:
  tcm: Create type definitions for CSS classes.
  copysrc: Copy .ts or .tsx source files to the build directory (workaround for typescript not finding css modules).
  copyassets: Copy everything in the asset folder to dist.
  build: Transpile and bundles typescript files and css modules.
  clean: Removes build and dist folder. Basically start from scratch.
*/

gulp.task(function tcm () {
  return gulp.src('./src/**/*.styl') // find all .styl files in src and sub directorys
    .pipe(stylus()) // convert to css
    .pipe(gtcm({ // create typings from css
      camelCase: true,
      gulp: {
        addEnforcer: true,
        asNamespace: true
      }
    }))
    .pipe(gulp.dest(BUILD_DIR));
});

gulp.task(function copysrc () {
  return gulp.src('./src/**/*.ts+(|x)') // find all .ts and .tsx files ..
    .pipe(gulpReplace(confVarsRegex, function (match, p1) {
      if (p1 in CONF_VARS) {
        return CONF_VARS[p1];
      }

      return match;
    }))
    .pipe(gulp.dest(BUILD_DIR)); // and copy them to build
});

gulp.task(function copyassets () {
  return merge2([
    gulp.src('./src/index.html'), // find all asset files ..
    gulp.src('./src/assets/**/*.*')
  ])
    .pipe(gulpReplace(confVarsRegex, function (match, p1) {
      if (p1 in CONF_VARS) {
        return CONF_VARS[p1];
      }

      return match;
    }))
    .pipe(gulp.dest(DIST_DIR)); // and copy them to dist
});

gulp.task('build', gulp.series('tcm', 'copyassets', 'copysrc', async function bundle (done) {
  let doNotConvert = [
    '/build/index.css'
  ];

  const bundle = await rollup.rollup({
    input: `./${BUILD_DIR}/index.tsx`, // entrypoint
    plugins: [
      resolve({ // allow rollup to find nodejs_modules ..
        jsnext: true,
        main: true,
        browser: true
      }),
      commonjs({ // and to use them.
        namedExports: {
          'node_modules/react-dom/index.js': ['render', 'findDOMNode'],
          'node_modules/react/index.js': ['createElement', 'Component', 'Children', 'cloneElement', 'Fragment']
        }
      }),
      typescript({ // add support for typescript
        typescript: require('typescript'), // use our typscript compiler, instead of the bundled one
        tsconfigOverride: { // overwrite tsconfig for rollup
          'compilerOptions': {
            'rootDir': BUILD_DIR,
            'module': 'ES2015',
            'sourceMap': true
          },
          'include': [
            `${BUILD_DIR}**/*.ts`,
            `${BUILD_DIR}**/*.tsx`
          ]
        }
      }),
      postCss({ // import and use css files
        extract: true, // we want a css file. Default: inject css string to head
        namedExports: true, // export classname map as object e.g. {'item__frame--active': 'index_item__frame--active_xasda'}
        modules: { // use modules. classnames will be rewitten to {file}_{class}_{unique string} to awoid collisions
          /* Our tcm creates typedefinition using camelCase e.g. .item__frame--active becomes itemFrameActive, to prevent illegal javascript names.
             To mimic this behavior for our translation table, we need to tranform the json here as well. */
          getJSON: function (filepath, json) {
            var newJSON = {};
            Object.keys(json).forEach(function (key) { // iterate over every key..
              var newKey = key.replace(/([-_]+)./g, function (match) { // and find any character next to '-' or '_' (including themself) ..
                return match.substr(-1).toUpperCase(); // and convert them to uppercase. (item__frame--active => [__f => F, --a => A])
              });

              newJSON[newKey] = json[key];
            });
            return newJSON;
          },
          generateScopedName: function (name, filename, css) {
            let type = css.substr(css.indexOf(name) - 1, 1);

            if (type.startsWith('#') || doNotConvert.find(e => path.join(__dirname, e) === filename)) {
              return name;
            } else {
              let baseName = path.basename(filename).replace(/\.[a-z0-9]+$/gi, '');
              let hash = Buffer.from(css).toString('base64').substr(0, 5);

              return `${baseName}__${name}--${hash}`;
            }
          }
        },
        plugins: [autoprefixer(), mqp()] // transform our css e.g. add prefixes, pack media querys
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify(isPrd ? 'production' : 'development') // help react running in a browser... (Facebook!! Why??)
      }),
      isPrd && uglify({}, require('uglify-es').minify)
    ]
  });

  await bundle.write({ // write the bundled files
    file: `${DIST_DIR}${OUT_NAME}`, // output
    name: 'reactApp', // required but ignored (WTF??)
    sourcemap: `${SRC_MAP_NAME}`, // sourcemaps for chrome dev tool.
    sourcemapPathTransform: (filename) => { // transform sourcepath from build to src (enables you to use VSCode Debug with breakpoints)
      let testStr = `${regexedBuildDir}.*\\.tsx?`;

      if (filename.match(new RegExp(testStr))) {
        filename = filename.replace(new RegExp(regexedBuildDir), `${path.sep}src${path.sep}`);
      }

      return filename;
    },
    format: 'iife', // export as an immediate invoked function expression (iife) for scope isolation. => http://www.nicoespeon.com/en/2013/05/properly-isolate-variables-in-javascript/
    globals: [] // if we use jquery or any dependencies that are loaded from our html page, we can add them here. Rollup will happily ignore them.
  });

  done();
}));

gulp.task('clean', function (done) {
  return del([BUILD_DIR, DIST_DIR, '.rpt2_cache'], done.bind(this)); // delete 'build' and 'dist' folder.
});
