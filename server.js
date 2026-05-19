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