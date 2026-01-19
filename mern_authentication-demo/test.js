const abc = "hi kushal welcome";
const def = abc.split(" ")
let revStrUpdate = "";
for(let i=0; i<def.length; i++){
    let revStr = def[i].split("").reverse().join("") ;
    revStr =  i <= def.length ? revStr + " " : revStr;
    revStrUpdate += revStr;
}
console.log("revStrUpdate", revStrUpdate);



function outer(){
    let a = 9;
    function inner(){
        let b = 10;
        console.log("a", a)
        console.log("b", b, def);
    }
    return inner;
}

const closureexample = outer();// cconconscon
closureexample();


