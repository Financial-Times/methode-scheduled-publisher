// var debug = ENVIRONMENT !== "production";
const ENVIRONMENT = 'local';
const path = require("path");
const fs = require('fs');
const request = require('request');

const confOptsFile = fs.readFileSync(path.join('config', ENVIRONMENT + '.conf.json'));
const confOptsJSON = JSON.parse(confOptsFile);

const METHODE_API_ROOTPATH=confOptsJSON['METHODE_API_ROOTPATH'];
const METHODE_SWTTOKEN=confOptsJSON['METHODE_SWTTOKEN'];
const METHODE_USERNAME=confOptsJSON['METHODE_USERNAME'];
const METHODE_PASSWORD=confOptsJSON['METHODE_PASSWORD'];

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
    baseRequest.post({url: '/query/search?id=116.0.3817745183&token=' + token, json: true, encoding: null}, function (err, res, body) {
        var numStories = JSON.stringify(body.data.count);
        for (i = 0; i < numStories; i++) {
            var newUUid = JSON.stringify(body.data.items[i].pstate.uuid);
            var newURL = '/object/actions/publish_web?id=' + newUUid.replace(/\"/g,"");
            console.log('The new URL is ',newURL);
            baseRequest.get({url: newURL, json: true, encoding: null}, function (err, res, body) {
                var msg = err ? err.errno : res.statusMessage;
                res = res || {};
                console.log("Status code returned: ",JSON.stringify(res.statusCode));
                console.log("Status message returned: ",JSON.stringify(res.statusMessage));
                console.log("Response body ", JSON.stringify(res.body));
                console.log("Publishing " + newURL);
            });                    
        }
    })
}

function main() {
    console.log("confOptsFile = " + confOptsFile);
    console.log("Starting Methode Automated Publisher");
    authenticateWithMethode().then(token => runQuery(token)); // authenticate with Methode, when finished, then run Query
}

module.exports = main()