const express = require('express'); // importación del paquete express
const cors = require('cors') // Importación CORS
const { io } = require("socket.io-client");//io

app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()) // Uso de política de orígenes

const deviceRoutes = require('./routes/devices.routes');
deviceRoutes(app);
const socket = io("copetran.safestart.com.co:8082/api/socket");
socket.on("connection", (socket) => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});


app.listen(8000, () => {
    console.log('CONNECTED');
})