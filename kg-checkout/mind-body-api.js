let https = require('https');
const querystring = require('querystring');

SCOPE = null;
exports.MindBodyAPI = function MindBodyAPI(options) {
    if(!SCOPE) {
        SCOPE = this;
    }
    if(!options) {
        options = {};
    }
    this.auth_uri = 'https://api.mindbodyonline.com/public/v6/usertoken/issue';
    this.api_host = 'https://api.mindbodyonline.com';
    this.api_version_path = '/public/v6/';
    this.AccessToken = 'EXPIRED';
    this.username = options.username;
    this.password = options.password;
    this.api_key = options.api_key;
    this.site_id = options.site_id || -99;

    this.endpoints = {
        staff: {
            method: 'GET',
            uri: this.api_host + this.api_version_path + 'staff/staff'
        },
        clients: {
            method: 'GET',
            uri: this.api_host + this.api_version_path + 'client/clients'
        },
        staffAppointments: {
            method: 'GET',
            uri: this.api_host + this.api_version_path + 'appointment/staffappointments'
        },
        saleServices: {
            method: 'GET',
            uri: this.api_host + this.api_version_path + 'sale/services'
        },
        balance: {
            method: 'GET',
            uri: this.api_host + this.api_version_path + 'client/clientaccountbalances'
        },
        checkout: {
            method: 'POST',
            uri: this.api_host + this.api_version_path + 'sale/checkoutshoppingcart'
        }
    };
};

let MBP = exports.MindBodyAPI.prototype;

MBP.setOptions = function(options) {
    this.username = options.username || this.username;
    this.password = options.password || this.password;
    this.api_key = options.api_key || this.api_key;
    this.site_id = options.site_id || this.site_id;
};

MBP._getNewToken = function(resolve, reject) {
    console.log("Attempting to get the token from: " + this.auth_uri);
    const auth_uri = new URL(this.auth_uri);
    const options = {};
    options.hostname = auth_uri.hostname;
    options.path = auth_uri.pathname;
    options.headers = {
        'Content-Type': 'application/json',
        'Api-Key': this.api_key,
        'SiteId': this.site_id
    };
    options.method = 'POST';
    const req = https.request(options, (res) => {
        console.log('statusCode:', res.statusCode);

        res.on('data', (data) => {
            const body = JSON.parse(data);
            if(body.AccessToken) {
                this.AccessToken = body.AccessToken;
            }
            resolve();
        });
    });
    req.on('error', (e) => {
        console.error(e);
        reject();
    });
    req.write(JSON.stringify({
        "Username": this.username,
        "Password": this.password
    }));
    req.end();
};

MBP.printConfig = function () {
    for (let key in this) {
        if (this.hasOwnProperty(key)) {
            console.log(key + " -> " + this[key]);
        }
    }
};

MBP.AuthenticateAPI = function() {
    const Scope = this;
    Scope.AccessToken = 'LOADING';
    return new Promise(function AuthenticateApiPromise(resolve, reject) {
        if (this.AccessToken === 'EXPIRED' || !this.AccessToken) {
            try {
                Scope._getNewToken(resolve, reject);
            } catch (e) {
                console.log("Unable to authenticate user.");
                reject("Unable to authenticate user.");
            }
        }
    });
};

MBP._hit = function(endpoint, jsonPayload, params, resolve, reject) {
    let qs = params ? "?" + querystring.stringify(params) : "";
    console.log("QS: " + qs);
    console.log("URI: " + endpoint.uri + qs);
    const endpoint_uri = new URL(endpoint.uri + qs);
    const options = {};
    options.hostname = endpoint_uri.hostname;
    options.path = endpoint_uri.pathname + qs;
    options.headers = {
        'Content-Type': 'application/json',
        'Api-Key': this.api_key,
        'SiteId': this.site_id,
        'Authorization': 'Bearer ' + this.AccessToken
    };
    options.method = endpoint.method;
    const req = https.request(options, (res) => {
        console.log('statusCode:', res.statusCode);
        let chunks = [];
        res.on('data', (data) => {
            chunks.push(data);
        }).on('end', () => {
            resolve(
                JSON.parse(
                    Buffer.concat(chunks).toString()));
        });
    });
    req.on('error', (e) => {
        console.error(e);
        reject(e);
    });
    if(jsonPayload) {
        req.write(JSON.stringify(jsonPayload));
    }
    req.end();
};

MBP.hit = function(endpoint, jsonPayload, params) {
    const Scope = this;
    return new Promise(function HitEndpointPromise(resolve, reject) {
        if (Scope.AccessToken === 'EXPIRED' || !Scope.AccessToken) {
            try {
                Scope._getNewToken(function(message) {
                    if(message) {
                        console.log(message)
                    }
                    Scope._hit(Scope.endpoints[endpoint], jsonPayload, params, resolve, reject)
                }, reject);
            } catch (e) {
                console.log("Unable to authenticate user.");
                reject("Unable to authenticate user.");
            }
        } else {
            Scope._hit(Scope.endpoints[endpoint], jsonPayload, params, resolve, reject)
        }
    });
};

