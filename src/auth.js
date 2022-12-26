const path = require('path');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const Joi    = require('joi');
const { db } = require('./db');
const dotenv = require("dotenv")
dotenv.config({ "path": path.join(__dirname, '/.env')})

function validateSchema(data) { 
    const schema = Joi.object({
        username: Joi.string().min(3).max(255).required(),
        email: Joi.string().min(3).max(255).required(),
        role:    Joi.string().min(3).max(255).required(),
        password: Joi.string().min(3).max(1024).required(),
        apx: Joi.string()
    });
    return schema.validate(data)
}

// Register user
router.post('/register', verifyToken, async (req, res) => {
    const data = req.body;
    
    const { error } = validateSchema(data);
    if(error) return res.status(400).send(error.details[0].message);

    const users = await db.read("users")
    const user = users.find(user => user.username === data.username || user.email === data.email);
    if(user) return res.status(400).send('User already exist');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = {
        username: data.username,
        email: data.email,
        role: data.role,
        password: hashedPassword,
        apx: data.apx,  
    }

    const result = await db.create("users", newUser);
    res.send({result});
});




// Login user
router.post('/login', async (req, res) => {
    const data = req.body;
    
    const { error } = validateSchema(data);
    if(error) return res.status(400).send(error.details[0].message);

    const users = await db.read("users")
    const user = users.find(user => user.username === data.username || user.email === data.email);
    if(!user) return res.status(400).send('User not found');

    const validPass = await bcrypt.compare(data.password, user.password);
    if(!validPass) return res.status(401).send('Invalid password');

    const expiresIn = 86400;
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, process.env.TOKEN_SECRET, { expiresIn })
    const expires_at = new Date() + expiresIn;
    res.send({
        auth_token: token,
        user: {
            username: user.username,
            email: user.email,
            role: user.role,
        },
        expires_at, 
    })
});

router.post("/verifyToken", verifyToken, async (req, res) => {
    res.send({ auth_token: req.user });
})



function verifyToken(req, res, next) {
    let token = req.header('auth_token')
    if(!token) token = req.body.headers.auth_token
  
    if(!token) return res.status(401).send('Acces Denied');
  
    try {
      const verified = jwt.verify(token, process.env.TOKEN_SECRET);
      req.user = verified;
      next();
    } catch (error) {
      res.status(401).send('Invalid Token');
    }
}


module.exports = router;