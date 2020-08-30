const express = require("express");
const app = express();
const faker = require("faker");
faker.seed(123);
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
const db = "mongodb://localhost/UserManager";
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });
const mdb = mongoose.connection;
const collectionName = "users";
const userSchema = new mongoose.Schema({
  user_id: mongoose.Mixed,
  first_name: String,
  last_name: String,
  email_address: String,
  age: { type: Number, min: 18, max: 100 },
  password: String,
  role: { type: String, default: "user" },
  createDate: { type: Date, default: Date.now },
});
const User = mongoose.model("user", userSchema, collectionName);

mdb.on("error", console.error.bind(console, "connection error:"));

mdb.once("open", () => {
  console.log("db connected");
  //generate()
});

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "publc")));

app.get("/", (req, res) => {
   res.render("index");
});

app.post("/createUser", (req, res) => {
  console.log(`POST /createUser: ${JSON.stringify(req.body)}`);
  const newUser = new User();
  newUser.user_id = uuidv4();
  newUser.markModified("user_id");
  newUser.first_name = req.body.firstname;
  newUser.last_name = req.body.lastname;
  newUser.email_address = req.body.email;
  newUser.password = req.body.password;
  newUser.age = req.body.age;
  newUser.save((err, data) => {
    if (err) {
      return console.log(err);
    }
    console.log(`new user save: ${data}`);
    res.send(`done: ${data}`);
  });
});

app.get("/users-list", async (req, res) => {
  let foundUsers = [];
  for await (const doc of User.find()) {
    foundUsers.push(doc); // Prints documents one at a time
  }
  let count = await getUserCount();
  console.log(count);
  res.render('userList',{ users: foundUsers, docCount: count });
});

app.post("/edit-user", async (req, res) => {
  let result;
  await User.find({ user_id: req.body.edit }).then(
    (res) => {
      result = res[0];
      console.log("User.find was successful", res);
    },
    (rej) => {
      console.log(rej);
    }
  );
  res.render("edit-user", { editUser: result });
});

app.post("/update-user", async (req, res) => {
  await User.updateOne(
    { user_id: req.body.userid },
    {
      first_name: req.body.firstname,
      last_name: req.body.lastname,
      email_address: req.body.email,
      age: req.body.age,
      password: req.body.password,
    }
  ).then(
    (response) => {
      console.log("update complete", response);
    },
    (reject) => {
      console.log(reject);
    }
  );
  res.redirect("/users-list");
});

app.get("/sort-ascending", async (req, res) => {
  let sortedAscending = [];
  for await (const doc of User.find()
    .collation({ locale: "en", strength: 2 })
    .sort({ first_name: 1 })) {
    sortedAscending.push(doc); // Prints documents one at a time
  }
  let count = await getUserCount();
  res.render("userList", { users: sortedAscending, docCount: count });
});
app.get("/sort-descending", async (req, res) => {
  let sortedDescending = [];
  for await (const doc of User.find()
    .collation({ locale: "en", strength: 2 })
    .sort({ first_name: -1 })) {
    sortedDescending.push(doc); // Prints documents one at a time
  }
  let count = await getUserCount();
  res.render("userList", { users: sortedDescending, docCount: count });
});
app.post("/search-users", async (req, res) => {
  //console.log(req.body.userSearch)
  let foundUser;
  let userArray = [];
  // await User.find({first_name: new RegExp(`^${req.body.userSearch.trim()}`,'i')},(err, res) => {
  //     if(err) console.log(err)
  //     foundUser = res
  //     console.log(foundUser)
  // })
  for await (const doc of User.find({
    first_name: new RegExp(`^${req.body.userSearch.trim()}`, "i"),
  })) {
    userArray.push(doc);
    //console.log(userArray)
  }
  let count = userArray.length
  res.render(`userList`, { users: userArray, docCount: count, searchedName: req.body.userSearch });
});
//var regex = new RegExp(["^", string, "$"].join(""), "i");
app.post("/delete-user", async (req, res) => {
  await User.findOneAndDelete({ user_id: req.body.delete }, (err, res) => {
    if (err) console.log(err);
    if (res) console.log(res);
  });
  res.redirect("/users-list");
});

async function getUserCount() {
  let result = await User.countDocuments({}, (err, res) => {
    return res;
  });
  return result;
}

function generate() {
  for (let i = 0; i <= 20; i++) {
    const newUser = new User();
    newUser.user_id = uuidv4();
    newUser.markModified("user_id");
    newUser.first_name = faker.name.firstName();
    newUser.last_name = faker.name.lastName();
    newUser.email_address = faker.internet.email();
    newUser.password = faker.internet.password();
    newUser.age = faker.random.number({ min: 18, max: 100 });
    newUser.save((err, data) => {
      if (err) {
        return console.log(err);
      }
    });
  }
  console.log("generation complete");
}

app.listen(port, (err) => {
  err ? console.log(err) : console.log("server is up");
});
