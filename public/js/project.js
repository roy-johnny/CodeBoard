$(document).ready(function () {
    $('#newfile').click(function () {
        $('#newfileform').show();
        $('#newfile').hide();
    });
    $('#type').change(function () {
        if($(this).val()==='file')
            $('#inputname').attr('placeholder','File Name');
        else
            $('#inputname').attr('placeholder','Folder Name');
    });
    $('#cancel1').click(function () {
        $('#newfileform').hide();
        $('#newfile').show();
    });
    $('#newfolder').click(function () {
        $('#upload-folder').show();
        $('#newfolder').hide();
    });
    $('#cancel2').click(function () {
        $('#upload-folder').hide();
        $('#newfolder').show();
    });
});