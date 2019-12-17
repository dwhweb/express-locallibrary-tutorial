var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var moment = require("moment");

var AuthorSchema = new Schema(
	{
		first_name: {type: String, required: true, max: 100},
		family_name: {type: String, required: true, max: 100},
		date_of_birth: {type: Date},
		date_of_death: {type: Date}
	}
);

// Virtual property for authors full name
AuthorSchema.virtual("name").get(function() {
	return `${this.family_name}, ${this.first_name}`;
});

// Virtual property for authors lifespan
AuthorSchema.virtual("lifespan").get(function() {
	return `${this.date_of_birth ? moment(this.date_of_birth).format("MMMM Do, YYYY") : ""} - ${this.date_of_death ? moment(this.date_of_death).format("MMMM Do, YYYY") : ""}`;
});

// Virtual property for authors DOB formatted for date control
AuthorSchema.virtual("dob_datecontrol").get(function() {    
          return moment(this.date_of_birth).format("YYYY-MM-DD");    
});

// Virtual property for authors DOD formatted for date control
AuthorSchema.virtual("dod_datecontrol").get(function() {    
          return moment(this.date_of_death).format("YYYY-MM-DD");    
});

// Virtual property for authors URL
AuthorSchema.virtual("url").get(function() {
	return `/catalog/author/${this._id}`;
});

// Export the model
module.exports = mongoose.model("Author", AuthorSchema);
