const str = s => parserState => { // receives a state Object.
	const {
		targetString,
		index,
	} = parserState;

	if (targetString.slice(index).startsWith(s)) { // returns a state Object.
		return { // Success
			...parserState,
			result: s,
			index: index + s.length,
		};
	}

	throw new Error (`Failed to find ${s}; Instead found ${targetString.slice(index, index + 10)}`)
};

// shape of functional flow can be summarized as ` ParserState IN >-> ParserState OUT `
const run = (parser, targetString) => {
	const initState = {
		targetString,
		index: 0,
		result: undefined,
	};
	return parser(initState);
};

// Parsing at work
const parser = str('hello there');

console.log(run(parser, 'hello there'));
