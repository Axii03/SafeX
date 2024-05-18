const socket=io()
const typingUser=document.getElementById('name')
const messageblock=document.getElementById('messageBlock')
const username=document.getElementById('nameInput')
const messageForm=document.getElementById('messageSend')
const message=document.getElementById('messageInput')
const crypto = require('crypto');
const aes256=require('aes256');
let sessionKey;
const sender=crypto.createECDH('secp256k1');
sender.generateKeys() 
const senderPub64=sender.getPublicKey().toString('base64')
const roomCode = sessionStorage.getItem('roomCode');

socket.emit('socketRoom',roomCode)
socket.on('start',()=>{
    socket.emit('sendKey',senderPub64,roomCode) 

})

socket.on('receiveKey',(senderPub64)=>{
    sessionKey=sender.computeSecret(senderPub64,'base64','hex')
 
})


socket.on('roomFull', () => {
    alert("The room is already full. Please enter a valid room code.");
    window.location.href = "login.html"; 
});


messageForm.addEventListener('submit',(e)=>{
    e.preventDefault() 
    sendMsg()
})

function sendMsg(){
    if(message.value=='')return
    
    if(message.value==='###help')
    {
        const data2={
            name:'Help requested by '+username.value,
            message:'Welcome to SafeX help!! To get started set a custom name in the field marked guest.It will auto save.Type your message and hit the send.If a client disconnects you will have to recreate the room and start a conversation for security measures',
            dateTime:new Date()
        }
        const dataString = JSON.stringify(data2);
        const encrypt=aes256.encrypt(sessionKey,dataString);
        addMsg(true,data2)
        message.value='' 
    }
    else if(message.value==='###about')
        {
            const data2={
                name:'About requested by '+username.value,
                message:'Welcome to SafeX about!!This is a real time chat application using socket io. The chat is end to end encrypted and does not log any user data.It also has undergone severe security testing',
                dateTime:new Date()
            }
            const dataString = JSON.stringify(data2);
            const encrypt=aes256.encrypt(sessionKey,dataString);
            addMsg(true,data2)
            message.value='' 
        }  
    else{
        const data={
            name: username.value,
            message:message.value,
            dateTime:new Date()
        }
        const dataString=JSON.stringify(data);
        const hash = crypto.createHash('sha256').update(dataString).digest('hex');
        const encrypt=aes256.encrypt(sessionKey,dataString);
        let encryptHash={
            message:encrypt,
            hash:hash
        }
        socket.emit('sendMessage',encryptHash,roomCode)
        addMsg(true,data)
        message.value='' 
    }
    
}

function helper(){
    const formattedDateTime = moment(data.dateTime).format('HH:mm:ss');
    const element=`<li class="messageLeft">
    <p class="message">
        Welcome to SafeX help!!
        To get started set a custom name in the field marked guest.It will auto save.

        <span id="lSpan">SafeX ⨷ ${formattedDateTime}</span>
    </p>
</li>`
messageblock.innerHTML+=element
autoscroll()
}
socket.on('chat',(data)=>{
    
    const decryptString=aes256.decrypt(sessionKey,data.message);
    const decryptedData=JSON.parse(decryptString); 
    const receivedHash=data.hash;
    const calculatedHash = crypto.createHash('sha256').update(decryptString).digest('hex');
    if(receivedHash===calculatedHash){
        addMsg(false,decryptedData)
    }
    else{
        alert("Message Integrity check failed.Message has been corrupted or modified.Request resend!!!!")
    }        
})

function addMsg(own,data){
    clearTyping()
    const formattedDateTime = moment(data.dateTime).format('HH:mm:ss');
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    const sanitizedMessage = escapeHTML(data.message);
    const element=`<li class="${own ? "messageRight":"messageLeft"}">
    <p class="message">
        ${sanitizedMessage}
        <span id="lSpan">${data.name} ⨷ ${formattedDateTime}</span>
    </p>
</li>`

messageblock.innerHTML+=element
autoscroll()
}

function autoscroll(){
    messageblock.scrollTo(0,messageblock.scrollHeight)
}
message.addEventListener('keypress',(e)=>{
    socket.emit('typing',{
        roomCode:roomCode,
        user:`💭${username.value} is typing`
    })
})

message.addEventListener('focus',(e)=>{
    socket.emit('typing',{
        roomCode:roomCode,
        user:`💭${username.value} is typing`
    })
})

message.addEventListener('blur',(e)=>{
   
    socket.emit('typing',{
        roomCode:roomCode,
        user:''
    })
})


socket.on('typing',(data)=>{
    clearTyping()
    const element = `
    <p class="typing" id="typing">
    ${data.user}
</p>
  `
  
  typingUser.innerHTML += element
})


  function clearTyping() {
    document.querySelectorAll('.typing').forEach((element) => {
      element.parentNode.removeChild(element)
    })
  }

username.addEventListener('change', () => {
    localStorage.setItem('username', username.value);
})

socket.on('userLeft',()=>{
    alert("The Receiver has left the chat.Please Use a new room");
    window.location.href = "login.html";
})
function handleBeforeUnload() {
    socket.emit('killRoom',(roomCode));
}

window.addEventListener('beforeunload', handleBeforeUnload);
