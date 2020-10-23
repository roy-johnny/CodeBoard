const settingForm = $('#setting-form');
const onSubmit = () => {
    settingForm.submit()
};
const email=$('#email'), pass0=$('#pass0'), pass1=$('#pass1'), pass2=$('#pass2');

$(document).ready(function () {
    settingForm.submit(function (e) {
        e.preventDefault();
        email.removeClass('is-invalid'); pass0.removeClass('is-invalid'); pass1.removeClass('is-invalid'); pass2.removeClass('is-invalid');
        $('#success-info').addClass('hide');
        $('#pass-alert').addClass('hide');
        $('#email-alert').addClass('hide');
        var flag=false;
        if(!email.val()) {flag=true; email.addClass('is-invalid');}
        if(!pass0.val()) {flag=true; pass0.addClass('is-invalid');}
        if(pass1.val()!==pass2.val()) {flag=true; pass2.addClass('is-invalid');}
        if(flag) return;
        $.ajax({
            type: 'post',
            dataType: 'json',
            data: settingForm.serialize(),
            statusCode: {
                200: function () {
                    $('#success-info').removeClass('hide');
                },
                400: function (e) {
                    if(e.responseText==='wrong password'){
                        pass0.addClass('is-invalid');
                        $('#pass-alert').removeClass('hide');
                    }
                    else if(e.responseText==='invalid email'){
                        email.addClass('is-invalid');
                        $('#email-alert').removeClass('hide');
                    }
                }
            }
        });
    });
});