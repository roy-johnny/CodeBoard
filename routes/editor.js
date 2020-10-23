const express = require('express');
const router = express.Router();
const db = require('../db/db');
const users = require('../db/users');
const file = db.file;
const File = require('../db/file');
const account = db.account;
const project = db.project;
const stutemp = db.stutemp;
const Project = require('./project');
function checkPrjAuth(req, res, next) {//check if the project belongs to the user
    if(req.body['prj_id']) {
        project.findOne({id: req.body['prj_id']}, function (e, o) {
            if (o) {//if the prj exist
                if (o.user === req.session.user._id) {//if the prj belongs to the usr
                    req.project = o;
                    next();
                }
                else
                    res.redirect('/');
            }
            else
                res.redirect('/');
        })
    }
    else
        res.redirect('/');
}
function checkFileInPrj(req, res, next) {//check if the file belongs to the project
    if(req.body['file_id']) {
        file.findOne({id: req.body['file_id']}, (e, o) => {
            if (o) {//if the file exist
                if (o.project === req.body['prj_id']) {//if the file belongs to the prj
                    req.parent=o.parent;
                    return next();
                }
            }
            res.redirect('/' + req.body['file_id']);
        })
    }
}

var randomRangeNumber = function(minNumber, maxNumber) {

    let range = maxNumber - minNumber;

    let random = Math.random();

    return minNumber + Math.round(random * range);

};


function getShareCode(callback){
    let randomNum = randomRangeNumber(1000, 9999);
    project.findOne({share_code:randomNum}, (e, o) => {
        if(o)
            getShareCode(callback);
        else
            callback(randomNum);
    })
}
router.post('/', users.checkAuth, checkPrjAuth, checkFileInPrj, function (req, res, next) {
    stutemp.remove({project:req.body['prj_id']});
    account.update(
        {_id : req.session.user._id},
        { $set: { 'project_prj' : req.body['prj_id']}},
        false,
        true);
    req.session.project_prj=req.body['prj_id'];
    req.session.project_file=req.body['file_id'];
    getShareCode((share_code) => {
        project.update(
            {id: req.body['prj_id']},
            {$set: {'last_file': req.body['file_id'], 'share_code':share_code}},
            false,
            true);
        req.session.project_code=share_code;
        req.session.prj_user = req.session.user._id;
        res.redirect('/proj/'+share_code);
    });
});
function checkShareCodeExist(req, res, next) {
    if(req.body['code_id']) {
        project.findOne({share_code: parseInt(req.body['code_id'])}, function (e, o) {
            if (o) {//if the prj exist
                req.session.project_prj = o.id;
                req.session.prj_user = o.user;
                next();
            }
            else {
                res.redirect('/');
            }
        })
    }
    else {
        res.redirect('/');
    }
}
router.checkShareCodeExist=checkShareCodeExist;
router.post('/share', checkShareCodeExist, function (req, res, next) {
    res.redirect('/proj/'+req.body['code_id']);
});
router.get('/:ID', function (req, res, next) {
    const id=req.params.ID;
    project.findOne({share_code: parseInt(id)}, function (e, o) {
        if (o) {//if the prj exist
            var ifauthor = false;
            if (req.session.user)
                if (req.session.user._id)
                    ifauthor = req.session.prj_user === req.session.user._id;
            if (req.session.project_prj && req.session.prj_user)
                res.render('editor', {id: req.session.project_prj, ifauthor: ifauthor});
            else
                res.redirect('/');
        }
        else
            res.redirect('/');
    });
});

function newfile(req, res, folder_id){
    console.log('newfile')
    File.newFile(req.session.user._id, req.body['name'], req.project.id, folder_id, req.body['type'], function (e,o) {
        if(o)
            return res.status(200).send();
        else
            return res.status(400).send();//name duplicated
    });
}
router.post('/newfile', users.checkAuth, checkPrjAuth, Project.checkNewReq, Project.checkNameEmpty, function (req, res, next) {
    var folder_id = req.project.id;
    if(req.body['parent-id']!=='') {
        file.findOne({id:req.body['parent-id']}, (e, o) => {
            if(o){
                if(o.type==='folder'){
                    folder_id = req.body['parent-id'];
                }
                if(o.project!==req.project.id)
                    return res.status(200).send();
            }
            if(folder_id===req.project.id)
                return res.status(200).send();
            else
                return newfile(req, res, folder_id);
        })
    }
    else
        return newfile(req, res, folder_id);
});
router.post('/delete', users.checkAuth, checkPrjAuth, function (req, res, next) {
    if(req.body['parent-id']!=='') {
        file.findOne({$and:[{id:req.body['parent-id']},{project:req.project.id}]}, (e, o) => {
            if(o){
                File.Superdelete(req.body['parent-id']);
                return res.status(200).send();
            }
            else
                return res.status(200).send();
        })
    }
    else
        return res.status(200).send();
});
router.post('/edit', users.checkAuth, checkPrjAuth, function (req, res, next) {
    if(req.body['name']==='')
        return res.status(200).send();
    if(req.body['parent-id']!=='') {
        file.findOne({$and:[{id:req.body['parent-id']},{project:req.project.id}]}, (e, o) => {
            if(o){
                File.editFile(o.type, o.parent, req.body['name'], req.body['parent-id'], ()=>{}, ()=>{});
                console.log('send')
                return res.status(200).send();
            }
            else
                return res.status(200).send();
        })
    }
    else
        return res.status(200).send();
});
module.exports = router;