var express = require("express");
var router = express.Router();

// Require controller modules
var book_controller = require("../controllers/bookController.js");
var author_controller = require("../controllers/authorController.js");
var genre_controller = require("../controllers/genreController.js");
var book_instance_controller = require("../controllers/bookInstanceController.js");

// BOOK ROUTES

// GET catalog home page
router.get("/", book_controller.index);

// GET request for creating a book. Note this must come before the routes below that use :id
router.get("/book/create", book_controller.book_create_get);

// POST request for creating a book.
router.post("/book/create", book_controller.book_create_post);

// GET request to delete book.
router.get("/book/:id/delete", book_controller.book_delete_get);

// POST request to delete book.
router.post("/book/:id/delete", book_controller.book_delete_post);

// GET request to update book.
router.get("/book/:id/update", book_controller.book_update_get);

// POST request to update book.
router.post("/book/:id/update", book_controller.book_update_post);

// GET request for one book.
router.get("/book/:id", book_controller.book_detail);

// GET request for list of all books
router.get("/books", book_controller.book_list);

// AUTHOR ROUTES

// GET request for creating an author. Note this must come before the routes below that use :id
router.get("/author/create", author_controller.author_create_get);

// POST request for creating an author.
router.post("/author/create", author_controller.author_create_post);

// GET request to delete an author
router.get("/author/:id/delete", author_controller.author_delete_get);

// POST request to delete an author
router.post("/author/:id/delete", author_controller.author_delete_post);

// GET request to update an author.
router.get("/author/:id/update", author_controller.author_update_get);

// POST request to update an author.
router.post("/author/:id/update", author_controller.author_update_post);

// GET request for one author.
router.get("/author/:id", author_controller.author_detail);

// GET request for list of all books
router.get("/authors", author_controller.author_list);

// GENRE ROUTES

// GET request for creating a Genre. NOTE This must come before routes below that use :id
router.get('/genre/create', genre_controller.genre_create_get);

//POST request for creating Genre.
router.post('/genre/create', genre_controller.genre_create_post);

// GET request to delete Genre.
router.get('/genre/:id/delete', genre_controller.genre_delete_get);

// POST request to delete Genre.
router.post('/genre/:id/delete', genre_controller.genre_delete_post);

// GET request to update Genre.
router.get('/genre/:id/update', genre_controller.genre_update_get);

// POST request to update Genre.
router.post('/genre/:id/update', genre_controller.genre_update_post);

// GET request for one Genre.
router.get('/genre/:id', genre_controller.genre_detail);

// GET request for list of all Genre.
router.get('/genres', genre_controller.genre_list);

// BOOKINSTANCE ROUTES

// GET request for creating a BookInstance. NOTE This must come before routes below that use :id
router.get('/bookinstance/create', book_instance_controller.bookinstance_create_get);

// POST request for creating BookInstance.
router.post('/bookinstance/create', book_instance_controller.bookinstance_create_post);

// GET request to delete BookInstance.
router.get('/bookinstance/:id/delete', book_instance_controller.bookinstance_delete_get);

// POST request to delete BookInstance.
router.post('/bookinstance/:id/delete', book_instance_controller.bookinstance_delete_post);

// GET request to update BookInstance.
router.get('/bookinstance/:id/update', book_instance_controller.bookinstance_update_get);

// POST request to update BookInstance.
router.post('/bookinstance/:id/update', book_instance_controller.bookinstance_update_post);

// GET request for one BookInstance.
router.get('/bookinstance/:id', book_instance_controller.bookinstance_detail);

// GET request for list of all BookInstance.
router.get('/bookinstances', book_instance_controller.bookinstance_list);

module.exports = router;
