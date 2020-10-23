const record = $('#record');
var terminate = false;
var files = [];
$(document).ready(function(){
    $("#input-file").change(function(){
        files = this.files;
    });
});

function upload(i, first_id, second_id){
    if(i>=files.length || terminate){
        $('#uploading').text('')
        $('#progress-bar').hide();
        terminate = false;
        return location.reload();
    }
    $('#uploading').text('Uploading '+files[i].webkitRelativePath+' ('+(i+1)+' of '+files.length+')');
    var percent = (i+1)*100/files.length;
    $('#progress-bar').width(percent+'%');
    (function(file, prj_id, parent_id) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var originpath = file.webkitRelativePath;
            var path = [];
            while(originpath.indexOf('/')>-1) {
                path.push(originpath.slice(0, originpath.indexOf('/')));
                originpath = originpath.slice(originpath.indexOf('/')+1, -1);
            }
            path.shift();
            $.ajax({
                url: "/prj/upload",
                type: 'post',
                dataType: 'json',
                data: {
                    prj_id:prj_id,
                    parent_id:parent_id,
                    path:path,
                    name:file.name,
                    data:this.result
                },
                statusCode: {
                    200: function () {
                        upload(i+1, first_id, second_id)
                    },
                    400: function (e) {
                        upload(i+1, first_id, second_id)
                    },
                    413: function () {
                        record.show();
                        record.append('File size out of uploading limitation! '+file.webkitRelativePath+' is rejected!<br>')
                        upload(i+1, first_id, second_id)
                    }
                }
            });
        };
        reader.readAsText(file);
    })(files[i], first_id, second_id);
}

$("#upload-btn").click(function(){
    var pageURL = window.location.href;
    var second_id = pageURL.substr(pageURL.lastIndexOf('/') + 1);
    pageURL = pageURL.slice(0, pageURL.lastIndexOf('/'));
    var first_id = pageURL.substr(pageURL.lastIndexOf('/') + 1);
    if(first_id === 'prj')
        first_id = second_id;
    $('#progress-bar').show();
    upload(0, first_id, second_id)
});

$('#cancel2').click(function () {
    terminate = true;
});