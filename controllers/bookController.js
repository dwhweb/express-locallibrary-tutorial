var Book = require("../models/book");
var Author = require("../models/author");
var Genre = require("../models/genre");
var BookInstance = require("../models/bookinstance");
var async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");


// Site welcome page
exports.index = (req, res) => {
	async.parallel({
		book_count: function(callback) {
			Book.countDocuments({}, callback);
		},

		book_instance_count: function(callback) {
			BookInstance.countDocuments({}, callback);
		},

		book_instance_available_count: function(callback) {
			BookInstance.countDocuments({status: "Available"}, callback);
		},

		author_count: function(callback) {
			Author.countDocuments({}, callback);
		},

		genre_count: function(callback) {
			Genre.countDocuments({}, callback);
		}

	}, function(err, results) {
		res.render("index", {title: "Local library home", error: err, data: results});
	});
};

// Display a list of all Books
exports.book_list = (req, res, next) => {
	Book.find({}, "title author")
		.populate("author")
		.exec((err, list_books) => {
			if(err) {
				return next(err);
			}

			res.render("book_list", {title: "Book list", book_list: list_books});
		});
}

// Display detail page for a specific book
exports.book_detail = function(req, res, next) {
	async.parallel({
		book: function(callback) {
			Book.findById(req.params.id)
				.populate("author")
				.populate("genre")
			.exec(callback)
		},

		book_instance: function(callback) {
			BookInstance.find({"book" : req.params.id})
			.exec(callback);
		}
	}, function(err, results) {
		if(err) {
			return next(err);
		}

		if(results.book === null) {
			var err = new Error("Book not found");
			err.status = 404;
			return next(err);
		}

		res.render("book_detail", {title: results.book.title, book: results.book, book_instances: results.book_instance});
	});
}

// Display book create form on GET
exports.book_create_get = (req, res, next) => {
	// Get all authors and genres which can be used when adding a book
	async.parallel({
		authors: function(callback) {
			Author.find(callback);
		},

		genres: function(callback) {
			Genre.find(callback);
		}
	}, function(err, results) {
		if(err) {
			return next(err);
		}

		res.render("book_form", {title: "Create book", authors: results.authors, genres: results.genres});
	});
}

// Handle book create on POST
exports.book_create_post = [
	// Convert the genre to an array
	(req, res, next) => {
		if(!(req.body.genre instanceof Array)) {
			if(typeof req.body.genre === "undefined") {
				req.body.genre = [];
			} else {
				req.body.genre = new Array(req.body.genre);
			}
		}

		next();
	},

	// Validate fields
	body("title", "Title must not be empty").isLength({min: 1}).trim(),
	body("author", "Author must not be empty").isLength({min: 1}).trim(),
	body("summary", "Summary must not be empty").isLength({min: 1}).trim(),
	body("isbn", "ISBN must not be empty").isLength({min: 1}).trim(),

	// Sanitize fields using wildcard
	sanitizeBody("*").escape(),

	// Process request after validation and sanitization
	(req, res, next) => {
		// Extract the validation errors from the request
		const errors = validationResult(req);

		// Create a book object with the escaped and trimmed data
		var book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: req.body.genre
		});

		if(errors.isEmpty()) {
			// No errors, save the book
			book.save(function(err) {
				if(err) {
					return next(err);
				}

				res.redirect(book.url);
			});
		} else {
			// Errors, rerender the form with santized values and error messages
			// Get all authors and genres for form
			async.parallel({
				authors: function(callback) {
					Author.find(callback);
				},

				genres: function(callback) {
					Genre.find(callback);
				},
			}, function(err, results) {
				if(err) {
					return next(err);
				}

				// Mark our selected genres as checked
				for(let i = 0; i < results.genres.length; i++) {
					if(book.genre.indexOf(results.genres[i]._id) > -1) {
						results.genres[i].checked = "true";
					}
				}

				res.render("book_form", {title: "Create book", authors: results.authors, genres: results.genres,
					book: book, errors: errors.array()});
			});
		}
	}
];

// Display book delete form on GET
exports.book_delete_get = (req, res) => {
	async.parallel({    
                  book: function(callback) {    
                          Book.findById(req.params.id)    
                                  .populate("author")     
                                  .populate("genre")      
                          .exec(callback)                 
                  },                                      
                                                          
                  book_instance: function(callback) {     
                          BookInstance.find({"book" : req.params.id})    
                          .exec(callback);    
                  }    
          }, function(err, results) {    
                  if(err) {    
                          return next(err);    
                  }    
                       
                  if(results.book === null) {    
                          var err = new Error("Book not found");    
                          err.status = 404;    
                          return next(err);    
                  }    
                       
                  res.render("book_delete", {title: results.book.title, book: results.book, book_instances: results.book_instance});    
          });    
}

