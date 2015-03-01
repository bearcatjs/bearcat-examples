var CommentDao = function() {
	this.$id = "commentDao";
	this.$init = "init";
	this.$domainDaoSupport = null;
}

CommentDao.prototype.init = function() {
	// initConfig with commentModel defined in ../model/commentModel.js
	this.$domainDaoSupport.initConfig("commentModel");
}

CommentDao.prototype.transaction = function(txStatus) {
	this.$domainDaoSupport.transaction(txStatus);
	return this;
}

CommentDao.prototype.add = function(obj, cb) {
	this.$domainDaoSupport.add(obj, cb);
}

module.exports = CommentDao;