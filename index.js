// var debug = ENVIRONMENT !== "production";
const ENVIRONMENT = 'local';
const path = require("path");
// const fs = require('fs');
const request = require('request');
const METHODE_QUERY_LOID = process.env.TEST_METHODE_QUERY_LOID;
const METHODE_SWTTOKEN = process.env.TEST_METHODE_SWTTOKEN;
const METHODE_USERNAME = process.env.TEST_METHODE_USER;
const METHODE_PASSWORD = process.env.TEST_METHODE_PASSWORD;
const METHODE_API_ROOTPATH = process.env.TEST_METHODE_API_ROOTPATH;

const baseRequest = request.defaults({
    headers: {'SWTToken': METHODE_SWTTOKEN, 'User-Agent': "nightingale"},
    jar: true,
    baseUrl: METHODE_API_ROOTPATH,
    followAllRedirects: true
});

function authenticateWithMethode() {
    return new Promise((resolve, reject) => {
        baseRequest.post('/auth/login', {
            form: {
                username: METHODE_USERNAME,
                pwd: METHODE_PASSWORD,
                connectionId: 'cms'
            }
        }, function (error,res,body) {
            if (error) {
                reject(new Error(error));
            }
            else {
                resolve(JSON.parse(body).token);
            }
        });
    });
}

// run a query that returns a list of UUIDs. needs a token passed from authentication
// need to stay on the same server, so keep the actual host in a cookie ft-backend-hostname=10_112_17_123
function runQuery(token) {
    console.log("Run query start with token ",token);
    baseRequest.post({url: '/query/search?id=116.0.3817745183&token=' + token, json: true, encoding: null}, function (err, res, body) {
        console.log("before numstories");
        console.log(err);
        console.log(body);
        var numStories = JSON.stringify(body.data.count);
        for (i = 0; i < numStories; i++) {
            var newUUid = JSON.stringify(body.data.items[i].pstate.uuid);
            var newURL = '/object/actions/publish_web?id=' + newUUid.replace(/\"/g,"");
            console.log('Object to publish ',newUUid);
            baseRequest.get({url: newURL, json: true, encoding: null}, function (err, res, body) {
                var msg = err ? err.errno : res.statusMessage;
                res = res || {};
                //console.log("Publishing object " + newUUid);
                //console.log("Status code returned: ",JSON.stringify(res.statusCode));
                //console.log("Status message returned: ",JSON.stringify(res.statusMessage));
                console.log("Publish returned ", JSON.stringify(res.body));
            });                    
        }
    })
}

function main() {
    console.log("Starting Methode Automated Publisher");
    console.log(METHODE_API_ROOTPATH);
    console.log(METHODE_USERNAME);
    console.log(METHODE_PASSWORD);
    console.log(METHODE_SWTTOKEN);
    authenticateWithMethode().then(token => runQuery(token)); // authenticate with Methode, when finished, then run Query
}

exports.handler =  main

main()