const express = require("express");
const fs = require("fs");
const cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');


const app = express();

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

app.use(cookieParser())    // For decoding the buffer
app.set("view engine", "ejs");

const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": {
      longURL: "http://www.lighthouselabs.ca",
      userID:  "aJ48lW"
  },
  "i3BoGr": {
      longURL:  "http://www.google.com",
      userID:  "aJ48lW"
  }
};

const users = { 

}

const generateRandomString = () => {
  let text = ""; 
  let charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  const textLength = 6;
  
  for (let i = 0; i < textLength ; i++) { 
    text += charSet.charAt(Math.floor(Math.random() * textLength));     //Add new random character
  }

  return text;
}

const authenticate = (newUserObj, usersObj, register) => {
  const {email, password} = newUserObj;

  if (email.length === 0 || password.length === 0) {
    return "";
  }

  const usersKeys = Object.keys(usersObj); 

  if (register) {                   // Checking if its authentication for registeration or log in
    for (key of usersKeys) {
      if (usersObj[key].email === email) {
        return "";
      }
    }
    return true;
  } else {          // Then its an authentication for log in
    for (userID of usersKeys) {
      if (usersObj[userID].email === email && bcrypt.compareSync(password, usersObj[userID].password)) {
        return userID;  
      }
    }
    return "";
  }  
}

const urlsForUser = (id, dataBase) => {
  const urls = {}
  const keys = Object.keys(dataBase)
 
  for (let key of keys) {

    if (id === dataBase[key].userID) {
      urls[key] = dataBase[key];
    }
  }
  return urls;
}

app.get("/", (req, res) => {
  const urls = urlsForUser(req.cookies["user_id"], users);      // urls made by the current logged in user
  const user = users[req.cookies["user_id"]]                    //the current logged in user

  const templateVars = {urls, user};

  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const urls = urlsForUser(req.cookies["user_id"], urlDatabase);      // urls made by the current logged in user
  const user = users[req.cookies["user_id"]];                    //the current logged in user

  const templateVars = {urls, user}

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  if (req.cookies["user_id"]) {
    const templateVars = { user : users[req.cookies["user_id"]] }
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect ("/urls");
  }
  const templateVars = { user : users[req.cookies["user_id"]]};
  
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect ("/urls");
  }
  const templateVars = {urls: urlDatabase, user : users[req.cookies["user_id"]]};
  
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  
  if (!req.cookies["user_id"]) {        //Go log in if you're not
    res.redirect ("/login");
  }

  const userShortURLS =  urlsForUser(req.cookies["user_id"], urlDatabase)  // Get all short urls for this user
  console.log(userShortURLS)
  if (!userShortURLS[shortURL]) {                                           // Does this user own this shortURL?
    res.status(404).send("You dont own this shortURL, sorry :(");
  }

  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, user : users[req.cookies["user_id"]]}

  res.render("urls_show", templateVars);
  
});

app.get("/u/:shortURL", (req, res) => {   
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("This shortURL does not exist. Please log in to create shortURLs")
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    
    res.redirect(longURL);
  }
});

app.post("/urls", (req, res) => {
  let newStr = generateRandomString();

  if (req.cookies["user_id"]) {
    const newDBEntry = {longURL: req.body.longURL, userID: req.cookies["user_id"]}

    urlDatabase[newStr] = newDBEntry;        //Put the new random string and its corresponding longURL in the DB
    const templateVars =  { shortURL: newStr, longURL: urlDatabase[newStr].longURL, user : users[req.cookies["user_id"]]}; 

    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("You need to be logged in to get a new TinyUrl. Sign up Its free!");
  }
  
});

app.post("/login", (req, res) => {
  const loginId = authenticate (req.body, users, false)

  if (loginId) {
    res.cookie("user_id", loginId);

    res.redirect("/urls")
  } else {
    res.status(403).send("If you already signed up, please log in. If you haven't please sign up with us, its free :)")
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.cookies["user_id"]); 
 
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const legitInfo = authenticate(req.body, users, true);

  if (legitInfo) {
    const newStr = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const newUser = {id: newStr, email: req.body.email, password: hashedPassword}
    console.log(newUser)
    users[newStr] = newUser;
    res.cookie("user_id", newStr);

    res.redirect("/urls");
  } else {
    res.status(404).send("You entered an invalid e-mail or password");
  } 
});

app.post("/urls/login", (req, res) => {
  const templateVars = {user : users[req.cookies["user_id"]]};

  res.render("urls_login", templateVars);
});

app.post("/urls/register", (req, res) => {
  const templateVars = {user : users[req.cookies["user_id"]]};

  res.render("urls_register", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const key = req.params.id;
  const value = req.body.longURL;
  const newDbEntry = {longURL: value, userID: req.cookies["user_id"]};

  urlDatabase[key] = newDBEntry;

  const templateVars = { shortURL: key, longURL: value, user : users[req.cookies["user_id"]] }

  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let key = req.params.shortURL
  console.log("I want to delete",key)
  console.log(urlDatabase[key])
  if (req.cookies["user_id"] === urlDatabase[key].userID) {
    delete urlDatabase[key];
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const key = req.params.shortURL
  const value = urlDatabase[key].longURL

  if (req.cookies["user_id"] === urlDatabase[key].userID) {
    const templateVars = { shortURL: key, longURL: value, user : users[req.cookies["user_id"]] }

    res.render("urls_show", templateVars);
  } else {
    res.redirect("/urls");
  }  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});