var onSubmit = () => {
    $('#signup-form').submit()
};
var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

$(document).ready(function () {
    $("#forgot-password a").click(function () {
        $("#get-credentials").modal("show");
    });
    $('.button-sign-in').on('click', function () {
        if ($('#email').val().match(re) && $('#pass').val() !== '' && $('#code').val() !== '')
            grecaptcha.execute();
        else {
            $('#signup-form').addClass('was-validated');
        }
    });
});