var Genre = require("../models/genre.js");
var Book = require("../models/book");
var async = require("async");
const validator = require("express-validator");

// Display a list of all Genres
exports.genre_list = (req, res) => {
	Genre.find()
		.sort([["name", "ascending"]])
		.exec(function(err, list_genres) {
			if(err) {
				return next(err);
			}

			res.render("genre_list", {title: "Genre list", genre_list: list_genres});

		});
}

// Display detail page for a specific genre
exports.genre_detail = (req, res, next) => {
	async.parallel({
		genre: function(callback) {
			Genre.findById(req.params.id).exec(callback);
		},

		genre_books: function(callback) {
			Book.find({"genre" : req.params.id}).exec(callback);
		}
	
	}, function(err, results) {
		if(err) {
			return next(err);
		}

		if(results.genre === null) {
			var err = new Error("Genre not found");
			err.status = 404;
			return next(err);
		}

		res.render("genre_detail", {title : "Genre detail", genre: results.genre, genre_books: results.genre_books});
	});
}

// Display genre create form on GET
exports.genre_create_get = (req, res) => {
	res.render("genre_form", {title: "Create genre"});
}

// Handle genre create on POST
exports.genre_create_post = [
	// Validate that the name field is not empty
	validator.body("name", "Genre name required").isLength({min: 1}).trim(),

	// Sanitise the name field
	validator.sanitizeBody("name").escape(),

	// Process request after validation and santization
	(req, res, next) => {
		// Extract any validation errors from the request
		const errors = validator.validationResult(req);

		// Create a genre object with escaped and trimmed data
		var genre = new Genre({
			name: req.body.name
		});

		if(!errors.isEmpty()) {
			// There are errors, re-render the form with error messages
			res.render("genre_form", {title: "Create genre", genre: genre, errors: errors.array()});
			return;
		} else {
			// Data is valid, check if the genre already exists
			Genre.findOne({name: req.body.name})
				.exec(function(err, found_genre) {
					if(err) {
						return next(err);
					}

					if(found_genre) {
						// Genre exists, redirect to its URL
						res.redirect(found_genre.url);
					} else {
						genre.save(function(err) {
							if(err) {
								return next(err);
							}

							res.redirect(genre.url);
						});
					}
				});
		}
	}
];

// Display genre delete form on GET
exports.genre_delete_get = (req, res, next) => {
	async.parallel({    
		genre: function(callback) {    
			Genre.findById(req.params.id)    
				.exec(callback);    
		},    

		genre_books: function(callback) {    
			Book.find({"genre" : req.params.id})    
				.exec(callback);    
		}    

	}, function(err, results) {    
		if(err) {    
			return next(err);    
		}    

		if(results.genre === null) {    
			var err = new Error("Genre not found");    
			err.status = 404;    
			return next(err);    
		}    

		res.render("genre_delete", {title : `Genre: ${results.genre}`, genre: results.genre, genre_books: results.genre_books});    
	});    
}

// Handle genre delete on POST
exports.genre_delete_post = (req, res, next) => {
	        async.parallel({                             
                  genre: function(callback) {          
                          Genre.findById(req.params.id)      
                                  .exec(callback);           
                  },                                         
                                                             
                  genre_books: function(callback) {          
                          Book.find({"genre" : req.params.id})      
                                  .exec(callback);      
                  }                                     
                                                        
          }, function(err, results) {                   
                  if(err) {                             
                          return next(err);             
                  }                                     
                                                        
                  if(results.genre === null) {          
                          var err = new Error("Genre not found");      
                          err.status = 404;      
                          return next(err);      
                  }         

		  // If there are associated books, re-render the template and inform the user
		  if(results.genre_books.length) {
			  res.render("genre_delete", {title : `Genre: ${results.genre}`, genre: results.genre, genre_books: results.genre_books});      
		  } else {
			  // There are no associated books, delete the genre
			  Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) { 
				  if(err) {                                                                                                         
					  return next(err);                                        
				  }                                                                

				  // Successful, so redirect to genres list                       
				  res.redirect("/catalog/genres");                                
			  });                                                                      
		  }
          });  
}

// Display genre update form on GET
exports.genre_update_get = (req, res, next) => {
	Genre.findById(req.params.id, function(err, genre) {
		if(err) {
			return next(err);
		}

		// No results
		if(genre === null) {
			var err = new Error("Genre not found");
			err.status = 404;
			return next(err);
		}

		// Successful, render genre form
		res.render("genre_form", {title: `Update genre ${req.params.id}`, genre: genre});
	});
}

// Handle genre update on POST
exports.genre_update_post = [
	// Validate that the name field is not empty
	validator.body("name", "Genre name required").isLength({min: 1}).trim(),

	// Sanitise the name field
	validator.sanitizeBody("name").escape(),

	// Process request after validation and santization
	(req, res, next) => {
		// Extract any validation errors from the request
		const errors = validator.validationResult(req);

		// Create a genre object with escaped and trimmed data
		var genre = new Genre({
			// Required to update the genre
			_id: req.params.id,
			name: req.body.name
		});

		if(!errors.isEmpty()) {
			// There are errors, re-render the form with error messages
			res.render("genre_form", {title: `Update genre ${req.params.id}`, genre: genre, errors: errors.array()});
			return;
		} else {
			// Data is valid, update the genre
			Genre.findByIdAndUpdate(req.params.id, genre, function(err, thegenre) {
				if(err) {
					return next(err);
				}

				// Can't find the genre, return error
				if(thegenre === null) {
					var err = new Error("Genre not found");
					err.status = 404;
					return next(err);
				}

				// Success, redirect to updated genre
				res.redirect(thegenre.url);
			});
		}
	}
]
