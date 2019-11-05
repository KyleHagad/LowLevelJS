const {
	Parser,
	updateParserError,
	updateParserState,
	sequenceOf,
} = require('./parseCombinatorLibrary');

const Bit = new Parser(parserState => {
	if(parserState.isError) { return parserState }

	const byteOffset = Math.floor(parserState.index / 8);
	if(byteOffset >= parserState.target.byteLength) { updateParserError(parserState, `Bit: Unexpected end of input`) }

	const byte = parserState.target.getUint8(byteOffset);
	const bitOffset = 7 - (parserState.index % 8);

	const result = (byte & 1 << bitOffset) >> bitOffset;
	return updateParserState(parserState, parserState.index + 1, result)
});

const Zero = new Parser(parserState => {
	if(parserState.isError) { return parserState }

	const byteOffset = Math.floor(parserState.index / 8);
	if(byteOffset >= parserState.target.byteLength) { updateParserError(parserState, `Zero: Unexpected end of input`) }

	const byte = parserState.target.getUint8(byteOffset);
	const bitOffset = 7 - (parserState.index % 8);

	const result = (byte & 1 << bitOffset) >> bitOffset;
	if (result !== 0) { return updateParserError(parserState, `Zero: Expecting '0', but found '1' at index ${parserState.index}`) }

	return updateParserState(parserState, parserState.index + 1, result)
});

const One = new Parser(parserState =>  {
	if(parserState.isError) { return parserState }

	const byteOffset = Math.floor(parserState.index / 8);
	if(byteOffset >= parserState.target.byteLength) { updateParserError(parserState, `One: Unexpected end of input`) }

	const byte = parserState.target.getUint8(byteOffset);
	const bitOffset = 7 - (parserState.index % 8);

	const result = (byte & 1 << bitOffset) >> bitOffset;
	if (result !== 1) { return updateParserError(parserState, `One: Expecting '1', but found '0' at index ${parserState.index}`) }

	return updateParserState(parserState, parserState.index + 1, result)
});

const eightBitParser = sequenceOf([Bit,Bit,Bit,Bit,Bit,Bit,Bit,Bit]);

const parser = Bit;
const data = (new Uint8Array([234, 235])).buffer;
const dataView = new DataView(data);
const res = parser.run(dataView);
console.log(res);