// Handle book delete on POST
exports.book_delete_post = (req, res, next) => {
	async.parallel({                                      
		book: function(callback) {                  
			Book.findById(req.params.id)        
				.populate("author")         
				.populate("genre")          
				.exec(callback)                     
		},                                          

		book_instance: function(callback) {         
			BookInstance.find({"book" : req.params.id})    
				.exec(callback);           
		}                                  
	}, function(err, results) {                
		if(err) {                          
			return next(err);          
		}                                  

		if(results.book === null) {        
			var err = new Error("Book not found");    
			err.status = 404;    
			return next(err);    
		}        

		// If there are still associated book instances re-render the template and prompt the user
		if(results.book_instance.length) {
			res.render("book_delete", {title: results.book.title, book: results.book, book_instances: results.book_instance});    
		} else {
			// There are no associated instances, delete
			Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) { 
                                  if(err) {                                                                                                         
                                          return next(err);                                        
                                  }                                                                
                                                                                                   
                                  // Successful, so redirect to books list                       
                                  res.redirect("/catalog/books");                                
                          }); 
		} 
	}); 
}

// Display book update form on GET
exports.book_update_get = function(req, res, next) {
	// Get book, authors and genres for form
	async.parallel({
		book: function(callback) {
			Book.findById(req.params.id).populate("author").populate("genre").exec(callback);
		},
		authors: function(callback) {
			Author.find(callback);
		},
		genres: function(callback) {
			Genre.find(callback);
		}
	}, function(err, results) {
		if(err) {
			return next(err);
		}

		if(results.book === null) {
			var err = new Error("Book not found");
			err.status = 404;
			return next(err);
		}

		// Mark our selected genres as checked
		for(var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
			for(var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
				if(results.genres[all_g_iter]._id.toString() === results.book.genre[book_g_iter]._id.toString()) {
					results.genres[all_g_iter].checked = "true";
				}
			}
		}

		res.render("book_form", {title: "Update book", authors: results.authors, genres: results.genres, book: results.book});
	});
}

// Handle book update on POST
exports.book_update_post = [
	// Convert the genre to an array
	(req, res, next) => {
		if(!(req.body.genre instanceof Array)) {
			if(typeof req.body.genre === "undefined") {
				req.body.genre = [];
			} else {
				req.body.genre = new Array(req.body.genre);
			}
		}

		next();
	},

	// Validate fields
	body("title", "Title must not be empty.").isLength({min : 1}).trim(),
	body("author", "Author must not be empty.").isLength({min : 1}).trim(),
	body("summary", "Summary must not be empty.").isLength({min : 1}).trim(),
	body("isbn", "ISBN must not be empty.").isLength({min : 1}).trim(),

	// Sanitize fields
	sanitizeBody("title").escape(),
	sanitizeBody("author").escape(),
	sanitizeBody("summary").escape(),
	sanitizeBody("isbn").escape(),
	sanitizeBody("genre.*").escape(),

	// Process request after validation and sanitization
	(req, res, next) => {
		// Extract the validation errors from a request
		const errors = validationResult(req);

		// Create a Book object with escaped/trimmed data and old id
		var book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: (typeof req.body.genre === "undefined") ? [] : req.body.genre,
			_id : req.params.id // Required, or a new id will be assigned!
		});

		if(errors.isEmpty()) {
			// Data from form is valid - update the record
			Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook) {
				if(err) {
					return next(err);
				}

				// Success - redirect to book detail page
				res.redirect(thebook.url);
			});
		} else {
			// Errors, re-render form with sanitized values/error messages

			// Get all authors and genres for a form
			async.parallel({
				authors: function(callback) {
					Author.find(callback);
				},
				genres: function(callback) {
					Genre.find(callback);
				},
			}, function(err, results) {
				if(err) {
					return next(err);
				}

				// Mark our selected genres as checked
				for(let i = 0; i < results.genres.length; i++) {
					if(book.genre.indexOf(results.genres[i]._id) > -1) {
						results.genres[i].checked = "true";
					}
				}

				res.render("book_form", {title: "Update book", authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
			});

			return;
		}
	}
];
