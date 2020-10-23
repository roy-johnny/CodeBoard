const socket = io();
socket.emit('editor_init');
const sharecode = window.location.pathname.split("/").pop();
$('#sharecode').html("Share Code: "+sharecode+"&nbsp;&nbsp;&nbsp;click to show the QR code")
$('#sharecode2').text("https://YOUR_WEBSITE_LINK/share/"+sharecode)
var codeArea;
var character = 'visitor';
var current_file='';
var current_proj='';
const explorer = $('#explorer');
const theform = $('#get-credentials-form');
const filenameform = $('#filename');
const fontsize = $('#font-size');
var namedict = {};
var studict = {};
var stusubmitdict = {};
var ifedit = false;
const under_text = ' under ';
const fileform = $('#fileform');
const nofileremind = 'This file has been deleted by your previous operation. Please select an existing file to project.';
var ifdelete = false;

function changeFontSize() {
    var cols = document.getElementsByClassName('codeflask__flatten');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.fontSize = fontsize.val()+'px';
        cols[i].style.lineHeight = (parseInt(fontsize.val())+7).toString()+'px';
    }
    cols = document.getElementsByClassName('codeflask__lines');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.fontSize = fontsize.val()+'px';
        cols[i].style.lineHeight = (parseInt(fontsize.val())+7).toString()+'px';
    }
}

function getFile(file_id) {
    currentstu = false;
    $('#stuform').addClass('hide');
    $('#fileform').removeClass('hide');
    if(character==='visitor') {
        $('#' + current_file).removeClass("btn-primary").addClass("btn-secondary");
        if (current_proj !== file_id)
            $('#' + file_id).removeClass("btn-secondary btn-success").addClass("btn-primary");
    }
    else{
        $('#' + current_proj).removeClass("btn-success").addClass("btn-secondary");
        $('#' + file_id).removeClass("btn-secondary").addClass("btn-success");
        current_proj=file_id;
    }
    current_file=file_id;
    socket.emit('getFile', file_id);
}

socket.on('whour', (data)=>{
    if(data){
        character='author';
        codeArea = new CodeFlask('#codeArea', {
            language: 'java',
            lineNumbers: true
        });
    }
    else{
        codeArea = new CodeFlask('#codeArea', {
            language: 'java',
            lineNumbers: true,
            readonly: true
        });
    }
    for (var lang of Object.entries(Prism.languages)) {
        codeArea.addLanguage(lang[0], lang[1]);
    }
    codeArea.onUpdate((data) => {
        if(data === nofileremind) return;
        if(character==='author') {
            if (currentstu)
                socket.emit('editor_onUpdate', data, current_file);
            else
                socket.emit('editor_onUpdate', data);
        }
    });
});

