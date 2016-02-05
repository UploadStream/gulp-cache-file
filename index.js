var crypto = require('crypto'),
    fs = require('fs'),
    path = require('path');

var through = require('through2');


var format = require('./format');

function getMd5(p) {
    var str = fs.readFileSync(p, 'utf-8');
    var md5um = crypto.createHash('md5');
    md5um.update(str);
    return md5um.digest('hex');
}

var cacheFile = function(name, opt) {
    var lastConfig;
    try {
        var configBuffer = fs.readFileSync("./crypto.config");
        lastConfig = JSON.parse(configBuffer);
    } catch (e) {
        console.log(e);
    }

    lastConfig = lastConfig || {};
    var newConfig = {};
    var stream = through.obj(function(file, enc, callback) {
        var contents = file.checksum;
        if (!contents) {
            if (file.isStream()) {
                this.push(file);
                return callback();
            }
            if (file.isBuffer()) {
                contents = file.contents.toString('utf8');
                newConfig[file.path] = getMd5(file.path);
            }
            if (lastConfig[file.path] == newConfig[file.path]) {
                callback();
            } else {
                console.log('not hit! ' + file.path);
                this.push(file);
                callback();
            }
        }
        fs.writeFileSync("./crypto.config", format(JSON.stringify(newConfig)), 'utf8');

    });
    return stream;

};


module.exports = cacheFile;
