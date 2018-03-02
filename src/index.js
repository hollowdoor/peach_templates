function reduceProp(last, prop, i, props){
    return props[i+1] !== void 0
    ? last[prop]
    : {last, prop};
}

function getLast(last, prop, defaults){
    return last[prop] !== void 0
    ? typeof last[prop] === 'function'
    ? last[prop]() + ''
    : last[prop]
    : defaults[prop] + '';
}

function formatWith(format, gets, defaults){

    const {last, prop} = gets
    .split('.')
    .reduce(reduceProp, format);

    return getLast(last, prop, defaults);
}

function formatAsyncWith(format, gets, defaults){

    const allGets = gets.split('.');

    return !allGets.length
    ? Promise.resolve(
        formatWith(
            format,
            prop,
            defaults
        )
    )
    : allGets.reduce((p, prop, i, props)=>{
        return p.then(last=>{
            return props[i+1] !== void 0
            ? last[prop]
            : {last, prop};
        });
    }, Promise.resolve(format))
    .then(({last, prop})=>{
        return getLast(last, prop, defaults);
    });
}

class Renderer {
    constructor(string, format = {}, defaults = {}){
        this.string = string;
        this.format = format;
        this.defaults = defaults;
        this.complete = false;
        this.pattern =  /([\s\S]+?)(\\?%)\(([\s\S]+?)\)/g;
        this.lastIndex = 0;
    }
    next(){
        const match = this.pattern.exec(this.string);
        const [m, pre, leaf, prop] = match || [];
        if(this.complete) return this._last();

        if(!match){
            this.complete = true;
            return this._end();
        }

        this.lastIndex = this.pattern.lastIndex;

        return leaf === '%'
        ? this._every(pre, prop)
        : this._default(m);
    }
    _last(){
        return {done: true};
    }
    _end(){
        return {
            value: [
                this.string.slice(this.lastIndex),
                '',
                null
            ],
            done: false
        };
    }
    _default(s){
        return {
            value: [
                s,
                '',
                null
            ],
            done: false
        };
    }
    [Symbol.iterator](){
        return this;
    }
}

class RendererSync extends Renderer {
    constructor(string, format, defaults){
        super(string, format, defaults)
    }
    _every(pre, prop){
        return {
            value: [
                pre,
                formatWith(
                    this.format,
                    prop,
                    this.defaults
                ),
                prop
            ],
            done: false
        };
    }
}

class RendererAsync extends Renderer {
    constructor(string, format, defaults){
        super(string, format, defaults)
    }
    _last(){
        return Promise.resolve(super._last());
    }
    _end(){
        return Promise.resolve(super._end());
    }
    _every(pre, prop){
        return formatAsyncWith(
            this.format,
            prop,
            this.defaults
        ).then(result=>{
            return {
                value: [pre, result, prop],
                done: false
            };
        });
    }
    _default(s){
        return Promise.resolve(super._default());
    }
    [Symbol.asyncIterator](){
      return this;
    }
}

function composePresenter(presentFN){
    return function present(str, format = {}, defaults = {}){

        if(typeof str !== 'string'){
            throw new TypeError(`The value (${str}) at argument 0 is not a string`);
        }

        if(typeof format !== 'object'){
            throw new TypeError(`The value (${format}) at argument 1 is not an object`);
        }

        if(typeof defaults !== 'object'){
            throw new TypeError(`The value (${defaults}) at argument 2 is not an object`);
        }

        return presentFN(str, format, defaults);
    };
}

const present = composePresenter(
    function(str, format, defaults){
        return new RendererSync(str, format, defaults);
    }
);

const asyncPresent = composePresenter(
    function(str, format, defaults){
        return new RendererAsync(str, format, defaults);
    }
);

export { present, asyncPresent }
