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

let appointments;
let staff;
let clients;

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
            MB.hit("staffAppointments", null, {
                StartDate: event.StartDate,
                EndDate: event.EndDate
            }).then(function (data) {
                appointments = data;
                loadStaffAndClientData().then(function marshallData() {
                    let finalResults = buildReturnObject();
                    console.log(finalResults);
                    callback(null, finalResults);
                }).catch(function (e) {
                    console.log(e);
                    throw "Unable to finish getting data."
                });
            }).catch(function (e) {
                console.log(e);
                throw "Unable to finish getting data."
            });
        })
    });
};

function buildReturnObject() {
    let responseObject = {};
    for(let s = 0; s < staff.StaffMembers.length; ++s) {
        let staffMember = staff.StaffMembers[s];
        responseObject[staffMember.Name] = [];
        for(let a = 0; a < appointments.Appointments.length; ++a) {
            let appt = appointments.Appointments[a];
            if(appt.StaffId !== staffMember.Id) {
                continue;
            }
            let existingObject = objectArrayHas(responseObject[staffMember.Name], "StartDateTime", appt.StartDateTime);
            let currApptObj = existingObject || {};
            if(!existingObject) {
                responseObject[staffMember.Name].push(currApptObj);
            }
            currApptObj.Duration = appt.Duration;
            currApptObj.StartDateTime = appt.StartDateTime;
            currApptObj.Client = currApptObj.Client || [];
            for(let c = 0; c < clients.Clients.length; ++c) {
                let client = clients.Clients[c];
                if(client.Id === appt.ClientId) {
                    currApptObj.Client.push({
                        AppointmentId: appt.Id,
                        ClientId: client.Id,
                        FirstName: client.FirstName,
                        LastName: client.LastName,
                        Name: client.FirstName + ' ' + client.LastName,
                        SessionTypeId: appt.SessionTypeId
                    });
                    break;
                }
            }
        }
    }
    return responseObject
}

function objectArrayHas(arr, key, value) {
    for(let i = 0; i < arr.length; ++i) {
        if(arr[i][key] === value) {
            return arr[i];
        }
    }
    return null;
}

function getIds(appointments, type) {
    let ids = [];
    let appts = appointments.Appointments || [];
    for(let i = 0; i < appts.length; ++i) {
        let apt = appts[i];
        if(apt[type]) {
            if(-1 === ids.indexOf(apt[type])) {
                ids.push(apt[type]);
            }
        }
    }
    return ids;
}

function getStaffIds(appointments) {
    return getIds(appointments, "StaffId");
}

function getClientIds(appointments) {
    return getIds(appointments, "ClientId");
}

function loadStaffAndClientData() {
    let staffIds = getStaffIds(appointments);
    let clientIds = getClientIds(appointments);

    return new Promise(function loadingStaffAndClientData(resolve, reject) {
        MB.hit("staff", null, {StaffIds: staffIds}).then(function(data) {
            staff = data;
            if(staff && clients) {
                resolve()
            }
        }).catch(function (e) {
            console.log(e);
            reject(e);
        });
        MB.hit("clients", null, {ClientIds: clientIds}).then(function(data) {
            clients = data;
            if(staff && clients) {
                resolve()
            }
        }).catch(function (e) {
            console.log(e);
            reject(e);
        });
    });
}

