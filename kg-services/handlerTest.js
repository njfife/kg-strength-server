const index = require("./index.js");

index.handler({
    SessionTypeIds: 200,
    ENV: 'dev'
}, null, function(theNull, result) {
    console.log(result);
});