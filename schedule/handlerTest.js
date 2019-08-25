const index = require("./index.js");

index.handler({
    StartDate: '2019-08-22',
    EndDate: '',
    ENV: 'dev'
}, null, function(theNull, result) {
    console.log(result);
});