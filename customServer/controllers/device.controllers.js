const mysql = require('../config/mysql.config');

module.exports.getParking = (req, res) => {
    console.log(req.params);
    const result = mysql.query(`SELECT * FROM traccar.tc_events 
    WHERE deviceid =${req.params.id}  and 
    (type= "deviceStopped" or type="deviceMoving") 
    order by eventtime DESC  
    limit 1 ;`, 'traccar')
    result.then(([rows, fields]) => {
        res.json(rows[0]);
    })
}