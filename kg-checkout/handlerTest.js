const index = require("./index.js");

index.handler({
    ServiceId: 1186,
    ClientId: '008186',
    ENV: 'dev'
}, null, function(theNull, result) {
    console.log(result);
});