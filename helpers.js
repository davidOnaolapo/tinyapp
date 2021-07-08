const bcrypt = require('bcrypt');

const generateRandomString = () => {
  let text = ""; 
  let charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  const textLength = 6;
  
  for (let i = 0; i < textLength ; i++) { 
    text += charSet.charAt(Math.floor(Math.random() * textLength));     //Add new random character
  }

  return text;
}

const authenticate = (newUserObj, usersDatabase, register) => {
  const {email, password} = newUserObj;

  if (email.length === 0 || password.length === 0) {
    return;
  }

  const usersKeys = Object.keys(usersDatabase); 

  if (register) {                   // Checking if its authentication for registeration or log in
    for (userID of usersKeys) {
      if (usersDatabase[userID].email === email) {
        return;
      }
    }
    return true;
  } else {          // If the authentication isnt for registration, then its for log in
    for (userID of usersKeys) {
      if (usersDatabase[userID].email === email && bcrypt.compareSync(password, usersDatabase[userID].password)) {
        return userID;  
      }
    }
    return;
  }  
}

const urlsForUser = (id, urlsDatabase) => {
  const urls = {}
  const dbKeys = Object.keys(urlsDatabase)
 
  for (let shortURL of dbKeys) {
    if (id === urlsDatabase[shortURL].userID) {
      urls[shortURL] = urlsDatabase[shortURL];
    }
  }
  return urls;
}

const getUserByEmail = (email, usersDatabase) => {
  const dbKeys = Object.keys(usersDatabase)

  for (user of dbKeys) {
    if(usersDatabase[user].email === email) {
      return usersDatabase[user]
    }
  }
  return;
}

module.exports = { authenticate, generateRandomString, urlsForUser, getUserByEmail }