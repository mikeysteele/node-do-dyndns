/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var config = require('./config/config.json');

var updater = require('./src/updater.js')(config);

updater.start();