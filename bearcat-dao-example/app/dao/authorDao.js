var AuthorDao = function() {
	this.$id = "authorDao";
	this.$init = "init";
	this.$domainDaoSupport = null;
}

AuthorDao.prototype.init = function() {
	// initConfig with authorModel defined in ../model/authorModel.js
	this.$domainDaoSupport.initConfig("authorModel");
}

AuthorDao.prototype.transaction = function(txStatus) {
	this.$domainDaoSupport.transaction(txStatus);
	return this;
}

AuthorDao.prototype.add = function(obj, cb) {
	this.$domainDaoSupport.add(obj, cb);
}

module.exports = AuthorDao;