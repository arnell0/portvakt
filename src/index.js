const express = require('express');
const app = express();
const cors = require('cors');

// database
const { db } = require('./db');
db.init();

// Middleware
app.use(express.json());  
app.use(cors());

// Route Middlewares
const authRoute = require('./auth');
app.use('/api/auth', authRoute);

let port = 1000;
app.listen(port, () => {
    console.log(`Server started on port: ${port}`)
});

app.get("/api", (req, res) => {  
    res.send("API is running");
});


// generates core routes from file
// generateRoutes('routes.json');
// currently not active
function generateRoutes(file) {
    const bcrypt = require('bcryptjs');
    function log(text, file='log.txt') {
        const fs = require('fs');
        
        let date = new Date();
        let timestamp = date.toISOString();
        
        let log = `${timestamp}: ${text}\n`;
        
        // if log.txt does not exist, create it
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, log);
        } else {
            // if log.txt is to big, delete it
            let stats = fs.statSync(file);
            let fileSizeInBytes = stats.size;
            if (fileSizeInBytes > 1000000) {
                fs.unlinkSync(file);
                fs.writeFileSync(file, log);
            } else {
                // append to log.txt
                fs.appendFileSync(file, log);
            }
        }
        
        console.log(log);
    }
    async function handler(req, res, route) {
        try {
            log(`Incoming request: ${req.method} ${req.url}`);
    
            let body
            let filter = {}
    
            if(route.method == req.method) {
    
            }
    
            if (req.body) {
                body = req.body
                
                if (route.hash) {
                    req.body[route.hash] =  await bcrypt.hash(req.body[route.hash], 10)
                }
            }
            
            if (route.filter_by && req.params) {
                filter[route.filter_by] = req.params[route.filter_by]
            }
            
            let data = []
            
            data = await db[route.action](table = route.table, data = body, filter)
            
            res.send({data})
    
        } catch (error) {
            log("error handling request: " + error);
            console.log(error);
            res.status(500).send(error);
        }
    }
    
    const fs = require('fs');
    const path = require('path');
    
    let routes_config = fs.readFileSync(path.join(__dirname, 'routes.json'));
    let routes = JSON.parse(routes_config);
    
    for (let route of routes) {
        app[route.method](route.path, (req, res) => handler(req, res, route));
    }   

    // curl -v GET example.com/api/users
    // curl -v GET example.com/api/users/1 
    // curl -v POST -H "Content-Type: application/json" -d '{"username":"test","password":"test","role":"test","apx":"test"}' example.com/api/users
    // curl -v POST -H "Content-Type: application/json" -d '{"username":"test2","password":"test2","role":"test2","apx":"test2"}' example.com/api/users/4
    // curl -X DELETE example.com/api/users/4
}









