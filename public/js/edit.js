function edit(id){
    if($('#'+id+'_icon').text()==='edit') {
        $('#' + id).addClass('hide');
        $('#' + id + '_form').removeClass('hide');
        $('#'+id+'_icon').text('close');
    }
    else{
        $('#' + id).removeClass('hide');
        $('#' + id + '_form').addClass('hide');
        $('#'+id+'_icon').text('edit');
    }
};

function remove(id){
    if($('#'+id+'_del').text()==='delete') {
        $('#' + id + '_delform').removeClass('hide');
        $('#'+id+'_del').text('close');
    }
    else{
        $('#' + id + '_delform').addClass('hide');
        $('#'+id+'_del').text('delete');
    }
}