const socket=io()
function reloadPage() {
    window.location.reload();
}

function createRoom(){
    socket.emit('createRoom');
    socket.on('roomCode',(password)=>{
        alert("The room code is: "+password)
        sessionStorage.setItem('roomCode', password);
        window.location="index.html";
    })
}




document.getElementById('joinRoom').addEventListener('click', function() {

    document.getElementById('join').disabled = false;

    document.getElementById('sender').disabled = false;
});

document.getElementById('messager').addEventListener('submit', function(event) {
    event.preventDefault(); 

  
    const roomCode = document.getElementById('join').value;
    sessionStorage.setItem('roomCode', roomCode);

    console.log('Room Code:', roomCode);
    socket.emit('joinRoom',roomCode)
})

socket.on('acessGranted',()=>{
    const roomCode = document.getElementById('join').value;
    sessionStorage.setItem('roomCode', roomCode);
    sessionStorage.setItem('joined',1);
    window.location="index.html";
})

socket.on('accessDenied',()=>{
    alert("Error invalid Room code")
})