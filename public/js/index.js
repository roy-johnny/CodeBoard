const theform = $('#get-credentials-form');
var onSubmit = () => {
    $('#form-sign-in').submit()
};
var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

$(document).ready(function () {
    $("#forgot-password a").click(function () {
        $("#get-credentials").modal("show");
    });
    $('.button-sign-in').on('click', function () {
        if($('#login-email').val().match(re) && $('#login-pass').val()!=='')
            grecaptcha.execute();
        else{
            $('#form-sign-in').addClass('was-validated');
        }
    });
    theform.submit(function (e) {
        e.preventDefault();
        $('#success-info').addClass('hide');
        $('#email-alert').addClass('hide');
        $('#recaptcha-alert').addClass('hide');
        $.ajax({
            url: '/lost-password',
            type: 'post',
            dataType: 'json',
            data: theform.serialize(),
            statusCode: {
                200: function () {
                    $('#success-info').removeClass('hide');
                },
                400: function (e) {
                    if(e.responseText==='wrong recaptcha')
                        $('#recaptcha-alert').removeClass('hide');
                    else
                        $('#email-alert').removeClass('hide');
                }
            }
        });
    });
    $('#retrieve-password-submit').click(() => {
        theform.submit();
    });
});