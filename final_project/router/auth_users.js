const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Returns true if the username is a non-empty string
const isValid = (username) => {
  return typeof username === "string" && username.trim().length > 0;
};

// Returns true if the username and password match a registered user
const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

// Task 7: only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username and password" });
  }

  // Create the JWT access token and save it in the session
  const accessToken = jwt.sign({ data: password }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "Customer successfully logged in" });
});

// Add a book review (later task)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!review) {
    return res.status(400).json({ message: "Review text is required (use ?review=...)" });
  }

  const isUpdate = books[isbn].reviews[username] !== undefined;

  // Same user posting again replaces their review; a different user adds a new one
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: isUpdate
      ? `Review for ISBN ${isbn} updated`
      : `Review for ISBN ${isbn} added`,
    reviews: books[isbn].reviews
  });
});

// Task 9: Delete a book review (only the logged-in user's own review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (books[isbn].reviews[username] === undefined) {
    return res.status(404).json({ message: "You have no review on this book to delete" });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `Review for ISBN ${isbn} posted by ${username} deleted`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;