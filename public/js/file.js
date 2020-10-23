const socket = io();
const pageURL = window.location.href;
socket.emit('file_init', pageURL.substr(pageURL.lastIndexOf('/') + 1));

let codeArea = new CodeFlask('#codeArea', {
    language: 'java',
    lineNumbers: true
});
for (var lang of Object.entries(Prism.languages)) {
    codeArea.addLanguage(lang[0], lang[1]);
}
codeArea.onUpdate((data) => {
    let file_id = pageURL.substr(pageURL.lastIndexOf('/') + 1);
    if(file_id[file_id.length-1]==='#')
        file_id=file_id.slice(0, -1);
    let out={
        file_id: file_id,
        text: data
    };
    socket.emit('file_onUpdate', out);
});

socket.on('onUpdate', (data) => {
    codeArea.updateCode(data);
});