var CommentModel = function() {
	this.$mid = "commentModel";
	this.$table = "ba_comment";
	this.$prefix = "comment_";
	this.id = "$primary;type:Number";
	this.aid = "$type:Number";
	this.bid = "$type:Number";
	this.content = "$type:String";
	this.create_at = "$type:Number";
	this.update_at = "$type:Number";
}

module.exports = CommentModel;