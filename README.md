Accesspoint Studio for Central
==============================
Plugin Sources for Centrals Accesspoint Studio.

### List of contents:
- [How to start](#how-to-start)
- [Gulp Targets](#gulp-targets)

### How to start:
All files in the ```src/``` are used in the compile process. To get your app started simply modify the ```app.ts```,
which act as a starting point, and modify ```index.html``` as needed.

> **Notice:**<br />
> If you create CSS Modules, or add CSS Classes, you may also run <br />
> ```> gulp tcm``` <br />
> to create the type definitions for your CSS classes.


### Gulp targets:
Target           | Description
------           | -----------
tcm              | Short for typed css modules. Creates the type definition for the CSS Files. 
copysrc          | Copy .ts or .tsx source files to the build directory (workaround for typescript not finding css modules). 
copyassets       | Moves assets to the dist directory.
build            | build and dirtribute the source (depends on tcm, copyassets, copysrc) 
bundle (virtual) | Bundles the JavaScript files for distribution. (depends on build)
clean            | Remove build and distribution files. (Basically compile from scratch.)

### Custom Arguments ###
Argument | Value       | Description
-------- | ----------- | -----------
--type   | development | Build unminified development Version
&nbsp;   | production  | Build minified production Version