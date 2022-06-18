const fs = require('fs');

class Deque {
    constructor() {
	this.data = [];
	this.labels = {};
	this.prog = [];
    }
    
    push(left, v) {
	return left ? this.data.unshift(v) : this.data.push(v);
    }

    pop(left) {
	if(this.data.length === 0) {
	    throw new Error('Tried to pop from empty deque');
	}
	return left ? this.data.shift() : this.data.pop();
    }

    _parse(str) {
	return str
	    .split(/[\n\r]/g)
	    .map(x => (x.trimStart().startsWith('#') ? '' : x)
		 .split(/[\n\ \t]/gm)
		)
	    .reduce((a,v) => a.concat(v), []);
    }
    
    run(str) {
	this.prog = this._parse(str);
	for(let i=0; i < this.prog.length; i++) {
	    if(this.prog[i].trimEnd().endsWith(':')) {
		const l = this.prog[i].trimEnd();
		const n = l.substr(0, l.length-1);
		if(this.labels[n]) {
		    throw new Error('Duplicate label: ' + n);
		}
		this.labels[n] = i;
	    }
	}
	this.ip = 0;
	while(this.ip < this.prog.length) {
	    this._step();
	}
    }

    _step() {
	const t = this.prog[this.ip];
	if(this.trace) {
	    console.log('%d\t%s \t<- ', this.ip, t, JSON.stringify(this.data));
	}
	const left = t.trimStart().startsWith('!');
	const is_label = t.trimEnd().endsWith(':');
	const tok = left ? t.substr(1) : t.substr(0, t.length-1);
	switch(tok) {
	case 'exit':
	    console.log('EXIT', JSON.stringify(this.data));
	    this.ip = this.prog.length + 1;
	    break;
	case 'drop': {
	    this.pop(left);
	    this.ip++;
	    break;
	}
	case 'trace': {
	    console.log((this.data.map(r => r===0?' ':'*')).join(''));
	    this.ip++;
	    break;
	}
	case 'add': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a + b);
	    this.ip++;
	    break;
	}
	case 'sub': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, b - a);
	    this.ip++;
	    break;
	}
	case 'print': {
	    const v = this.pop(left);
	    console.log('PRINT: ', v);
	    this.ip++;
	    break;
	}
	case 'jmp': {
	    const label = this.pop(left);
	    if(!label) {
		throw new Error('Unknown label for jmp: ' + label);
	    }
	    this.ip = label;
	    break;
	}
	case 'jmpif': {
	    const label = this.pop(left);
	    const condition = this.pop(left);
	    if(condition) {
		if(!label) {
		    throw new Error('Unknown label for jmpif: ' + label);
		}
		this.ip = label;
	    } else {
		this.ip++;
	    }
	    break;
	}
	case '>': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a > b);
	    this.ip++;
	    break;
	}
	case 'shr': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, b >> a);
	    this.ip++;
	    break;
	}
	case 'shl': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, b << a);
	    this.ip++;
	    break;
	}
	case 'or': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a | b);
	    this.ip++;
	    break;
	}
	case 'and': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a & b);
	    this.ip++;
	    break;
	}
	case '>=': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a >= b);
	    this.ip++;
	    break;
	}
	case '<': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a < b);
	    this.ip++;
	    break;
	}
	case '>': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a > b);
	    this.ip++;
	    break;
	}
	case 'eq': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a == b);
	    this.ip++;
	    break;
	}
	case 'swap': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, a);
	    this.push(left, b);
	    this.ip++;
	    break;
	}
	case 'move': {
	    this.push(!left, this.pop(left));
	    this.ip++;
	    break;
	}
	case 'over': {
	    const a = this.pop(left);
	    const b = this.pop(left);
	    this.push(left, b);
	    this.push(left, a);
	    this.push(left, b);
	    this.ip++;
	    break;
	}
	case 'dup': {
	    const v = this.pop(left);
	    this.push(left, v);
	    this.push(left, v);
	    this.ip++;
	    break;
	}
	case '':
	    this.ip++;
	    break;
	default:
	    if(!is_label) {
		if(isNaN(Number(tok))) {
		    if(typeof this.labels[tok] === 'undefined') {
			throw new Error('Unknown token ' + tok);
		    }
		    this.push(left, this.labels[tok]);
		} else {
		    this.push(left, Number(tok));
		}
	    }
	    this.ip++;
	}
    }
}

const d = new Deque();

const str = fs.readFileSync(process.argv[2]).toString('UTF-8');

d.run(str);
