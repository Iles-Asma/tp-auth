const express =  require('exprrss');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
app.use(express.json());

app.use(express.static('public'));

app.post('/register', async (req, res)=>{
    const {username,password} = res.body

    const hash = await bcrypt.hash(password, 10);

    try {
        const insert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        insert.run(username, hash);
        res.status(201).json({message: 'User registered successfully'});
    }catch (err) {
      res.status(400).json({message: 'Username already exists'});
    }
    
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const checkAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setheader('WWW-Authenticate', 'Basic realm="Administration"');
        return res.status(401).send('Authentication requise');
    }
    const base64 = authHeader.split(' ')[1];
    const [username, password] = Buffer.from(base64, 'base64').toString().split(':');

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && (await bcrypt.compare(password, user.password_hash))) {
        req.user = user;
        next();
    }else {
        return res.status(401).send('identifiants invalides');
    }
}

app.get('/admin-page', checkAuth, (req, res) => {
    res.sendFile(__dirname + '/public/admin-page.html');
});
