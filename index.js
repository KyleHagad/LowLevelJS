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

class Parser {
	constructor(parserStateTransformer) {
		this.parserStateTransformer = parserStateTransformer;
	}

	run(targetString) {
		const initState = {
			targetString,
			index  :0,
			result :null,
			isError:false,
			error  :null
		};
		return this.parserStateTransformer(initState);
	}

	map(func) {
		return new Parser(parserState => {
			const nextState = this.parserStateTransformer(parserState);

			if (nextState.isError) return nextState;

			return updateParserResult(nextState, func(nextState.result));
		});
	}

	errorMap(func) {
		return new Parser(parserState => {
			const nextState = this.parserStateTransformer(parserState);

			if (!nextState.isError) return nextState;

			return updateParserError(nextState, func(nextState.error, nextState.index));
		});
	}
}

const str = s => new Parser(parserState => {
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
});

const sequenceOf = parsers => new Parser(parserState => {
	if(parserState.isError) { return parserState }
	const results = [];
	let nextState = parserState;

	for (let p of parsers) {
		nextState = p.parserStateTransformer(nextState);
		results.push(nextState.result);
	}

	return updateParserResult(nextState, results);
});

// shape of functional flow can be summarized as ` ParserState IN >-> ParserState OUT `
// Parsing at work
const parser = str('hello there')
	.map(result => ({
		value: result.toUpperCase()
	})
	//.errorMap((msg, index) => `Expected a greeting at index ${index}`)
);

console.log(parser.run('hello theregoodbye'));
