const settingForm = $('#setting-form');
const onSubmit = () => {
    settingForm.submit()
};
const pass=$('#pass');

$(document).ready(function () {
    settingForm.submit(function (e) {
        e.preventDefault();
        settingForm.addClass('was-validated');
        if(pass.val()==='') return;
        $('#pass').addClass('hide');
        $('#submitbtn').addClass('hide');
        $.ajax({
            type: 'post',
            dataType: 'json',
            data: settingForm.serialize(),
            statusCode: {
                200: function () {
                    $('#success-info').removeClass('hide');
                }
            }
        });
    });
});