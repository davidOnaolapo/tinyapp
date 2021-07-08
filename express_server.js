const express = require("express");
const fs = require("fs");
const cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

app.use(cookieParser())    // For decoding the buffer
app.set("view engine", "ejs");

const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
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

const authenticate = (newUserObj, usersObj) => {
  const {email, password} = newUserObj;
  if (email.length === 0 || password.length === 0) {
    console.log("They entered an empty string");
    return false;
  }
  console.log(`About to search through ${usersObj}`, usersObj)
  const usersKeys = Object.keys(usersObj); 
  for (key of usersKeys) {
    console.log(key);
    console.log(`checking if ${usersObj[key].email} = ${email}`)
    if (usersObj[key].email === email) {
      return false;
    }
  }

  return true;
}

app.get("/", (req, res) => {
  const templateVars = {urls: urlDatabase, user : users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);

  res.render("urls_index");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase, user : users[req.cookies["user_id"]]};
  console.log(templateVars.user);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]] }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {urls: urlDatabase, user : users[req.cookies["user_id"]]};
  
  res.render("urls_register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL], user : users[req.cookies["user_id"]]}

  if (!urlDatabase[shortURL]) {               //Redirect to the main page if the shortURL is not valid
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {   
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
 res.cookie("username", req.body.username); 

 res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.cookies["user_id"]); 
 
  res.redirect("/urls");
});

app.post("/urls/register", (req, res) => {
  const legitInfo = authenticate(req.body, users);

  if (legitInfo) {
    const newStr = generateRandomString();
    const newUser = {id: newStr, email: req.body.email, password: req.body.password}

    users[newStr] = newUser;
    res.cookie("user_id", newStr);

    res.redirect("/urls");
  } else {
    res.status(404).send("You entered an invalid e-mail or password");
  } 
});

app.post("/urls", (req, res) => {
  let newStr = generateRandomString();

  urlDatabase[newStr] = req.body.longURL;        //Put the new random string and it corresponding longURL in the DB
  const templateVars =  { shortURL: newStr, longURL: urlDatabase[newStr], user : users[req.cookies["user_id"]]}; 

  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let key = req.params.id;
  let value = req.body.longURL;

  urlDatabase[key] = value;

  const templateVars = { shortURL: key, longURL: value, user : users[req.cookies["user_id"]] }

  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let key = req.params.shortURL

  delete urlDatabase[key]
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});