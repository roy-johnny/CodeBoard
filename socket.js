const users = require('./db/users');
const db = require('./db/db');
const project = db.project;
const fs = require('fs');
const file = db.file;
const stutemp = db.stutemp;
function checkAuth(item, callback){
    if (item.session.user) {
        if(item.session.user._id)
            return callback();
    }
}

function onUpdate(socket, file_id, init){
    fs.readFile('./storage/file/'+file_id, "utf8", (err, data) => {
        if (err) {
            data='';
            console.log(err);
        }
        if(init)
            socket.emit('initUpdate', data, file_id);
        else
            socket.emit('onUpdate', data, file_id);
    });
}

function projectUpdate(prj_id, value){
    project.update(
        {id : prj_id},
        { $set: { last_file : value}},
        false,
        true);
}

let share_list = {};
let host_list = {};
let counter = 0;

function getFiles(list, file_list, parent_id, tier){//this is a recursion
    for(var i=0;i<file_list.length;i++){
        if(file_list[i].parent===parent_id){
            file_list[i].tier=tier;
            list.push(file_list[i]);
            if(file_list[i].type==='folder'){
                list=getFiles(list, file_list, file_list[i].id, tier+1);
            }
        }
    }
    return list;
}

function pathUpdate(socket, file_id){
    socket.emit('pathUpdate', file_id);
}

function checkStu(id, socket, callback) {
    stutemp.findOne({id:id}, (e, o) => {
        if(o) {
            project.findOne({id: socket.handshake.session.project_prj}, (e, prj) => {//if prj exist
                if (prj) {
                    if (prj.user === socket.handshake.session.user._id) {
                        return callback(id, socket, prj, o);
                    }
                }
            });
        }
    });
}

