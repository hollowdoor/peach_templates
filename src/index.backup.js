const pattern = /([\s\S]+?)(\\?%)\(([\s\S]+?)\)/g;
const mapPattern = /(^[^:]+?):([\s\S]+)$/;

export function reduceProp(last, prop, i, props){
    return props[i+1] !== void 0
    ? last[prop]
    : {last, prop};
}

export function createMapsReducer(maps){
    return function(out, fn, i, mappers){
        try{
            return maps[fn](out);
        }catch(e){
            if(typeof maps[fn] !== 'function'){
                throw new TypeError(`maps.${fn} is not a function`);
            }else{
                throw e;
            }
        }
    };
}

export function formatWith(format, gets, defaults){

    const {last, prop} = gets
    .split('.')
    .reduce(reduceProp, format);

    return last[prop] !== void 0
    ? typeof last[prop] === 'function'
    ? last[prop]() + ''
    : last[prop]
    : defaults[prop] + '';
}


export function composeRenderer(maps = {}){

    const mapsLen = Object.keys(maps).length;
    const mapsReducer = mapsLen
    ? createMapsReducer(maps)
    : null;

    return mapsLen
    ? function(str, format, defaults){
        return str.replace(pattern, (m, $1, $2, $3)=>{

            const [m2, mappers, s] = $3.match(mapPattern) || [];

            return $2 !== '%'
            ? m
            : $1 + (
                mappers
                ? mappers.split('|').reverse()
                .reduce(
                    mapsReducer,
                    formatWith(format, s, defaults)
                )
                : formatWith(format, $3, defaults)
            );
       });
    }
    //Slightly faster with no maps
    : function(str, format, defaults){
        return str.replace(pattern, (m, $1, $2, $3)=>{
            return $2 !== '%'
            ? m
            : $1 + formatWith(format, $3, defaults);
       });
    };
}

export function createRenderer({
    maps = {}
} = {}){

    if(typeof maps !== 'object'){
        throw new TypeError(`The value (${maps}) at options.maps is not an object`);
    }

    let keys = Object.keys(maps);

    for(let i=0; i<keys.length; i++){
        let key = keys[i];
        if(typeof maps[key] !== 'function'){
            throw new TypeError(`Value ${maps[key]} of options.maps.${key} is not a function`);
        }
    }

    keys = null;

    const proc = composeRenderer(maps);

    return function render(
        str = '',
        format = {},
        defaults = {}
    ){

        if(typeof str !== 'string'){
            throw new TypeError(`The value (${str}) at argument 0 is not a string`);
        }

        if(typeof format !== 'object'){
            throw new TypeError(`The value (${format}) at argument 1 is not an object`);
        }

        if(typeof defaults !== 'object'){
            throw new TypeError(`The value (${defaults}) at argument 2 is not an object`);
        }

        return proc(str, format, defaults);
    };
}

const render = createRenderer();

export {
    pattern,
    render,
    mapPattern
}
