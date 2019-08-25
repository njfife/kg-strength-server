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
            buildCheckout(event).then(function (payload) {
                MB.hit("checkout", payload, null).then(function (data) {
                    callback(null, data);
                }).catch(function (e) {
                    console.log(e);
                });
            }).catch(function (e) {
                console.log(e)
            });
        })
    });
};

function buildCheckout(event) {
    return new Promise(function (resolve, reject) {
        MB.hit("saleServices", null, {ServiceIds: event.ServiceId}).then(function (serviceData) {
            let price = extractPrice(serviceData);
            let checkoutPayload = {
                "ClientId": event.ClientId,
                "Test": false,
                "Items": [
                    {
                        "Item": {
                            "Type": "Service",
                            "Metadata": {
                                "Id" : event.ServiceId
                            }
                        },
                        "Quantity": 1
                    }
                ],
                "InStore": true,
                "Payments": [
                    {
                        "Type": "Cash",
                        "Metadata": {
                            "Amount": price
                        }
                    }
                ],
                "SendEmail": false
            };
            resolve(checkoutPayload);
        }).catch(function (e) {
            reject(e);
        });
    });
}

function extractPrice(serviceData) {
    if(serviceData.Services && serviceData.Services.length > 0) {
        return serviceData.Services[0].Price;
    }
    throw "PANIC: UNABLE TO EXTRACT PRICE FROM SERVICE DATA."
}