const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { authenticate, generateRandomString, urlsForUser } = require("./helpers.js");

const app = express();

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(cookieParser())    // For decoding the buffer

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}))

app.set("view engine", "ejs");

const PORT = 8080; // default port 8080

const urlDatabase = {
};

const users = { 
};

app.get("/", (req, res) => {
  
  return res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const urls = urlsForUser(req.session.user_id, urlDatabase);      // urls made by the current logged in user
  const user = users[req.session.user_id];                    //the current logged in user

  const templateVars = {urls, user}

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  if (req.session.user_id) {
    const templateVars = { user : users[req.session.user_id] }

   return res.render("urls_new", templateVars);
  
  } 
  res.redirect("/login")
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect ("/urls");
  }
  const templateVars = { user : users[req.session.user_id]};
  
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect ("/urls");
  }
  const templateVars = {urls: urlDatabase, user : users[req.session.user_id]};
  
  res.render("urls_login", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect ("/urls");
  }
  const templateVars = {urls: urlDatabase, user : users[req.session.user_id]};
  
  res.render("urls_login", templateVars);
});

app.get("/urls_error_lr", (req, res) => {
  const templateVars = {user : users[req.session.user_id]};
  
  res.render("urls_error_lr", templateVars);
});

app.get("/urls_error_reg", (req, res) => {
  const templateVars = {user : users[req.session.user_id]};
  
  res.render("urls_error_reg", templateVars);
});

app.get("/urls_error_log", (req, res) => {
  const templateVars = {user : users[req.session.user_id]};
  
  res.render("urls_error_log", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect ("/urls");
  }
  const templateVars = {urls: urlDatabase, user : users[req.session.user_id]};
  
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  
  if (!req.session.user_id) {        //Go log in if you're not logged in
    return res.redirect ("/login");
  }

  const userShortURLS =  urlsForUser(req.session.user_id, urlDatabase)  // Get all short urls for this user
  if (!userShortURLS[shortURL]) {                     //Does this user own this shortURL?
    const templateVars = {user : users[req.session.user_id] }  

    return res.render("urls_error_id", templateVars);
  }

  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, user : users[req.session.user_id]}

  res.render("urls_show", templateVars);  
});

app.get("/u/:shortURL", (req, res) => {   
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("This shortURL does not exist. Please log in to create shortURLs");
  } 
    const longURL = urlDatabase[req.params.shortURL].longURL;

    return res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();

  if (req.session.user_id) {
    const newDBEntry = {longURL: req.body.longURL, userID: req.session.user_id}
    urlDatabase[shortURL] = newDBEntry;
            //Put the new random string and its corresponding longURL in the DB
   return res.redirect(`/urls/${shortURL}`);
  } 
    res.status(404).send("You need to be logged in to get a new TinyUrl. Sign up Its free!");
});

app.post("/login", (req, res) => {
  const loginID = authenticate (req.body, users, false)

  if (loginID === "er1") {
    return res.redirect("/urls_error_lr");            //render the correct error page, depending on authentication response
  }

  if (loginID === "er3") {
    return res.redirect("/urls_error_log");
  }

  req.session.user_id = loginID;
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");

  res.redirect("/login");
});

app.post("/register", (req, res) => {                   //render the correct error page, depending on authentication response
  const infoCheck = authenticate(req.body, users, true);

  if (infoCheck === "er1") {
   return res.redirect("/urls_error_lr");
  }

  if (infoCheck === "er2") {
    return res.redirect("/urls_error_reg");
  }

  const newID = generateRandomString();                 //  generate new id
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  const newUser = {id: newID, email: req.body.email, password: hashedPassword}
  users[newID] = newUser;
  req.session.user_id = newID;

  res.redirect("/urls");
});

app.post("/urls/login", (req, res) => {

  res.redirect("/login");
});

app.post("/urls/register", (req, res) => {

  res.redirect("/register");
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;

  if (req.session.user_id) {
    const userShortURLS =  urlsForUser(req.session.user_id, urlDatabase)  // Get all short urls for this user

    if(userShortURLS[shortURL]) {                       // only insert into DB if its a legit owner
      const newDbEntry = {longURL, userID: req.session.user_id};

      urlDatabase[shortURL] = newDbEntry;

      return res.redirect("/urls");
    }
  }
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  if (req.session.user_id === urlDatabase[shortURL].userID) {     //can only delete if you're the logged in user
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL].longURL

  if (req.session.user_id === urlDatabase[shortURL].userID) {        //can only edit if you're the logged in user
    return res.redirect(`/urls/${shortURL}`);
  }
    res.redirect("/urls"); 
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});