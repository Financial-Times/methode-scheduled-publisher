require('dotenv').config();
const ENVIRONMENT = 'local';
const path = require("path");
const request = require('request');
const METHODE_QUERY_LOID = process.env.METHODE_QUERY_LOID;
const METHODE_USERNAME = process.env.METHODE_USERNAME;
const METHODE_API_ROOTPATH = process.env.METHODE_API_ROOTPATH;


const AWS = require('aws-sdk');

const encryptedPassword = process.env['METHODE_PASSWORD_ENCRYPTED'];
const encryptedToken= process.env['METHODE_SWTTOKEN_ENCRYPTED'];

let baseRequests;

function authenticateWithMethode(json) {
    console.log("Authenticating");
    return new Promise((resolve, reject) => {
        json.baseRequests.post('/auth/login', {
            form: {
                username: METHODE_USERNAME,
                pwd: json.methodePassword,
                connectionId: 'cms'
            }
        }, function (error,res,body) {
            if (error) {
                reject(new Error(error));
            }
            else {
                resolve({"token": JSON.parse(body).token, "baseRequests": json.baseRequests});
            }
        });
    });
}

// run a query that returns a list of UUIDs. needs a token passed from authentication
// need to stay on the same server, so keep the actual host in a cookie ft-backend-hostname=10_112_17_123
function runQuery(json) {
    console.log("Running Query");
    json.baseRequests.post({url: '/query/search?id=' + METHODE_QUERY_LOID + '&token=' + json.token, json: true, encoding: null}, function (err, res, body) {
        var numStories = JSON.stringify(body.data.count);
        console.log(numStories + " results");
        for (i = 0; i < numStories; i++) {
            var newUUid = JSON.stringify(body.data.items[i].pstate.uuid);
            var newURL = '/object/actions/publish_web?id=' + newUUid.replace(/\"/g,"");
            console.log('Object to publish ',newUUid);
            json.baseRequests.get({url: newURL, json: true, encoding: null}, function (err, res, body) {
                res = res || {};
                console.log("Publishing object " + newUUid);
                console.log("Publish returned ", JSON.stringify(res.body));
            });
        }
    })
}

function setBaseRequest(json) {
    console.log("Setting base request")
    return new Promise((resolve, reject) => {
        baseRequests = request.defaults({
            headers: {'SWTToken': json.token, 'User-Agent': "nightingale"},
            jar: true,
            baseUrl: METHODE_API_ROOTPATH,
            followAllRedirects: true
        });
        resolve({"baseRequests": baseRequests, "methodePassword": json.password});
    });
}

function decryptPassword(token) {
    console.log("Decrypting password");
    return new Promise((resolve, reject) => {
        const kms = new AWS.KMS();
        kms.decrypt({ CiphertextBlob: new Buffer(encryptedPassword, 'base64') }, (err, data) => {
            resolve({"password": data.Plaintext.toString('ascii'), "token": token})
        });
    });
}

function decryptToken() {
    console.log("Decrypting token");
    return new Promise((resolve, reject) => {
        const kms = new AWS.KMS();
        kms.decrypt({ CiphertextBlob: new Buffer(encryptedToken, 'base64') }, (err, data) => {
            if(err) {
                reject(err)
            } else{
                resolve(data.Plaintext.toString('ascii'))
            }

        });
    });
}

function main() {
    console.log("Starting Methode Automated Publisher");
    decryptToken()
        .then(decryptPassword)
        .then(setBaseRequest)
        .then(authenticateWithMethode)
        .then(token => runQuery(token)); // authenticate with Methode, when finished, then run Query

}

exports.handler =  main

// main()