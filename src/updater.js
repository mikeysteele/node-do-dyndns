/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var DO_API_URI = 'https://api.digitalocean.com/v2';
var publicIp = require('public-ip');
var request = require('request');
var record;


module.exports = function (config) {
    return new Updater(config);

};

function getRecord(config) {
    return new Promise(function (resolve, reject) {
        if (record) {
            resolve(record);
            return;
        }
        var url = [
            DO_API_URI,
            'domains',
            config.zone,
            'records'

        ].join('/');

        var requestData = {
            url: url,
            method: 'GET',
            headers: {
                "Authorization": 'Bearer ' + config.access_token
            }
        };

        request({
            url: url,
            method: 'GET',
            headers: {
                "Authorization": 'Bearer ' + config.access_token
            }
        }, function (error, response, body) {
            record = (JSON.parse(body).domain_records.filter(function (val) {
                return val.name === config.host;
            })[0]);
            resolve(record);
        });
    });

}

function updateRecord(ip, id, config) {
    var url = [
        DO_API_URI,
        'domains',
        config.zone,
        'records',
        id
    ].join('/');
    var data = {"data": ip, "type": "A"};
    var requestData = {
        url: url,
        method: 'PUT',
        json: data,
        headers: {
            "Authorization": 'Bearer ' + config.access_token
        }
    };
    request(requestData, function (error, response, body) {
        if (!error){
            console.log('IP updated to: '+ip);
        }
    });
}

function createRecord(ip, config) {
    var url = [
        DO_API_URI,
        'domains',
        config.zone,
        'records'
    ].join('/');
    var data = {"name": config.host, "data": ip, "type": "A"};
    var requestData = {
        url: url,
        method: 'POST',
        json: data,
        headers: {
            "Authorization": 'Bearer ' + config.access_token
        }
    };
    request(requestData, function (error, response, body) {
        if (!error){
            console.log(config.host +' created ad IP set to: '+ip);
        }
    });
}

function doUpdate(ip, config) {
    getRecord(config).then(function (record) {
        if (record) {
            if (record.data ===ip){
                console.log('IP Already set to: '+ip);
            }else{
               updateRecord(ip, record.id, config);

            }
        } else {
            createRecord(ip, config);
        }
    });
}


function Updater(config) {
    this.config = config;
    this.interval = null;
    this.lastIP = null;
}

var run = function () {
    var self = this;
    console.log('Checking IP');
    publicIp.v4().then(function (ip) {
        if (self.lastIP !== ip) {

            self.lastIP = ip;
            try {
                console.log('IP is now: ' + ip);
                doUpdate(ip, self.config);
            } catch (e) {
                console.log(e);
            }
        } else {
            console.log('IP hasn\'t changed from: '+ip);
        }

    }, console.log);
};

Updater.prototype.start = function () {
    var intervalFrequency = parseFloat(this.config.update_frequency) * 60 * 1000;
    if (!intervalFrequency) {
        throw new Error('No Update Frequency Specified');
        return;
    }
    var self = this;
    var runFunc = run.bind(this);
    runFunc();
    this.interval = setInterval(runFunc, intervalFrequency);
};



Updater.prototype.stop = function () {
    if (this.interval) {
        clearInterval(this.interval);
    }
};

