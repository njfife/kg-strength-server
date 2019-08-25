const index = require("./index.js");

index.handler({
    ENV: 'dev',
    ClientIds: '100015484'
}, null, function(theNull, result) {
    console.log(result);
});