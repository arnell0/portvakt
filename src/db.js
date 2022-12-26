const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const database = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

const db = {
    init: () => {
        database.serialize(() => {
            database.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                email TEXT,
                role TEXT,
                password TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                apx BLOB DEFAULT NULL
            )`);
            database.run("CREATE TABLE IF NOT EXISTS store(id INTEGER PRIMARY KEY AUTOINCREMENT, key STRING, value BLOB)");
        });
    },
    create: (table, data) => {
        let keys = '';
        let values = '';
        let valuesArray = [];
        for (const key in data) {
            if (keys.length > 0) {
                keys += ', ';
                values += ', ';
            }
            keys += key;
            values += '?';
            valuesArray.push(data[key]);
        }
        return new Promise((resolve, reject) => {
            database.run(`INSERT INTO ${table} (${keys}) VALUES (${values})`, valuesArray, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    },
    read: (table, filter) => {  
        if (filter && Object.keys(filter).length > 0) {
            let where = '';
            let values = [];
            for (const key in filter) {
                if (where.length > 0) {
                    where += ' AND ';
                }
                where += `${key} = ?`;
                values.push(filter[key]);
            }
            return new Promise((resolve, reject) => {
                database.all(`SELECT * FROM ${table} WHERE ${where}`, values, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            return new Promise((resolve, reject) => {
                database.all(`SELECT * FROM ${table}`, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        }
    },
    update: (table, data, filter) => {
        let set = '';
        let values = [];
        for (const key in data) {
            if (set.length > 0) {
                set += ', ';
            }
            set += `${key} = ?`;
            values.push(data[key]);
        }
        let where = '';
        for (const key in filter) {
            if (where.length > 0) {
                where += ' AND ';
            }
            where += `${key} = ?`;
            values.push(filter[key]);
        }
        return new Promise((resolve, reject) => {
            database.run(`UPDATE ${table} SET ${set} WHERE ${where}`, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },
    delete: (table, data, filter) => {
        console.log(filter);
        let where = '';
        let values = [];
        for (const key in filter) {
            if (where.length > 0) {
                where += ' AND ';
            }
            where += `${key} = ?`;
            values.push(filter[key]);
        }
        console.log(`DELETE FROM ${table} WHERE ${where}`)
        return new Promise((resolve, reject) => {
            database.run(`DELETE FROM ${table} WHERE ${where}`, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },


    store: {
        get: (key) => {
            return new Promise((resolve, reject) => {
                database.get('SELECT value FROM store WHERE key = ?', key, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row ? row.value : null);
                    }
                });
            });
        },
        set: (key, value) => {
            return new Promise((resolve, reject) => {
                database.run('INSERT OR REPLACE INTO store(key, value) VALUES(?, ?)', key, value, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        },
        delete: (key) => {
            return new Promise((resolve, reject) => {
                database.run('DELETE FROM store WHERE key = ?', key, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        },
    }
}


module.exports = { db }