const fs = require('fs');
const express = require('express');
const cors = require('cors');
const socketIO = require('socket.io');
const https = require('https');

let config;
try {
    config = JSON.parse(fs.readFileSync('config.json'));
} catch (error) {
    config = []
}

let rooms;
try{
    rooms = JSON.parse(fs.readFileSync('database.json'));
}catch{
    rooms = {}
}

//INICIALIZACION
const SSL = {
    cert: fs.readFileSync('./certificado/server.cer'),
    key: fs.readFileSync('./certificado/server.key')
};
const PORT = process.env.PORT || 3000;
const app = express();
const server = https.createServer(SSL, app);
const io = socketIO(server, {
    cors: {
        origin: config.dominios,
        credentials: true
    }
});

//settings
app.set('port', process.env.PORT || 3000);

// const httpServer = createServer();
// const io = new Server(httpServer, {
//     cors: {
//         origin: ["http://127.0.0.1:5500", "https://moondongo.github.io"],
//         credentials: true
//     }
// });


io.on("connection", (socket) => {
    const room = socket.handshake.headers.origin //obtengo el dominio del cliente
    if(!(room in rooms)) rooms[room] = []; //Si no existe la sala, la creo en mi objeto ROOMS
    socket.join(room);  //agregar al cliente a su propia sala (la de su dominio)

    socket.emit("historial_mensaje", rooms[room]); //le envio el historial de mensaje de esa sala    

    socket.on("nuevo_mensaje", (message) => {
        message['date'] = Date.now();
        io.to(room).emit("difundir_mensaje", message);

        if(rooms[room].length > 50) rooms[room].shift(); //limito el historial de mensaje de cada sala
        rooms[room].push(message)

        fs.writeFile("database.json", JSON.stringify(rooms, null, 2), (err) => {
            if (err) throw err;
            console.log('Data written to file');
        })
    });
    
});

app.get('/', (req, res) => {
    res.send('Servicio en Marcha, mi ray');
})
server.listen(PORT, () => {
    console.log(`Servidor en Marcha en puerto ${PORT}`)
})



