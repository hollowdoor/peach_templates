const present = require('../src/maybe');
const print = console.log.bind(console);

function render(str, obj){
    const tpl = present(str, obj);

    let results = '';

    for(let [str, val, prop] of tpl){
        results += str + val;
    }

    return results;
}

print(render('Cook the %(pie.type) pie.', {
    pie: {type: 'peach'}
}));

print(render('Cook the %(pie.type) pie.', {
    pie: {type: 'apple'}
}));
