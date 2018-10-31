import * as React from 'react';
import * as ReactDom from 'react-dom';

import style from './css/index.css';
(() => style.__undefined)();

export function App() {
	return (
		<h1> Hello World!</h1>
	);
}

ReactDom.render((<App />), document.getElementById('app-container'));
