var Author = require("../models/author.js");
var Book = require("../models/book");
var async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

// Display a list of all authors
exports.author_list = function(req, res, next) {
	Author.find()
		.sort([["family_name", "ascending"]])
		.exec(function(err, list_authors) {
			if(err) {
				return next(err);
			}

			res.render("author_list", {title: "Author list", author_list: list_authors});
		});
}

// Display detail page for a specific author
exports.author_detail = (req, res, next) => {
	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id)
			.exec(callback);
		},

		authors_books: function(callback) {
			Book.find({"author": req.params.id}, "title summary")
				.exec(callback);
		}
	}, function(err, results) {
		if(err) {
			return next(err);
		}

		if(results.author === null) {
			var err = new Error("Author not found");
			err.status = 404;
			return next(err);
		}

		res.render("author_detail", {title: "Author detail", author:results.author, author_books: results.authors_books});
	});
}

// Display author create form on GET
exports.author_create_get = (req, res, next) => {
	res.render("author_form", {title: "Create author"});
}

// Handle author create on POST
exports.author_create_post = [
	// Validate fields
	body("first_name").isLength({min: 1}).trim().withMessage("First name must be specified.").isAlphanumeric()
		.withMessage("First name has non alphanumeric characters."),
	body("family_name").isLength({min: 1}).trim().withMessage("Family name must be specified.").isAlphanumeric()
		.withMessage("Family name has non alphanumeric characters."),
	body("date_of_birth", "Invalid date of birth").optional({checkFalsy: true}).isISO8601(),
	body("date_of_death", "Invalid date of death").optional({checkFalsy: true}).isISO8601(),

	// Sanitise fields
	sanitizeBody("first_name").escape(),
	sanitizeBody("family_name").escape(),
	sanitizeBody("date_of_birth").toDate(),
	sanitizeBody("date_of_death").toDate(),

	// Process request after validation and sanitization
	(req, res, next) => {
		// Extract any validation errors from the request
		const errors = validationResult(req);

		if(errors.isEmpty()) {
			// Data from the form fields is valid
			// Create an author object with escaped and trimmed data
			var author = new Author({
				first_name: req.body.first_name,
				family_name: req.body.family_name,
				date_of_birth: req.body.date_of_birth,
				date_of_death: req.body.date_of_death
			});

			author.save(function(err) {
				if(err) {
					return next(err);
				}

				res.redirect(author.url);
			});
		} else {
			// There are errors. Rerender the form with sanitised values/error messages
			res.render("author_form", {title: "Create author", author: req.body, errors: errors.array()});
			return;
		}
	}
];

// Display author delete form on GET
exports.author_delete_get = function(req, res, next) {
	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id).exec(callback);
		},
		authors_books: function(callback) {
			Book.find({"author" : req.params.id}).exec(callback);
		},
	
	}, function(err, results) {
		if(err) {
			return next(err);
		}

		if(results.author === null) {
			res.redirect("/catalog/authors");
		}

		// Successful, so render
		res.render("author_delete", {title: "Delete author", author : results.author, author_books : results.authors_books});
	});
}

// Handle author delete on POST
exports.author_delete_post = function(req, res, next) {
	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id).exec(callback);
		},
		authors_books: function(callback) {
			Book.find({"author" : req.params.id}).exec(callback);
		},
	
	}, function(err, results) {
		if(err) {
			return next(err);
		}


		// Author has books, render in the same way as the GET route
		if(results.authors_books.length > 0) {
			res.render("author_delete", {title : "Delete author", author : results.author, author_books : results.authors_books});
			return;
		} else {
			// Author has no books, delete object and redirect to the list of authors
			Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
				if(err) {
					return next(err);
				}

				// Successful, so redirect to authors list
				res.redirect("/catalog/authors");
			});

		}
	});
}

// Display author update form on GET
exports.author_update_get = (req, res, next) => {
	Author.findById(req.params.id, function(err, author) {
		if(err) {
			return next(err);
		}

		// If there are no results
		if(author === null) {
			var err = new Error("Author not found");
			err.status = 404;
			return next(err);
		}

		// Success, render update form
		res.render("author_form", {title: `Update author ${req.params.id}`, author:author});
	});	
}

// Handle author update on POST
exports.author_update_post = [
	// Validate fields
	body("first_name").isLength({min: 1}).trim().withMessage("First name must be specified.").isAlphanumeric()
		.withMessage("First name has non alphanumeric characters."),
	body("family_name").isLength({min: 1}).trim().withMessage("Family name must be specified.").isAlphanumeric()
		.withMessage("Family name has non alphanumeric characters."),
	body("date_of_birth", "Invalid date of birth").optional({checkFalsy: true}).isISO8601(),
	body("date_of_death", "Invalid date of death").optional({checkFalsy: true}).isISO8601(),

	// Sanitise fields
	sanitizeBody("first_name").escape(),
	sanitizeBody("family_name").escape(),
	sanitizeBody("date_of_birth").toDate(),
	sanitizeBody("date_of_death").toDate(),

	// Process request after validation and sanitization
	(req, res, next) => {
		// Extract any validation errors from the request
		const errors = validationResult(req);

		if(errors.isEmpty()) {
			// Data from the form fields is valid
			// Create an author object with escaped and trimmed data
			var author = new Author({
				// _id required or new record is created!
				_id: req.params.id,
				first_name: req.body.first_name,
				family_name: req.body.family_name,
				date_of_birth: req.body.date_of_birth,
				date_of_death: req.body.date_of_death
			});

			Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor) {
				if(err) {
					return next(err);
				}

				// Success, redirect to updated author
				res.redirect(theauthor.url);
			});
		} else {
			// There are errors. Rerender the form with sanitised values/error messages
			res.render("author_form", {title: "Create author", author: req.body, errors: errors.array()});
			return;
		}
	}
]
