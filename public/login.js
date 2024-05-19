const socket=io()
function reloadPage() {
    window.location.reload();
}

function createRoom() {
    socket.emit('createRoom');
    socket.on('roomCode', (password) => {
        swal.fire({
            title: 'Room Code',
            text: "Share this code with the person you want to chat. The room code is: " + password,
            icon: 'success',
            confirmButtonText: 'OK'
        }).then(() => {
            sessionStorage.setItem('roomCode', password);
            window.location = "index.html";
        });
    });
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
    swal.fire({
        title: 'Error',
        text: "Invalid Room Code!",
        icon: 'error',
        confirmButtonText: 'OK'
    }).then(() => {
        reloadPage()
    });
    
})