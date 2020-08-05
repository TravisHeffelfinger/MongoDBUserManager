const express = require('express');
const app = express();
const faker = require('faker')
faker.seed(123)
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const db = 'mongodb://localhost/UserManager'
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true})
const mdb = mongoose.connection;
const collectionName = 'users'
const userSchema = new mongoose.Schema({
    user_id: mongoose.Mixed,
    first_name: String,
    last_name: String,
    email_address: String,
    age: {type: Number, min: 18, max: 100},
    password: String,
    role: {type: String, default: 'user'},
    createDate: { type: Date, default: Date.now } 
  })
const User = mongoose.model('user', userSchema, collectionName)


mdb.on('error', console.error.bind(console,'connection error:'));

mdb.once('open', () => {
    console.log('db connected')
    //generate()
})

app.set('views', './views')
app.set('view engine', 'pug')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'publc')))

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/createUser', (req, res) => {
    console.log(`POST /createUser: ${JSON.stringify(req.body)}`);
    const newUser = new User();
    newUser.user_id = uuidv4();
    newUser.markModified('user_id')
    newUser.first_name = req.body.firstname
    newUser.last_name = req.body.lastname
    newUser.email_address = req.body.email
    newUser.password = req.body.password
    newUser.age = req.body.age;
    newUser.save((err, data) => {
        if (err) {
            return console.log(err)
        } 
        console.log(`new user save: ${data}`)
        res.send(`done: ${data}`)
    }) 
})


app.get('/users-list', async (req, res) => {
    let foundUsers = [];
    for await (const doc of User.find()) {
        foundUsers.push(doc); // Prints documents one at a time
      }
    res.render('userList', {users: foundUsers})
})

function generate() {
    for(let i = 0; i <= 12000; i++) {
        const newUser = new User();
        newUser.user_id = uuidv4();
        newUser.markModified('user_id');
        newUser.first_name = faker.name.firstName()
        newUser.last_name = faker.name.lastName()
        newUser.email_address = faker.internet.email()
        newUser.password = faker.internet.password()
        newUser.age = faker.random.number({'min': 18,'max': 100})
        newUser.save((err, data) => {
            if (err) {
                return console.log(err)
            } 
        })
    }
    console.log('generation complete')
}


app.listen(port, (err) => {
     (err) ? console.log(err) : console.log('server is up')

})


