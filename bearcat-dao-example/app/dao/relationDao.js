var RelationDao = function() {
	this.$id = "relationDao";
	this.$init = "init";
	this.$domainDaoSupport = null;
}

RelationDao.prototype.init = function() {
	// initConfig with blogAuthorModel defined in ../model/blogAuthorModel.js
	this.$domainDaoSupport.initConfig("blogAuthorModel");
}

// one-to-one relation, results are model Array
RelationDao.prototype.getBlogAuthorList = function(blogId, cb) {
	this.$domainDaoSupport.getList("$blogAuthorResult", [blogId], cb);
}

// one-to-many relation, results are model Object
RelationDao.prototype.getBlogCommentsList = function(blogId, cb) {
	this.$domainDaoSupport.getList("$blogCommentsResult", [blogId], "blogCommentsModel", cb);
}

module.exports = RelationDao;