module.exports = function(io) {
    io.on('connection', (socket) => {
        checkAuth(socket.handshake, () => {
            users.updateSocket(socket.handshake.session.user._id, socket.id);
        });
        socket.on('file_init', (file_id) => {
            onUpdate(socket, file_id);
        });
        socket.on('editor_init', () => {
            project.findOne({id: socket.handshake.session.project_prj}, (e,prj) => {//if prj exist
                if(prj){
                    socket.handshake.session.project_file=prj.last_file;
                    onUpdate(socket, prj.last_file, true);
                    if(socket.handshake.session.user) {
                        socket.emit('whour', prj.user === socket.handshake.session.user._id);
                        if(prj.user !== socket.handshake.session.user._id){
                            share_list[socket.id]=prj.id;
                        }
                        else{
                            host_list[prj.id]=socket.id;
                        }
                    }
                    else {
                        share_list[socket.id]=prj.id;
                        socket.emit('whour', false);
                    }
                    file.find({project:prj.id}).sort({type:1, name:1}).toArray((e,o) => {
                        stutemp.find({project:prj.id}).toArray((e,stu) => {
                            socket.emit('explorer', getFiles([], o, prj.id, 0), prj, stu);
                            pathUpdate(socket, prj.last_file);
                        });
                    });
                    // socket.emit('selectUpdate', {file_id:file_id});
                }
            });
        });
        socket.on('explorer_update', () => {
            project.findOne({id: socket.handshake.session.project_prj}, (e,prj) => {//if prj exist
                if(prj){
                    if(prj.user === socket.handshake.session.user._id)
                        file.find({project:prj.id}).sort({type:1, name:1}).toArray((e,o) => {
                            stutemp.find({project:prj.id}).toArray((e,stu) => {
                                socket.emit('explorer', getFiles([], o, prj.id, 0), prj, stu);
                                for (var key in share_list) {
                                    if (share_list[key] === socket.handshake.session.project_prj) {
                                        if (io.sockets.connected[key]) {
                                            io.sockets.connected[key].emit('explorer', getFiles([], o, prj.id, 0), prj, stu);
                                        }
                                    }
                                }
                            });
                        });
                }
            });
        });
        socket.on('approve', (id) => {
            console.log('approve ')
            checkStu(id, socket, (id, socket, prj, obj) => {
                stutemp.update(
                    {id:id},
                    {$set: {'approve':true}},
                    false,
                    true);
                if(io.sockets.connected[obj.user]){
                    io.sockets.connected[obj.user].emit('approve');
                }
                socket.emit('stusubmit');
            });
        });
        socket.on('reject', (id) => {
            checkStu(id, socket, (id, socket, prj, obj) => {
                stutemp.remove({id:id});
                if(io.sockets.connected[obj.user]){
                    io.sockets.connected[obj.user].emit('reject');
                }
                file.find({project:prj.id}).sort({type:1, name:1}).toArray((e,o) => {
                    stutemp.find({project:prj.id}).toArray((e,stu) => {
                        socket.emit('explorer', getFiles([], o, prj.id, 0), prj, stu);
                        for (var key in share_list) {
                            if (share_list[key] === socket.handshake.session.project_prj) {
                                if (io.sockets.connected[key]) {
                                    io.sockets.connected[key].emit('explorer', getFiles([], o, prj.id, 0), prj, stu);
                                }
                            }
                        }
                    });
                });
                socket.emit('stusubmit');
            });
        });
        socket.on('stusubmit', (id, data) => {
            stutemp.findOne({id:id}, (e, o) => {
                if(o) {
                    if(o.user===socket.id){
                        stutemp.update(
                            {id:id},
                            {$set: {'submit':true, 'content':data}},
                            false,
                            true);
                        if(io.sockets.connected[host_list[o.project]]){
                            io.sockets.connected[host_list[o.project]].emit('stusubmit');
                        }
                    }
                }
            });
        });
        socket.on('cancelhandup', (id) => {
            stutemp.findOne({id:id, user:socket.id}, (e, o) => {
                if(o){
                    stutemp.remove({id:id, user:socket.id});
                    socket.emit('cancelsuccess');
                    if(io.sockets.connected[host_list[o.project]]){
                        io.sockets.connected[host_list[o.project]].emit('stusubmit');
                    }
                }
            });
        });
        socket.on('getStu', (id) => {
            stutemp.findOne({id:id}, (e, o) => {
                if(o) {
                    console.log('1')
                    if(o.project === socket.handshake.session.project_prj) {
                        console.log('2')
                        project.findOne({id:o.project}, (e,prj) => {
                            if(socket.handshake.session.user) {
                                if (socket.handshake.session.user._id === prj.user) {
                                    socket.emit('getStu', id, o.content);
                                    for (var key in share_list) {
                                        if (share_list[key] === prj.id) {
                                            if (io.sockets.connected[key]) {
                                                pathUpdate(io.sockets.connected[key], id);
                                            }
                                        }
                                    }
                                }
                                else{
                                    socket.emit('getStu', id, o.content);
                                }
                            }
                            else{
                                socket.emit('getStu', id, o.content);
                            }
                        });
                    }
                    else
                        socket.emit('nofile');
                }
                else
                    socket.emit('nofile');
            });
        });
        socket.on('getFile', (file_id) => {
            file.findOne({id: file_id}, (e, o) => {
                if(o){
                    if(o.type==='file'){
                        socket.handshake.session.project_file=file_id;
                        project.findOne({id:o.project}, (e,prj) => {
                            if(socket.handshake.session.user) {
                                if (socket.handshake.session.user._id === prj.user) {
                                    projectUpdate(prj.id, file_id);
                                    onUpdate(socket, file_id);
                                    for (var key in share_list) {
                                        if (share_list[key] === prj.id) {
                                            if (io.sockets.connected[key]) {
                                                pathUpdate(io.sockets.connected[key], file_id);
                                            }
                                        }
                                    }
                                }
                                else{
                                    onUpdate(socket, file_id);
                                }
                            }
                            else{
                                onUpdate(socket, file_id);
                            }
                        });
                    }
                    else
                        socket.emit('nofile');
                }
                else
                    socket.emit('nofile');
            });
        });
        socket.on('editor_onUpdate', (o, stu) => {
            if(stu) {
                stutemp.update(
                    {id:stu},
                    {$set: {'content':o}},
                    false,
                    true);
                for (var key in share_list) {
                    if (share_list[key] === socket.handshake.session.project_prj) {
                        if (io.sockets.connected[key]) {
                            io.sockets.connected[key].emit('onUpdate', o, stu);
                        }
                    }
                }
            }
            else {
                file.findOne({id: socket.handshake.session.project_file}, function (e, file) {//to make sure file exist
                    if (file) {
                        fs.writeFile('./storage/file/' + socket.handshake.session.project_file, o, function (err) {
                            if (err) {
                                return console.log(err);
                            }
                        });
                        for (var key in share_list) {
                            if (share_list[key] === socket.handshake.session.project_prj) {
                                if (io.sockets.connected[key]) {
                                    io.sockets.connected[key].emit('onUpdate', o, socket.handshake.session.project_file);
                                }
                            }
                        }
                    } else {
                        socket.emit('nofile');
                    }
                })
            }
        });
        socket.on('file_onUpdate', (o) => {
            fs.writeFile('./storage/file/'+o.file_id, o.text, function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        });
        socket.on('handup', () => {
            if(io.sockets.connected[host_list[share_list[socket.id]]]) {
                counter+=1;
                stutemp.deleteOne({id:counter.toString()}, (e, o) => {
                    stutemp.insert({
                        id: counter.toString(),
                        user: socket.id,
                        project: share_list[socket.id],
                        approve: false,
                        submit: false
                    });
                });
                socket.emit('handup', counter.toString());
                io.sockets.connected[host_list[share_list[socket.id]]].emit('stuhandup', counter.toString());
            }
        });
        socket.on('disconnect', () => {
            checkAuth(socket.handshake, () => {
                for (var key in share_list) {
                    if(share_list[key]===socket.handshake.session.project_prj){
                        if(io.sockets.connected[key]){
                            io.sockets.connected[key].emit('offline');
                            project.update(
                                {id: socket.handshake.session.project_prj},
                                {$set: {'share_code':null}},
                                false,
                                true);
                        }
                        delete share_list[key];
                    }
                }
                stutemp.remove({project:socket.handshake.session.project_prj});
                users.updateSocket(socket.handshake.session.user._id, null);
                socket.handshake.session.share_code=null;
                socket.handshake.session.project_prj=null;
                socket.handshake.session.project_file=null;
            });
            if(share_list[socket.id])
                delete share_list[socket.id];
        });
    });
};