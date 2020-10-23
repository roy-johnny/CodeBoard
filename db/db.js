const express = require('express');
const router = express.Router();
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;

const dbHost = 'localhost';
const dbPort = 27017;
const dbName = 'code';
const db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
const dbURL = 'mongodb://' + dbHost + ':' + dbPort + '/' + dbName;
db.open(function (e, d) {
    if (e) {
        console.log(e);
    }
});

//salt
//pass
//email
//regdate
//lastdate
//socket
const account = db.collection('account');

//schema:
//user:user id
//name:project name
//id:file public id
//date:upload date
//update:update date
//size:project size
const project = db.collection('project');

//schema:
//id:public id
//user:user id
//name:file name
//date:upload date
//update:update date
//project:project id
//parent:parent folder/prj id
//type: file/folder
//size:file size
const file = db.collection('file');

const stutemp = db.collection('stutemp');

router.dbURL = dbURL;
router.account = account;
router.project = project;
router.file = file;
router.stutemp = stutemp;
module.exports = router;