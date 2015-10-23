var gulp = require('gulp'),
    file = require('gulp-file'),
    filenames = require('gulp-filenames'),
    gulpif = require('gulp-if'),
    imagemin = require('gulp-imagemin'),
    beautify = require('gulp-jsbeautify'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    Elixir = require('laravel-elixir'),
    merge = require('merge-stream'),
    path = require('path'),
    exists = require('path-exists').sync,
    sequence = require('run-sequence'),
    config = Elixir.config;

/**
 * Publish  javascript main files into another folder
 * @param  {string|object}  outputDir     The destination folder or an options object
 * @param  {object}         options       Options object passed to bower-files
 */
Elixir.extend('bowerJs', function(outputDir, options) {
    // Options were provided on the outputDir parameter
    if (typeof outputDir == 'object') {
        options = outputDir;
        outputDir = null;
    }

    options = typeof options == 'undefined' ? {camelCase: false} : options;

    var paths = new Elixir.GulpPaths()
        .output(outputDir || config.get('assets.js.folder') + '/vendor');

    new Elixir.Task('bowerJs', function () {
        var bower_components = require('bower-files')(options);
        var getMinifiedScripts = function (path, index, arr) {
                var newPath = path.replace(/.([^.]+)$/g, '.min.$1');
                return exists( newPath ) ? newPath : path;
            },
            isNotMinified = function(file) {
                var filename = file.history[file.history.length - 1];
                return !(/\.min\.js$/.test(filename));
            },
            uglifyScripts = function(file) {
                return isNotMinified(file) && config.production;
            },
            jsfiles = bower_components.ext('js').deps,
            tasks = [],
            createFolder;

        for (var packageName in jsfiles) {
            if (jsfiles[packageName].length) {
                jsfiles[packageName].map(getMinifiedScripts);

                createFolder = jsfiles[packageName].length > 1;

                tasks.push(
                    gulp.src(jsfiles[packageName])
                        .pipe(gulpif(uglifyScripts, uglify()))
                        .pipe(gulpif(createFolder, rename({dirname: packageName.replace(/\.js$/, '')})))
                        .pipe(gulpif(!createFolder, rename({basename: packageName.replace(/\.js$/, '')})))
                        .pipe(filenames(packageName.replace(/\.js$/, '')))
                        .pipe(gulp.dest(paths.output.path))
                );
            }
        }

        return merge.apply(this, tasks);
    });
});

/**
 * Generate a requirejs main file from the proccessed files
 * @param  {string}  filename      The filename of the main file
 * @param  {object}  shim          The requirejs shim definitions
 * @param  {object}  outputDir     Options object passed to bower-files
 */
Elixir.extend('bowerRequireMain', function(filename, shim, outputDir) {
    var paths = new Elixir.GulpPaths()
        .output(outputDir || config.get('assets.js.folder'));

    new Elixir.Task('bowerRequireMain', function() {
        var main = {paths: {}, baseUrl: 'js', shim: (shim || {})};
        var files = filenames.get("all"),
            packages = [];

        for (var packageName in files) {
            packages.push(packageName);
        }

        packages = packages.sort()

        for (var i in packages) {
            main.paths[packages[i]] = 'vendor/' + packages[i];
        }

        var main_str = 'require.config(' + JSON.stringify(main) + ');';

        return file(filename, main_str)
            .pipe(beautify({indentSize: 4}))
            .pipe(gulp.dest(paths.output.path));
    });

});

/**
 * Publish font main files into another folder
 * @param  {string|object}  outputDir     The destination folder or an options object
 * @param  {object}         options       Options object passed to bower-files
 */
Elixir.extend('bowerFonts', function(outputDir, options) {
    // Options were provided on the outputDir parameter
    if (typeof outputDir == 'object') {
        options = outputDir;
        outputDir = null;
    }

    options = typeof options == 'undefined' ? {camelCase: false} : options;

    var paths = new Elixir.GulpPaths()
        .output(outputDir || config.publicPath + '/fonts');

    new Elixir.Task('bowerFonts', function() {
        var bower_components = require('bower-files')(options);
        var fonts = bower_components.ext(['eot', 'woff', 'woff2', 'ttf', 'svg']).deps,
            tasks = [];

        for (var packageName in fonts) {
            if (fonts[packageName].length) {
                tasks.push(
                    gulp.src(fonts[packageName])
                        .pipe(gulp.dest(paths.output.path + '/' + packageName))
                );
            }
        }

        return merge.apply(this, tasks);
    });

});

/**
 * Publish image main files into another folder
 * @param  {string|object}  outputDir     The destination folder or an options object
 * @param  {object}         options       Options object passed to bower-files
 */
Elixir.extend('bowerImages', function(outputDir, options) {
    // Options were provided on the outputDir parameter
    if (typeof outputDir == 'object') {
        options = outputDir;
        outputDir = null;
    }

    options = typeof options == 'undefined' ? {camelCase: false} : options;

    var paths = new Elixir.GulpPaths()
        .output(outputDir || config.publicPath + '/img/vendor');

    new Elixir.Task('bowerImages', function() {
        var bower_components = require('bower-files')(options);
        var images = bower_components.ext(['png', 'jpg', 'gif', 'jpeg']).deps,
            tasks = [];

        for (var packageName in images) {
            if (images[packageName].length) {
                tasks.push(
                    gulp.src(images[packageName])
                        .pipe(imagemin())
                        .pipe(gulp.dest(paths.output.path + '/'  + packageName))
                );
            }
        }

        return merge.apply(this, tasks);
    });
});

///testing
Elixir.extend('bowerCss', function(outputDir, options) {
    // Options were provided on the outputDir parameter
    if (typeof outputDir == 'object') {
        options = outputDir;
        outputDir = null;
    }

    options = typeof options == 'undefined' ? {camelCase: false} : options;

    var paths = new Elixir.GulpPaths()
        .output(outputDir || config.get('assets.css.folder') + '/vendor');

    new Elixir.Task('bowerCss', function () {
        var bower_components = require('bower-files')(options);
        var getMinifiedScripts = function (path, index, arr) {
                var newPath = path.replace(/.([^.]+)$/g, '.min.$1');
                return exists( newPath ) ? newPath : path;
            },
            isNotMinified = function(file) {
                var filename = file.history[file.history.length - 1];
                return !(/\.min\.css$/.test(filename));
            },
            uglifyScripts = function(file) {
                return isNotMinified(file) && config.production;
            },
            cssfiles = bower_components.ext('css').deps,
            tasks = [],
            createFolder;

        for (var packageName in cssfiles) {
            if (cssfiles[packageName].length) {
                cssfiles[packageName].map(getMinifiedScripts);

                createFolder = cssfiles[packageName].length > 1;

                tasks.push(
                    gulp.src(cssfiles[packageName])
                        .pipe(gulpif(createFolder, rename({dirname: packageName.replace(/\.css$/, '')})))
                        .pipe(gulpif(!createFolder, rename({basename: packageName.replace(/\.css$/, '')})))
                        .pipe(filenames(packageName.replace(/\.css$/, '')))
                        .pipe(gulp.dest(paths.output.path))
                );
            }
        }

        return merge.apply(this, tasks);
    });
});