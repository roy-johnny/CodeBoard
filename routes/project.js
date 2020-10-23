const express = require('express');
const router = express.Router();
const shrotid = require('shortid');
const db = require('../db/db');
const project = db.project;
const file = db.file;
//schema:
//id:file public id
//user:user id
//name:project name
//date:upload date
//update:update date
//size:project size
const users = require('../db/users');
const File = require('../db/file');

function checkPrjAuth(req, res, next) {//check if the project belongs to the user
    project.findOne({id:req.params.ID},function (e,o) {
        if(o){
            if(o.user===req.session.user._id){
                return next();
            }
        }
        res.redirect('../');
    })
}
function checkNameEmpty(req,res,next){
    if(req.body['name'])
        if(req.body['name']!=='')
            return next();
    res.redirect('./?error=noname');
}
router.checkNameEmpty = checkNameEmpty;
router.post('/new', users.checkAuth, checkNameEmpty, function (req, res, next) {
    const id=shrotid.generate();
    project.insert({
        id: id,
        user: req.session.user._id,
        name: req.body['name'],
        date: new Date()
    },{safe:true},function (e,o) {
        if(o){
            res.redirect('/prj/'+id);
        }
    })
});

router.post('/upload', users.checkAuth, checkNameEmpty, function (req, res, next) {
    project.findOne({id:req.body['prj_id']},function (e,o) {
        if(o){
            if(o.user===req.session.user._id){
                if (!req.body['path[]']) req.body['path[]'] = [];
                if (req.body['prj_id'] === req.body['parent_id']){
                    File.insertfile(req.body, req.session.user._id, res);
                }
                else{
                    file.findOne({id:req.body['parent_id']},function (e,o) {
                        if(o){
                            if(o.project===req.body['prj_id']){
                                File.insertfile(req.body, req.session.user._id, res);
                            }
                        }
                    })
                }
            }
        }
        return setTimeout(()=>{res.status(200).send();}, 1000);
    })
});

function checkNewReq(req,res,next){
    if(req.body['type']!=='file' && req.body['type']!=='folder')
        res.redirect(req.params.ID);
    else
        next();
}
router.checkNewReq = checkNewReq;
router.post('/:ID/new',users.checkAuth, checkPrjAuth, checkNewReq, checkNameEmpty, function (req,res,next) {
    const id=req.params.ID;
    File.newFile(req.session.user._id, req.body['name'], id, id, req.body['type'], function (e,o) {
        if(o)
            res.redirect('/prj/'+id+'/'+o.ops[0].id);
        else
            res.redirect('/prj/'+id);
    });
});
router.post('/:ID/edit',users.checkAuth, checkPrjAuth, checkNewReq, checkNameEmpty, function (req,res,next) {
    const file_id=req.body['id'];
    const name=req.body['name'];
    if(!file_id || file_id===''){
        res.redirect('/prj/'+req.params.ID);
        return;
    }
    File.editFile(req.body['type'], req.params.ID, name, file_id, () => {
            res.redirect('/prj/'+req.params.ID+'/'+req.params.FID);},
        () => {res.redirect('/prj/'+req.params.ID+'/?error=nameoccupied');})
});
router.post('/:ID/delete',users.checkAuth, checkPrjAuth, function (req,res,next) {
    const file_id=req.body['id'];
    if(!file_id || file_id===''){
        res.redirect('/prj/'+req.params.ID);
        return;
    }
    File.delete(req.params.ID, file_id);
    res.redirect('/prj/'+req.params.ID);
});
function checkFileInPrj(req, res, next) {//check if the file belongs to the project
    file.findOne({id:req.params.FID},function (e,o) {
        if(o){//if the file exist
            if(o.project===req.params.ID){//if the file belongs to the prj
                return next();
            }
        }
        res.redirect('/prj/'+req.params.ID);
    })
}
function checkFolder(req,res,next){
    file.findOne({id:req.params.FID},function (e,o) {
        if(o){//if the folder exist
            if(o.type==='folder'){//if it is folder
                return next();
            }
        }
        res.redirect('/prj/'+req.params.ID);
    })
}
router.post('/:ID/:FID/new', users.checkAuth, checkPrjAuth, checkNewReq, checkNameEmpty, checkFolder, checkFileInPrj, function (req, res, next) {
    const prj_id=req.params.ID;
    const file_id=req.params.FID;
    File.newFile(req.session.user._id, req.body['name'], prj_id, file_id, req.body['type'], function (e,o) {
        if(o)
            res.redirect('/prj/'+prj_id+'/'+o.ops[0].id);
        else
            res.redirect('/prj/'+prj_id);
    });
});
router.post('/:ID/:FID/edit', users.checkAuth, checkPrjAuth, checkNewReq, checkNameEmpty, checkFolder, checkFileInPrj, function (req, res, next) {
    const file_id=req.body['id'];
    const name=req.body['name'];
    if(!file_id || file_id===''){
        res.redirect('/prj/'+req.params.ID+'/'+req.params.FID);
        return;
    }
    File.editFile(req.body['type'], req.params.FID, name, file_id, () => {
            res.redirect('/prj/'+req.params.ID+'/'+req.params.FID);},
        () => {res.redirect('/prj/'+req.params.ID+'/'+req.params.FID+'?error=nameoccupied');})
});
router.post('/:ID/:FID/delete', users.checkAuth, checkPrjAuth, checkFolder, checkFileInPrj, function (req, res, next) {
    const file_id=req.body['id'];
    if(!file_id || file_id===''){
        res.redirect('/prj/'+req.params.ID+'/'+req.params.FID);
        return;
    }
    File.delete(req.params.FID, file_id);
    res.redirect('/prj/'+req.params.ID+'/'+req.params.FID);
});
router.get('/:ID/:FID', users.checkAuth, checkPrjAuth, checkFileInPrj, function (req, res, next) {
    const prj_id=req.params.ID;
    const file_id=req.params.FID;
    project.findOne({id:prj_id},function(e,prj) {
        file.findOne({id: file_id}, function (e, o) {
            File.getPath(file_id, function (path) {
                if (o.type === 'file') {
                    res.render('file', {
                        project: prj,
                        file_id:o.id,
                        path: path,
                    });
                } else {
                    File.getFileList(file_id, function (files) {
                        res.render('folder', {
                            project: prj,
                            folder: o,
                            path: path,
                            file_list: files
                        });
                    });
                }
            });
        });
    });
});

router.get('/:ID', users.checkAuth, checkPrjAuth, function (req, res, next) {
    const id=req.params.ID;
    project.findOne({id:id},function (e,prj) {
        if(prj){
            File.getFileList(id, function (files) {
                res.render('project', {
                    project: prj,
                    file_list: files
                });
            });
        }
        else
            res.redirect('../');
    });
});

router.getProjectList = getProjectList;
module.exports = router;

function getProjectList(user,callback) {
    project.find({user:user}).toArray(function (e,o) {
        if(o) {
            callback(o);
        }
        else {
            callback([]);
        }
    });
}