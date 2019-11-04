const // Utilities
	updateParserState = (state, index, result) => ({
	...state,
		index,
		result,
}),
	updateParserResult = (state, result) => ({
	...state,
		result,
}),
	updateParserError = (state, errorMessage) => ({
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

// shape of functional flow can be summarized as ` ParserState IN >-> ParserState OUT `
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

const lettersRegex = /[A-Za-z]+/;
const letters = new Parser(parserState => {
	const {
		targetString,
		index,
		isError,
	} = parserState;

	if(isError) { return parserState }

	const slicedTarget = targetString.slice(index);
	if (slicedTarget.length === 0) {
		return updateParserError(parserState, `letters: Found unexpected end of input.`);
	}

	const regexMatch = slicedTarget.match(lettersRegex);
	if(regexMatch) {
		return updateParserState(parserState, index + regexMatch[0].length, regexMatch[0]);
	}

	return updateParserError(
		parserState,
		`letters: Failed to match at index ${index}`
	);
});

const digitsRegex = /[0-9]+/;
const digits = new Parser(parserState => {
	const {
		targetString,
		index,
		isError,
	} = parserState;

	if(isError) { return parserState }

	const slicedTarget = targetString.slice(index);
	if (slicedTarget.length === 0) {
		return updateParserError(parserState, `digits: Found unexpected end of input.`);
	}

	const regexMatch = slicedTarget.match(digitsRegex);
	if(regexMatch) {
		return updateParserState(parserState, index + regexMatch[0].length, regexMatch[0]);
	}

	return updateParserError(
		parserState,
		`digits: Failed to match at index ${index}`
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

const choice = parsers => new Parser(parserState => {
	if(parserState.isError) { return parserState }

	for (let p of parsers) {
		const nextState = p.parserStateTransformer(parserState);
		if(!nextState.isError) { return nextState; }
	}

	return updateParserError(
		parserState,
		`choice: Unable to match any parser at index ${parserState.index}`
	);
});

const many = parser => new Parser(parserState => {
	if(parserState.isError) { return parserState }

	let nextState = parserState;
	let done = false;
	const results = [];

	while (!done) {
		let testState = parser.parserStateTransformer(nextState);

		if(!testState.isError) {
			results.push(testState.result);
			nextState = testState;
		}
		else { done = true; }
	}

	return updateParserResult(nextState, results);
});

const manyOne = parser => new Parser(parserState => {
	if(parserState.isError) { return parserState }

	let nextState = parserState;
	let done = false;
	const results = [];

	while (!done) {
		nextState = parser.parserStateTransformer(nextState);

		if(!nextState.isError) { results.push(nextState.result); }
		else { done = true; }
	}

	if(results.length < 1) {
		return updateParserError(
			parserState,
			`manyOne: Failed to match any parser at index ${parserState.index}`
		)
	}

	return updateParserResult(nextState,results);
});

// Parsing at work
const parser = many(choice([
	digits,
	letters
]));

console.log(parser.run('123123asdasd'));
