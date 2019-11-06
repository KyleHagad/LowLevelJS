const
	fs = require('fs'),
	path = require('path');
const {
	Parser, updateParserError, updateParserState, sequenceOf, fail, succeed,
} = require('./parserCombinatorLibrary');

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

const Uint = n => {
	if(n < 1) { throw new Error(`Uint: Expected n to be a number greater than 0, instead found ${n}`) }
	if(n > 32) { throw new Error(`Uint: Expected n to be a number less than 32, instead found ${n}`) }

	return sequenceOf(Array.from({length:n}, () => Bit))
	.map(bits => {
		return bits.reduce((acc, bit, i) => {
			return acc + Number(BigInt(bit) << BigInt(n - 1 - i))
		}, 0)
	});
};

const Int = n => {
	if(n < 1) { throw new Error(`Int: Expected n to be a number greater than 0, instead found ${n}`) }
	if(n > 32) { throw new Error(`Int: Expected n to be a number less than 32, instead found ${n}`) }

	return sequenceOf(Array.from({length:n}, () => Bit))
	.map(bits => {
		if(bits[0] === 0) {
			return bits.reduce((acc, bit, i) => {
				return acc + Number(BigInt(bit) << BigInt(n - 1 - i))
			}, 0);
		} else {
			return -(1 + bits.reduce((acc, bit, i) => {
				return acc + Number(BigInt(bit === 0 ? 1: 0) << BigInt(n - 1 - i))
			}, 0));
		}
	});
};

const RawString = s => {
	if(s.length < 1) { throw new Error(`RawString: Expected n to be a string, instead found ${s}`) }

	const byteParsers = s.split('').map(character => character.charCodeAt(0)).map(number => {
		return Uint(8).chain(result => {
			if (result === number) {
				return succeed(number)
			}	else {
				return fail(`RawString: Expected char ${String.fromCharCode(number)}, instead found ${String.fromCharCode(result)}`)
			}
		});
	});

	return sequenceOf(byteParsers);
};

const tag = type => value => ({ type, value });

const eightBitParser = sequenceOf([Bit,Bit,Bit,Bit,Bit,Bit,Bit,Bit]);

const ipV4HeaderParser = sequenceOf([
	Uint(4).map(tag('Version')),
	Uint(4).map(tag('IHL')),
	Uint(6).map(tag('DSCP')),
	Uint(2).map(tag('ECN')),
	Uint(16).map(tag('Total Length')),
	Uint(16).map(tag('Identification')),
	Uint(3).map(tag('Flags')),
	Uint(13).map(tag('Fragment Offset')),
	Uint(8).map(tag('Time To Live')),
	Uint(8).map(tag('Protocol')),
	Uint(16).map(tag('Header Checksum')),
	Uint(32).map(tag('Source IP')),
	Uint(32).map(tag('Destination IP')),
]).chain(res => {
	if(res[1].value > 5) {
		const remainingBytes = Array.from({length: res[1].value - 20}, () => Uint(8));
		return sequenceOf(remainingBytes).chain(remaining => [
			...res,
			tag('Options')(remaining)
		]);
	}
	return succeed(res);
});

const file = fs.readFileSync(path.join(__dirname, './packet.bin')).buffer;
const dataView = new DataView(file);
const res = ipV4HeaderParser.run(dataView);
console.log(res);