socket.on('explorer', (data, prj, stu)=>{
    explorer.empty();
    if(character==='author')
        explorer.append('<span style="content: url(/image/folder.png);"></span>&nbsp;<a class="mb-2" onclick="newfile(\''+prj.id+'\', true)" href="javascript:;">'+ prj.name);
    else
        explorer.append('<span style="content: url(/image/folder.png);"></span>&nbsp;<span class="mb-2">'+ prj.name);
    explorer.append('</br>');
    namedict={};
    namedict[prj.id]=prj.name;
    $.each(data, (key, value) => {
        let blankspace = "";
        for(let i=0;i<value.tier+1;i++){
            for(let j=0;j<6;j++){
                blankspace+="&nbsp;";
            }
        }
        if(value.type==='folder') {
            if(character==='author')
                explorer.append(blankspace+'<span style="content: url(/image/folder.png);"></span>&nbsp;<a class="mb-2" onclick="newfile(\''+value.id+'\')" href="javascript:;">'+ value.name);
            else
                explorer.append(blankspace+'<span style="content: url(/image/folder.png);"></span>&nbsp;<span class="mb-2">'+ value.name);
        }
        else {
            explorer.append(blankspace+'<span style="content: url(/image/file.png);"></span>&nbsp;<button type="button" class="custom-btn btn btn-secondary mb-1 mt-1" id=' + value.id + ' onclick="getFile(\'' + value.id + '\')">' + value.name);
        }
        namedict[value.id]=value.name;
        explorer.append('</br>');
    });
    explorer.append('<span style="content: url(/image/folder.png);"></span>&nbsp;<span class="mb-2">Student Submission</span>');
    explorer.append('</br>');
    let blankspace = "&nbsp;&nbsp;&nbsp;&nbsp;";
    $.each(stu, (key, value) => {
        if(character==='author' || value.submit) {
            explorer.append(blankspace + '<span style="content: url(/image/file.png);"></span>&nbsp;<button type="button" class="custom-btn btn btn-secondary mb-1 mt-1" id=' + value.id + ' onclick="getStu(\'' + value.id + '\')">' + value.id);
            if(value.approve){
                if(value.submit){
                    explorer.append('<span>✔</span>');
                }
                else{
                    explorer.append('<span>✍</span>');
                }
            }
            else{
                explorer.append('<span>✋</span>');
            }
            explorer.append('</br>');
            studict[value.id] = value.approve;
            stusubmitdict[value.id] = value.submit;
        }
    });
    if(current_file!=='') {
        $('#'+current_file).removeClass("btn-secondary btn-success").addClass("btn-primary");
    }
    if(current_proj!=='') {
        $('#'+current_proj).removeClass("btn-secondary btn-primary").addClass("btn-success");
    }
});
var stuid;
var currentstu=false;
function getStu(id) {
    $('#fileform').addClass('hide');
    if(studict[id]) {
        if(stusubmitdict[id]) {
            currentstu = true;
            if (character === 'visitor') {
                $('#' + current_file).removeClass("btn-primary").addClass("btn-secondary");
                if (current_proj !== id)
                    $('#' + id).removeClass("btn-secondary btn-success").addClass("btn-primary");
            } else {
                $('#' + current_proj).removeClass("btn-success").addClass("btn-secondary");
                $('#' + id).removeClass("btn-secondary").addClass("btn-success");
                current_proj = id;
            }
            current_file = id;
            socket.emit('getStu', id);
        }
        else{
            $('#stuform').addClass('hide');
            $('#nostuinfo').text('Student ' + id + " haven't submit the code. Please wait.");
            $('#stusubmit').removeClass('hide');
        }
    }
    else {
        stuid=id;
        $('#stuapprove').text('Approve Student ' + id);
        $('#stuform').removeClass('hide');
    }
}
socket.on('getStu', (file_id, data) => {
    if(current_file===file_id) {
        fileform.addClass('hide');
        codeArea.updateCode(data);
    }
});
var ifhandup = false;
var handupapprove = false;
function handup() {
    if(ifhandup){
        if(handupapprove)
            $("#handupform").modal("show");
    }
    else{
        socket.emit('handup');
    }
}
socket.on('handup', (id) => {
    $('#handup').text('Your ID is: '+id+', please wait for teacher to approve.');
    $('#cancelhandup').removeClass('hide');
    stuid = id;
    handupapprove = false;
    ifhandup = true;
});
socket.on('cancelsuccess', () => {
    $('#handup').text('Hand Up to Submit Code');
    $('#cancelhandup').addClass('hide');
    handupapprove = false;
    ifhandup = false;
})
socket.on('stuhandup', (id) => {
    let blankspace = "&nbsp;&nbsp;&nbsp;&nbsp;";
    explorer.append(blankspace + '<span style="content: url(/image/file.png);"></span>&nbsp;<button type="button" class="custom-btn btn btn-secondary mb-1 mt-1" id=' + id + ' onclick="getStu(\'' + id + '\')">' + id);
    explorer.append('<span>✋</span>');
    explorer.append('</br>');
    studict[id] = false;
    stusubmitdict[id] = false;
});
function approve() {
    socket.emit('approve', stuid);
    $('#stuform').addClass('hide');
    $('#fileform').removeClass('hide');
}
socket.on('approve', () => {
    $('#handup').text('Your request '+stuid+' is Approved! Click here to submit your codes!');
    $('#cancelhandup').addClass('hide');
    handupapprove = true;
    $('#handupid').val(stuid);
});
function reject() {
    socket.emit('reject', stuid);
    $('#stuform').addClass('hide');
    $('#fileform').removeClass('hide');
}
socket.on('reject', () => {
    $('#cancelhandup').addClass('hide');
    $('#handup').text('Your request '+stuid+' is rejected. Click here to start a new hand up request.');
    handupapprove = false;
    ifhandup = false;
});
function stutempsubmit() {
    socket.emit('stusubmit', stuid, $('#handupcontent').val());
    $('#handup').text('Hand Up to Submit Code');
    ifhandup = false;
    handupapprove = false;
}
socket.on('stusubmit', () => {
    socket.emit('explorer_update');
});
function cancelhandup() {
    socket.emit('cancelhandup', stuid);
}
function cancel() {
    $('#stusubmit').addClass('hide');
    $('#stuform').addClass('hide');
    $('#fileform').removeClass('hide');
}

function fileformon(file_id) {
    $('#stuform').addClass('hide');
    $('#stusubmit').addClass('hide');
    fileform.removeClass('hide');
    $('#editname').val(namedict[file_id]);
    $('#file-id1').val(file_id);
    $('#file-id2').val(file_id);
}

socket.on('initUpdate', (data, file_id) => {
    fileformon(file_id);
    current_file=file_id;
    current_proj=file_id;
    codeArea.updateCode(data);
});

socket.on('onUpdate', (data, file_id) => {
    if(current_file===file_id) {
        if(!currentstu)
            fileformon(file_id);
        codeArea.updateCode(data);
    }
});

socket.on('nofile', () => {
    fileform.addClass('hide');
    codeArea.updateCode(nofileremind);
});

