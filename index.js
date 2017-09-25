const ENVIRONMENT = 'local';
const path = require("path");
const request = require('request');
const METHODE_QUERY_LOID = process.env.METHODE_QUERY_LOID;
const METHODE_SWTTOKEN = process.env.METHODE_SWTTOKEN;
const METHODE_USERNAME = process.env.METHODE_USERNAME;
const METHODE_PASSWORD = process.env.METHODE_PASSWORD;
const METHODE_API_ROOTPATH = process.env.METHODE_API_ROOTPATH;

const baseRequest = request.defaults({
    headers: {'SWTToken': METHODE_SWTTOKEN, 'User-Agent': "nightingale"},
    jar: true,
    baseUrl: METHODE_API_ROOTPATH,
    followAllRedirects: true
});

function authenticateWithMethode() {
    console.log("Authenticating");
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
    console.log("Running Query");
    // console.log("Run query start with token ",token);
    baseRequest.post({url: '/query/search?id=' + METHODE_QUERY_LOID + '&token=' + token, json: true, encoding: null}, function (err, res, body) {
        // console.log("before numstories");
        // console.log(err);
        // console.log(body);
        var numStories = JSON.stringify(body.data.count);
        console.log(numStories + " results");
        for (i = 0; i < numStories; i++) {
            var newUUid = JSON.stringify(body.data.items[i].pstate.uuid);
            var newURL = '/object/actions/publish_web?id=' + newUUid.replace(/\"/g,"");
            console.log('Object to publish ',newUUid);
            baseRequest.get({url: newURL, json: true, encoding: null}, function (err, res, body) {
                var msg = err ? err.errno : res.statusMessage;
                res = res || {};
                console.log("Publishing object " + newUUid);
                //console.log("Status code returned: ",JSON.stringify(res.statusCode));
                //console.log("Status message returned: ",JSON.stringify(res.statusMessage));
                console.log("Publish returned ", JSON.stringify(res.body));
            });                    
        }
    })
}

function main() {
    console.log("Starting Methode Automated Publisher");
    authenticateWithMethode().then(token => runQuery(token)); // authenticate with Methode, when finished, then run Query
}

exports.handler =  main

main()