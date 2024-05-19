const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server on Port ${PORT}`));
const io = require('socket.io')(server);
app.use(express.json());
const generator = require('generate-password');
let firstKey;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.use(express.static(path.join(__dirname, 'public')));



const activeRoomCodes = new Set();

io.on('connection', (socket) => {
    socket.on('createRoom',()=>{
        roomId = generator.generate({
            length: 48,
            numbers: true
        });
        activeRoomCodes.add(roomId);
       
        socket.emit('roomCode',roomId)
    }) 
    socket.on('joinRoom',(roomCode)=>{
        const roomPattern=/^[A-Za-z0-9]{48}$/;
        const size=io.sockets.adapter.rooms.get(roomCode)?.size || 0;
        if(roomPattern.test(roomCode) && activeRoomCodes.has(roomCode) && size<2){
            socket.emit('acessGranted')
        }
        else{
            socket.emit('accessDenied')
        }
            
    }) 

    socket.on('socketRoom',(roomCode)=>{
        
        const room = io.sockets.adapter.rooms.get(roomCode);
        const roomSize = room ? room.size : 0;


        if (roomSize < 2) {
            socket.join(roomCode);
            const newRoomSize = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
            
            if (newRoomSize === 2) {
                io.in(roomCode).emit('start');
            }
        } 
        else
        {
            socket.emit('roomFull');
        }
        
    })
    

    socket.on('sendKey',(senderPub64,roomCode)=>{
 
        firstKey=senderPub64;
        socket.to(roomCode).emit('receiveKey',senderPub64);
    }) 

    socket.on('sendMessage', (data,roomCode) => {
        socket.to(roomCode).emit('chat', data);
    });

    socket.on('typing',(data)=>{
        socket.to(data.roomCode).emit('typing',data)
    })

    socket.on('killRoom',(roomCode)=>{
        const roomSize = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
        if(roomSize<3 && activeRoomCodes.has(roomCode))
        {
            socket.to(roomCode).emit('userLeft')
            activeRoomCodes.delete(roomCode);
        }
        
  
    })

    

    
});

