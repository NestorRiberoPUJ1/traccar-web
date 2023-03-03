const mysql = require('mysql2')
const connection = (db) => mysql.createConnection({
    host: 'copetran.safestart.com.co',
    user: 'test',
    password: 'Vps.copetran2022',
    database: db
})
module.exports.query = (query, db) => {
    const connect = connection(db);
    return connect.promise().query(query)
};