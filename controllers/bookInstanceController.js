var BookInstance = require("../models/bookinstance.js");
var Book = require("../models/book");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
var async = require("async");

// Display a list of all BookInstances
exports.bookinstance_list = function(req, res) {
	BookInstance.find()
		.populate("book")
		.exec((err, list_bookinstances) => {
			if(err) {
				return next(err);
			}

			res.render("bookinstance_list", {title: "Book instance list", bookinstance_list: list_bookinstances});
		});
}

// Display detail page for a specific bookinstance
exports.bookinstance_detail = (req, res, next) => {
	BookInstance.findById(req.params.id)
		.populate("book")
		.exec(function(err, bookinstance) {
			if(err) {
				return next(err);
			}

			if(bookinstance === null) {
				var err = new Error("Book instance not found");
				err.status = 404;
				return next(err);
			}

			res.render("bookinstance_detail", {title: `Copy: ${bookinstance.book.title}`, bookinstance: bookinstance});
		});
}

// Display bookinstance create form on GET
exports.bookinstance_create_get = function(req, res, next) {
	Book.find({}, "title")
		.exec(function(err, books) {
			if(err) {
				return next(err);
			}

			// Find successful, so render
			res.render("bookinstance_form", {title : "Create BookInstance", book_list: books});
		});
}

// Handle bookinstance create on POST
exports.bookinstance_create_post = [
	// Validate fields
	body("book", "Book must be specified").isLength({min: 1}).trim(),
	body("imprint", "Imprint must be specified").isLength({min: 1}).trim(),
	body("due_back", "Invalid date").optional({checkFalsy : true}).isISO8601(),

	// Sanitize fields
	sanitizeBody("book").escape(),
	sanitizeBody("imprint").escape(),
	sanitizeBody("status").trim().escape(),
	sanitizeBody("due_back").toDate(),

	// Process request after validation and santization
	(req, res, next) => {
		// Extract the validation errors from the request
		const errors = validationResult(req);

		// Create a BookInstance with the escaped and trimmed data
		var bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back
		});

		// There are no errors
		if(errors.isEmpty()) {
			bookinstance.save(function(err) {
				if(err) {
					return next(err);
				}

				// Redirect to new record
				res.redirect(bookinstance.url);
			});
		} else {
			// There are errors, render form again with sanitized values and error messages
			Book.find({}, "title")
				.exec(function(err, books) {
					if(err) {
						return next(err);
					}

					// Re-render the form
					res.render("bookinstance_form", {title: "Create BookInstance", book_list : books, selected_book : bookinstance.book._id, errors: errors.array(),
						bookinstance : bookinstance});
				});
			return;
		}
	}
];

// Display bookinstance delete form on GET
exports.bookinstance_delete_get = (req, res) => {
	BookInstance.findById(req.params.id)    
                  .populate("book")    
                  .exec(function(err, bookinstance) {    
                          if(err) {    
                                  return next(err);    
                          }    
                              
                          if(bookinstance === null) {    
                                  var err = new Error("Book instance not found");    
                                  err.status = 404;    
                                  return next(err);    
                          }    
                              
                          res.render("bookinstance_delete", {title: `Copy: ${bookinstance.book.title}`, bookinstance: bookinstance});    
                  });    
}

// Handle bookinstance delete on POST
exports.bookinstance_delete_post = (req, res, next) => {
	BookInstance.findByIdAndRemove(req.body.bookinstance, function deleteBookInstance(err) {
		if(err) {
			return next(err);
		}

		// Successful, so redirect to book instance list
		res.redirect("/catalog/bookinstances");
	});
}

// Display bookinstance update form on GET
exports.bookinstance_update_get = (req, res, next) => {
	async.parallel({
		bookinstance: function(callback) {
			BookInstance.findById(req.params.id).populate("book").exec(callback);
		},

		book_list: function(callback) {
			Book.find({}, "title").exec(callback);
		}
	}, function(err, results) {
		if(err) {
			return next(err);
		}

		if(results.bookinstance === null) {
			var err = new Error("Book not found");    
			err.status = 404;    
			return next(err); 
		}

		res.render("bookinstance_form", {title: `Update instance ${results.bookinstance._id}`, bookinstance: results.bookinstance, book_list: results.book_list, book: results.bookinstance.book});    
	});
}

// Handle bookinstance update on POST
exports.bookinstance_update_post = [
	// Validate fields
	body("book", "Book must be specified").isLength({min: 1}).trim(),
	body("imprint", "Imprint must be specified").isLength({min: 1}).trim(),
	body("due_back", "Invalid date").optional({checkFalsy : true}).isISO8601(),

	// Sanitize fields
	sanitizeBody("book").escape(),
	sanitizeBody("imprint").escape(),
	sanitizeBody("status").trim().escape(),
	sanitizeBody("due_back").toDate(),

	// Process request after validation and santization
	(req, res, next) => {
		// Extract the validation errors from the request
		const errors = validationResult(req);

		// Create a BookInstance with the escaped and trimmed data
		var bookinstance = new BookInstance({
			// _id required or a new id will be assigned!
			_id: req.params.id,
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back
		});

		// There are no errors
		if(errors.isEmpty()) {
			BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance) {
				if(err) {
					return next(err);
				}

				// Redirect to new record
				res.redirect(thebookinstance.url);
			});
		} else {
			// There are errors, render form again with sanitized values and error messages
			Book.find({}, "title")
				.exec(function(err, books) {
					if(err) {
						return next(err);
					}

					// Re-render the form
					res.render("bookinstance_form", {title: "Update BookInstance", book_list : books, selected_book : bookinstance.book._id, errors: errors.array(),
						bookinstance : bookinstance});
				});
			return;
		}
	}

]
