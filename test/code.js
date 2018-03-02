(function () {
'use strict';

function reduceProp(last, prop, i, props){
    return props[i+1] !== void 0
    ? last[prop]
    : {last: last, prop: prop};
}

function getLast(last, prop, defaults){
    return last[prop] !== void 0
    ? typeof last[prop] === 'function'
    ? last[prop]() + ''
    : last[prop]
    : defaults[prop] + '';
}

function formatWith(format, gets, defaults){

    var ref = gets
    .split('.')
    .reduce(reduceProp, format);
    var last = ref.last;
    var prop = ref.prop;

    return getLast(last, prop, defaults);
}

function formatAsyncWith(format, gets, defaults){

    var allGets = gets.split('.');

    return !allGets.length
    ? Promise.resolve(
        formatWith(
            format,
            prop,
            defaults
        )
    )
    : allGets.reduce(function (p, prop, i, props){
        return p.then(function (last){
            return props[i+1] !== void 0
            ? last[prop]
            : {last: last, prop: prop};
        });
    }, Promise.resolve(format))
    .then(function (ref){
        var last = ref.last;
        var prop = ref.prop;

        return getLast(last, prop, defaults);
    });
}

var Renderer = function Renderer(string, format, defaults){
    if ( format === void 0 ) { format = {}; }
    if ( defaults === void 0 ) { defaults = {}; }

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

    if ( Renderer ) { RendererSync.__proto__ = Renderer; }
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

    if ( Renderer ) { RendererAsync.__proto__ = Renderer; }
    RendererAsync.prototype = Object.create( Renderer && Renderer.prototype );
    RendererAsync.prototype.constructor = RendererAsync;
    RendererAsync.prototype._last = function _last (){
        return Promise.resolve(Renderer.prototype._last.call(this));
    };
    RendererAsync.prototype._end = function _end (){
        return Promise.resolve(Renderer.prototype._end.call(this));
    };
    RendererAsync.prototype._every = function _every (pre, prop){
        return formatAsyncWith(
            this.format,
            prop,
            this.defaults
        ).then(function (result){
            return {
                value: [pre, result, prop],
                done: false
            };
        });
    };
    RendererAsync.prototype._default = function _default (s){
        return Promise.resolve(Renderer.prototype._default.call(this));
    };
    RendererAsync.prototype[Symbol.asyncIterator] = function (){
      return this;
    };

    return RendererAsync;
}(Renderer));

function composePresenter(presentFN){
    return function present(str, format, defaults){
        if ( format === void 0 ) { format = {}; }
        if ( defaults === void 0 ) { defaults = {}; }


        if(typeof str !== 'string'){
            throw new TypeError(("The value (" + str + ") at argument 0 is not a string"));
        }

        if(typeof format !== 'object'){
            throw new TypeError(("The value (" + format + ") at argument 1 is not an object"));
        }

        if(typeof defaults !== 'object'){
            throw new TypeError(("The value (" + defaults + ") at argument 2 is not an object"));
        }

        return presentFN(str, format, defaults);
    };
}

var present = composePresenter(
    function(str, format, defaults){
        return new RendererSync(str, format, defaults);
    }
);

var print = console.log.bind(console);

function render(str, obj, defaults){
    var tpl = present(str, obj, defaults);

    var results = '';

    /*for(let [str, val, prop] of tpl){
        results += str + val;
    }*/

    while(true){
        var next = tpl.next();
        if(next.done) { break; }
        var ref = next.value;
        var str$1 = ref[0];
        var val = ref[1];
        var prop = ref[2];
        results += str$1 + val;
    }

    return results;
}

print(render('Cook the %(type) pie.', {
    type: 'peach'
}));

print(render('Cook the %(type) pie.', {
    type: function type(){
        return 'apple'
    }
}));

print(render('Cook the %(type) pie.'));

print(render('Cook the %(type) pie.', {}, {
    type: 'peach'
}));

print(render('Cook the %(pie.type) pie.', {
    pie: {type:'cherry'}
}));

}());
//# sourceMappingURL=code.js.map
