function reduceProp(last, prop, i, props){
    return props[i+1] !== void 0
    ? last[prop]
    : {last: last, prop: prop};
}

function formatWith(format, gets, defaults){

    var ref = gets
    .split('.')
    .reduce(reduceProp, format);
    var last = ref.last;
    var prop = ref.prop;

    return last[prop] !== void 0
    ? typeof last[prop] === 'function'
    ? last[prop]() + ''
    : last[prop]
    : defaults[prop] + '';
}

var Renderer = function Renderer(string, format, defaults){
    if ( format === void 0 ) format = {};
    if ( defaults === void 0 ) defaults = {};

    this.string = string;
    this.format = format;
    this.defaults = defaults;
    this.complete = false;
    this.pattern =  /([\s\S]+?)(\\?%)\(([\s\S]+?)\)/g;
    this.lastIndex = 0;
};
Renderer.prototype.next = function next (){
    var match = this.pattern.exec(this.string);
    var ref = match || [];
        var m = ref[0];
        var pre = ref[1];
        var leaf = ref[2];
        var prop = ref[3];
    if(this.complete) { return this._last(); }

    if(!match){
        this.complete = true;
        return this._end();
    }

    this.lastIndex = this.pattern.lastIndex;

    return leaf === '%'
    ? this._every(pre, prop)
    : this._default(m);
};
Renderer.prototype._last = function _last (){
    return {done: true};
};
Renderer.prototype._end = function _end (){
    return {
        value: [
            this.string.slice(this.lastIndex),
            '',
            null
        ],
        done: false
    };
};
Renderer.prototype._default = function _default (s){
    return {
        value: [
            s,
            '',
            null
        ],
        done: false
    };
};
Renderer.prototype[Symbol.iterator] = function (){
    return this;
};

var RendererSync = (function (Renderer) {
    function RendererSync(string, format, defaults){
        Renderer.call(this, string, format, defaults);
    }

    if ( Renderer ) RendererSync.__proto__ = Renderer;
    RendererSync.prototype = Object.create( Renderer && Renderer.prototype );
    RendererSync.prototype.constructor = RendererSync;
    RendererSync.prototype._every = function _every (pre, prop){
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
    };

    return RendererSync;
}(Renderer));

var RendererAsync = (function (Renderer) {
    function RendererAsync(string, format, defaults){
        Renderer.call(this, string, format, defaults);
    }

    if ( Renderer ) RendererAsync.__proto__ = Renderer;
    RendererAsync.prototype = Object.create( Renderer && Renderer.prototype );
    RendererAsync.prototype.constructor = RendererAsync;
    RendererAsync.prototype._last = function _last (){
        return Promise.resolve(Renderer.prototype._last.call(this));
    };
    RendererAsync.prototype._end = function _end (){
        return Promise.resolve(Renderer.prototype._end.call(this));
    };
    RendererAsync.prototype._every = function _every (pre, prop){
        return Promise.resolve(
            formatWith(
                this.format,
                prop,
                this.defaults
            )
        ).then(function (result){ return ({
            value: Promise.all([
                pre,
                result,
                prop
            ]),
            done: false
        }); });
    };
    RendererAsync.prototype._default = function _default (s){
        return Promise.resolve(Renderer.prototype._default.call(this));
    };
    RendererAsync.prototype[Symbol.asyncIterator] = function (){
      return this;
    };

    return RendererAsync;
}(Renderer));

function present(str, format, defaults){
    return new RendererSync(str, format, defaults);
}

function asyncPresent(str, format, defaults){
    return new RendererAsync(str, format, defaults);
}

export { present, asyncPresent };
//# sourceMappingURL=bundle.es.js.map
