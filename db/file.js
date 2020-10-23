const express = require('express');
const router = express.Router();
const shrotid = require('shortid');
const db = require('./db');
const file = db.file;
const fs = require('fs');
const rootpath = "/var/www/code/storage/file/";
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
router.getFileList = function(id,callback) {
    file.find({parent:id}).sort({name:1}).toArray(function (e,o) {
        if(o) {
            callback(o);
        }
        else {
            callback([]);
        }
    });
};

router.newFile = function(user_id, file_name, prj_id, parent_id, type, callback){
    file.findOne({$and:[{name:file_name},{parent:parent_id},{type:type},{project:prj_id}]}, (e, o) => {
        if(!o) {
            const id = shrotid.generate();
            file.insert({
                id: id,
                user: user_id,
                name: file_name,
                date: new Date(),
                project: prj_id,
                parent: parent_id,
                type: type
            }, {safe: true}, callback);
        }
        else
            callback();
    })
};

router.editFile = function (type, parent, name, id, success, error) {
    file.findOne({$and:[{type:type},{parent:parent},{name:name}]}, (e,o) => {
        if(!o){
            file.update(
                { id : id },
                { $set: { 'name' : name}},
                false,
                true
            );
            return success();
        }
        return error();
    });
};

function insert(path, parent, prj, name, data, user){
    if(path.length>0){
        file.findOne({$and:[{name:path[0]},{parent:parent},{type:'folder'},{project:prj}]}, (e, o) => {
            var id;
            if(!o) {
                id = shrotid.generate();
                file.insert({
                    id: id,
                    user: user,
                    name: path[0],
                    date: new Date(),
                    project: prj,
                    parent: parent,
                    type: 'folder'
                }, {safe: true});
            }
            else{
                id = o.id;
            }
            if(typeof(path)==='string')
                path=[];
            else
                path.shift();
            return insert(path, id, prj, name, data, user);
        })
    }
    else{
        file.findOne({$and:[{name:name},{parent:parent},{type:'file'},{project:prj}]}, (e, o) => {
            if(!o) {
                id = shrotid.generate();
                file.insert({
                    id: id,
                    user: user,
                    name: name,
                    date: new Date(),
                    project: prj,
                    parent: parent,
                    type: 'file'
                }, {safe: true});
            }
            else
                id = o.id;
            fs.writeFile(rootpath+id, data, function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        })
    }
}

router.insertfile = function (req, user, res) {
    insert(req['path[]'], req['parent_id'], req['prj_id'], req['name'], req['data'], user, res);
}

function removeFiles(id){
    file.find({parent:id}).toArray((e,o) => {
        if(o){
            for(var obj of o){
                if(obj.type==='folder') removeFiles(obj.id);
                file.remove({id:obj.id});
                let filepath = rootpath+obj.id;
                if (fs.existsSync(filepath)) {
                    fs.unlink(filepath);
                }
            }
        }
    });
}

router.removeFiles = removeFiles;

router.delete = function(parent, id){
    file.findOne({$and:[{parent:parent},{id:id}]},(e,o) => {
        if(o){
            if(o.type==='folder') removeFiles(id);
        }
        file.remove({$and:[{parent:parent},{id:id}]});
        const filepath = rootpath+id;
        if (fs.existsSync(filepath)) {
            fs.unlink(filepath);
        }
    })
};

router.Superdelete = function(id){//Warning this is dangerous. Only for editor delete. Make sure the id is correct.
    file.findOne({id:id},(e,o) => {
        if(o){
            if(o.type==='folder') removeFiles(id);
        }
        file.remove({id:id});
        const filepath = rootpath+id;
        if (fs.existsSync(filepath)) {
            fs.unlink(filepath);
        }
    })
};

function getPathRecursion(id, list, callback){
    file.findOne({id:id}, function (e,o) {
        if(o){
            list.unshift(o);
            if(o.project === o.parent)
                callback(list);
            else
                getPathRecursion(o.parent, list, callback);
        }
        else
            callback(list);
    })
}

router.getPath = function(id, callback){
    getPathRecursion(id, [], callback);
};

module.exports = router;