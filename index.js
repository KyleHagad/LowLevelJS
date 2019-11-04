const updateParserState = (state, index, result) => ({
	...state,
		index,
		result,
});

const updateParserResult = (state, result) => ({
	...state,
		result,
});

const updateParserError = (state, errorMessage) => ({
	...state,
	isError: true,
	error: errorMessage,
});

const str = s => parserState => {
	const {
		targetString,
		index,
		isError,
	} = parserState;

	if(isError) { return parserState }

	const slicedTarget = targetString.slice(index);
	if (slicedTarget.length === 0) {
		return updateParserError(parserState, `str: Failed to find "${s}. Found unexpected end of input.`);
	}

	if (targetString.slice(index).startsWith(s)) { // returns a state Object.
		return updateParserState(parserState, index + s.length, s);
	}

	return updateParserError(
		parserState,
		`Failed to find ${s}, Instead found ${targetString.slice(index, index + 10)}`
	);
};

const sequenceOf = parsers => parserState => {
	if(parserState.isError) { return parserState }
	const results = [];
	let nextState = parserState;

	for (let p of parsers) {
		nextState = p(nextState);
		results.push(nextState.result);
	}

	return updateParserResult(nextState, results);
};

// shape of functional flow can be summarized as ` ParserState IN >-> ParserState OUT `
const run = (parser, targetString) => {
	const initState = {
		targetString,
		index: 0,
		result: null,
		isError: false,
		error: null
	};
	return parser(initState);
};

// Parsing at work
const parser = sequenceOf([
	str('hello there'),
	str('goodbye'),
	]);

console.log(run(parser, ''));
