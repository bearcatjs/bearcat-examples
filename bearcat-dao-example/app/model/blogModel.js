var BlogModel = function() {
	this.$mid = "blogModel";
	this.$table = "ba_blog";
	this.id = "$primary;type:Number";
	this.aid = "$type:Number";
	this.title = "$type:String";
	this.content = "$type:String";
	this.create_at = "$type:Number";
	this.update_at = "$type:Number";
}

module.exports = BlogModel;