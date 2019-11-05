const {
	str,
	lazy,
	digits,
	choice,
	between,
	sequenceOf,
} = require('./parseCombinatorLibrary');

const betweenParens = between(str('('), str(')'));

const numberParser = digits.map(n => ({
	type: 'number',
	value: Number(n)
}));

const operatorParser = choice( [str('+'), str('-'), str('*'), str('/')] );

const expression = lazy(() => choice([
	numberParser,
	operationParser
]));

const operationParser = betweenParens(sequenceOf([
	operatorParser,
	str(' '),
	expression,
	str(' '),
	expression,
])).map(results => ({
	type: 'operation',
	value: {
		op: results[0],
		a: results[2],
		b: results[4]
	}
}));

const evaluateExpression = node => {
	if(node.type === 'number') { return node.value }
	if(node.type === 'operation') {
		if(node.value.op === '+') { return evaluateExpression(node.value.a) + evaluateExpression(node.value.b) }
		if(node.value.op === '-') { return evaluateExpression(node.value.a) - evaluateExpression(node.value.b) }
		if(node.value.op === '*') { return evaluateExpression(node.value.a) * evaluateExpression(node.value.b) }
		if(node.value.op === '/') { return evaluateExpression(node.value.a) / evaluateExpression(node.value.b) }
	}
};

const interpreter = program => {
	const parseResult = expression.run(program);
	if(parseResult.isError) {throw new Error('Invalid program')}

	return evaluateExpression(parseResult.result);
};
// '(+ (* 10 2) (- (/ 50 3) 2))'
const program = '(+ (/ 10 2) 2))';
console.log(interpreter(program));
