let MB_API = require('./mind-body-api.js');
let AWS = require('aws-sdk');
// let credentials = new AWS.SharedIniFileCredentials(
//     {
//         profile: 'default',
//         filename: 'C:\\Users\\Nathan Font-Fife\\.aws\\config'
// });
// AWS.config.credentials = credentials;
// Set the Region
AWS.config.update({region: 'us-west-2'});
// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

let MB = new MB_API.MindBodyAPI();

exports.handler = (event, context, callback) => {
    let params = {
        Bucket : 'kg-strength-secure-config',
        Key: event.ENV + '/config.json'
    };
    console.log(JSON.stringify(params, null, 3));
    s3.getObject(params, function(err, data) {
        // Handle any error and exit
        if (err) {
            throw "Unable to access bucket." + err;
        }
        let objectData = JSON.parse(data.Body.toString());
        MB.setOptions(objectData);
        MB.AuthenticateAPI().then(function () {
            MB.hit("saleServices", null, {SessionTypeIds: event.SessionTypeIds}).then(function (data) {
                callback(null, data);
            });
        });
    });
};