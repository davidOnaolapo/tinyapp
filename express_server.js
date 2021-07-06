const { KeyObject } = require("crypto");
const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));     // For decoding the buffer
app.set("view engine", "ejs");

const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  let text = ""; 
  let charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  const textLength = 6;
  
  for (let i = 0; i < textLength ; i++) { 
    text += charSet.charAt(Math.floor(Math.random() * textLength));     //Add new random character
  }

  return text;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {               //Redirect to the main page if the shortURL is not valid
    res.render("urls_index", {urls: urlDatabase});
  }
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]};

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {   
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let newStr = generateRandomString();

  urlDatabase[newStr] = req.body.longURL;        //Put the new random string and it corresponding longURL in the DB
  const templateVars =  { shortURL: newStr, longURL: urlDatabase[newStr]}; 

  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let key = req.params.id;
  let value = req.body.longURL;

  console.log(value)

  urlDatabase[key] = value;

  const templateVars = { shortURL: key, longURL: value }

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