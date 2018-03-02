import { present } from '../';
const print = console.log.bind(console);

function render(str, obj, defaults){
    const tpl = present(str, obj, defaults);

    let results = '';

    /*for(let [str, val, prop] of tpl){
        results += str + val;
    }*/

    while(true){
        let next = tpl.next();
        if(next.done) break;
        let [str, val, prop] = next.value;
        results += str + val;
    }

    return results;
}

print(render('Cook the %(type) pie.', {
    type: 'peach'
}));

print(render('Cook the %(type) pie.', {
    type(){
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

print(render(`
    %(title)
    Cook the %(pie.type) pie.
    `, {title: 'To do', pie: {type:'cherry'}}
));
