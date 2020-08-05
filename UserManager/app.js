const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;
const mongoose = require('mongoose')
const db = 'mongodb://localhost/UserManager'
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true})
const datab = mongoose.connection;
const collectionName = 'user'
const UserSchema = new mongoose.Schema({
    name: String,
    role: String,
    age: {type: Number, min: 18, max: 100},
    createdDate: {type: Date, default: Date.now }
})
const user = mongoose.model('User', UserSchema, collectionName)


datab.on('error', console.error.bind(console,'connection error:'));

datab.once('open', () => {
    console.log('db connected')
})

app.set('views', './views')
app.set('view engine', 'pug')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'publc')))

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/addUser', (req, res) => {
    console.log(`POST /newUser: ${JSON.stringify(req.body)}`);
    const newUser = new user();
    newUser.name = req.body.name;
    newUser.role = req.body.role;
    newUser.age = req.body.age;
    newUser.save((err, data) => {
        if (err) {
            return console.log(err)
        } 
        console.log(`new user save: ${data}`)
        res.send(`done: ${data}`)
    }) 
})






app.listen(port, (err) => {
     (err) ? console.log(err) : console.log('server is up')

})