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
    s3.getObject(params, function(err, data) {
        // Handle any error and exit
        if (err) {
            throw "Unable to access bucket." + err;
        }
        let objectData = JSON.parse(data.Body.toString());
        MB.setOptions(objectData);
        MB.AuthenticateAPI().then(function() {
            MB.hit("balance", null, {ClientIds: event.ClientIds}).then(function(data) {
                let results = [];
                for(let i = 0; i < data.Clients.length; ++i) {
                    let client = data.Clients[i];
                    results.push({
                        FirstName: client.FirstName,
                        LastName: client.LastName,
                        ClientId: client.Id,
                        AccountBalance: client.AccountBalance
                    });
                }
                callback(null, results);
            });
        });
    });
};