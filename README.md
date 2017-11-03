REACT Boilerplate
=================
A boilerplate for [React Apps](https://reactjs.org/) using [Typescript](https://www.typescriptlang.org/), 
[Stylus](http://stylus-lang.com/) and [Gulp](https://gulpjs.com/).

### List of contents:
- [How to start](#how-to-start)
- [Gulp Targets](#gulp-targets)

### How to start:
All files in the ```src/``` are used in the compile process. To get your app started simply modify the ```app.ts```,
which act as a starting point, and modify the ```index.html``` as needed.

> **Notice:**<br />
> If you create CSS Modules, or add CSS Classes, you may also run <br />
> ```> gulp tcm``` <br />
> to create the type definitions for your CSS classes.


### Gulp targets:
Target | Description
------ | -----------
through | Moves assets to the dist directory.
tcm | Short for typed css modules. Creates the type definition for the CSS Files. 
compile | Compile the typescript files. (depends on tcm) 
bundle | Bundles the JavaScript files for distribution. (depends on through, compile)
clean | Remove build and distribution files. (Basically compile from scratch.)
