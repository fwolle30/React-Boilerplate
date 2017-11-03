REACT Boilerplate
=================

A boilerplate for [React Apps](https://reactjs.org/) using [Typescript](https://www.typescriptlang.org/), [Stylus](http://stylus-lang.com/) and [Gulp](https://gulpjs.com/).

### List of contents:

- [How to start](#how-to-start)
- [Gulp Targets](#gulp-targets)

### How to start:


### Gulp targets:

Target | Description
------ | -----------
through | Moves assets to the dist directory.
tcm | Short for typed css modules. Creates the type definition for the CSS Files. 
compile | Compile the typescript files. (depends on tcm) 
bundle | Bundles the JavaScript files for distribution. (depends on through, compile)
clean | Remove build and distribution files. (Basically compile from scratch.)
