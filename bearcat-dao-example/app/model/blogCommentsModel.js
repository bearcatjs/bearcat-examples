var BlogCommentsModel = function() {
	this.$mid = "blogCommentsModel";
	this.blog = "$type:Object;prefix:blog_;ref:blogModel";
	this.comments = "$type:Array;prefix:comment_;ref:commentModel";
}

module.exports = BlogCommentsModel;