socket.on('pathUpdate', (file_id) => {
    if(current_proj!=='') {
        $('#' + current_proj).removeClass("btn-success");
        if (current_proj === current_file)
            $('#' + current_file).addClass("btn-primary");
        else
            $('#' + current_proj).addClass("btn-secondary");
    }
    current_proj=file_id;
    $('#'+file_id).removeClass( "btn-secondary btn-primary" ).addClass( "btn-success" );
});

socket.on('offline', () => {
    window.location.href=('/');
});

function newfile(id, ifprj){
    if(ifprj) {
        $("#delete").addClass('hide');
        $("#edit").addClass('hide');
        $("#parent-id").val('');
    }
    else {
        $("#edit").removeClass('hide');
        $("#delete").removeClass('hide');
        $("#parent-id").val(id);
    }
    $("#parent-name").text(under_text).append('<b>'+namedict[id]+'</b>');
    $("#get-credentials").modal("show");
}

function qrcode(code) {
    $("#qrcodeboard").modal("show");
}

function newform_reset() {
    $('#success-info').addClass('hide');
    $('#name-alert').addClass('hide');
    filenameform.val('');
    filenameform.removeClass('is-invalid');
    theform.removeClass('was-validated');
    $('#header').text('New file/folder');
    $('#success-edit').addClass('hide');
    $('#create-a-new').removeClass('hide');
    ifedit=false;
}

$(document).ready(function () {
    new QRCode(document.getElementById("qrcode"), "https://YOUR_WEBSITE_LINK/share/"+sharecode);
    fileform.submit(function (e) {
        e.preventDefault();
        if(ifdelete){
            $.ajax({
                url: '/proj/delete',
                type: 'post',
                dataType: 'json',
                data: fileform.serialize(),
                statusCode: {
                    200: function () {
                        socket.emit('explorer_update');
                        getFile(current_proj);
                    },
                    400: function (e) {
                        console.log(e)
                    }
                }
            });
            ifdelete=false;
        }
        else{
            fileform.addClass('was-validated');
            if($('#editname').val()==='')
                return;
            $.ajax({
                url: '/proj/edit',
                type: 'post',
                dataType: 'json',
                data: fileform.serialize(),
                statusCode: {
                    200: function () {
                        socket.emit('explorer_update');
                        $('#editname').removeClass('is-invalid');
                        fileform.removeClass('was-validated');
                    },
                    400: function (e) {
                        fileform.removeClass('was-validated');
                        $('#editname').addClass('is-invalid');
                    }
                }
            });
        }
    });
    theform.submit(function (e) {
        e.preventDefault();
        theform.addClass('was-validated');
        if(filenameform.val()==='')
            return;
        if(ifedit) {
            $.ajax({
                url: '/proj/edit',
                type: 'post',
                dataType: 'json',
                data: theform.serialize(),
                statusCode: {
                    200: function () {
                        $('#success-edit').removeClass('hide');
                        socket.emit('explorer_update');
                        filenameform.val('');
                        filenameform.removeClass('is-invalid');
                        theform.removeClass('was-validated');
                    },
                    400: function (e) {
                        $('#name-alert').removeClass('hide');
                        theform.removeClass('was-validated');
                        filenameform.addClass('is-invalid');
                    }
                }
            });
            newform_reset();
            ifedit=false;
        }
        else
            $.ajax({
                url: '/proj/newfile',
                type: 'post',
                dataType: 'json',
                data: theform.serialize(),
                statusCode: {
                    200: function () {
                        $('#success-info').removeClass('hide');
                        socket.emit('explorer_update');
                        filenameform.val('');
                        filenameform.removeClass('is-invalid');
                        theform.removeClass('was-validated');
                    },
                    400: function (e) {
                        $('#name-alert').removeClass('hide');
                        theform.removeClass('was-validated');
                        filenameform.addClass('is-invalid');
                    }
                }
            });
    });
    $('#request-submit').click(() => {
        theform.submit();
    });
    $('#fileedit').click(() => {
        fileform.submit();
    });
    $('#filedelete').click(() => {
        ifdelete=true;
        fileform.submit();
    });
    $('#cancel').click(newform_reset);
    $('#close').click(newform_reset);
    $('#delete').click(() => {
        $.ajax({
            url: '/proj/delete',
            type: 'post',
            dataType: 'json',
            data: theform.serialize(),
            statusCode: {
                200: function () {
                    socket.emit('explorer_update');
                    newform_reset();
                    getFile(current_proj);
                },
                400: function (e) {
                    console.log(e)
                }
            }
        });
    });
    $('#edit').click(() => {
        ifedit=true;
        $('#create-a-new').addClass('hide');
        $('#delete').addClass('hide');
        $('#edit').addClass('hide');
        $('#header').text('Rename folder');
        $('#filename').val($('#parent-name').text().slice(under_text.length));
    });
});