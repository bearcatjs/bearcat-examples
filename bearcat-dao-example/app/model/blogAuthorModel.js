/**
 * BlogAuthorModel example for one-to-one relation.
 */

var BlogAuthorModel = function() {
	this.$mid = "blogAuthorModel";
	this.blog = "$type:Object;prefix:blog_;ref:blogModel";
	this.author = "$type:Object;prefix:author_;ref:authorModel";
}

module.exports = BlogAuthorModel;