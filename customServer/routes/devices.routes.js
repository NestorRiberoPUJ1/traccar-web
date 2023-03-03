const DevicesControllers = require("../controllers/device.controllers");

module.exports = app => {
    app.get("/api/devices/parking/:id", DevicesControllers.getParking);
}