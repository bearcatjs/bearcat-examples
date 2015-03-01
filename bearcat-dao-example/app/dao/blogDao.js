var BlogDao = function() {
	this.$id = "blogDao";
	this.$init = "init";
	this.$domainDaoSupport = null;
}

BlogDao.prototype.init = function() {
	// initConfig with blogModel defined in ../model/blogModel.js
	this.$domainDaoSupport.initConfig("blogModel");
}

BlogDao.prototype.transaction = function(txStatus) {
	this.$domainDaoSupport.transaction(txStatus);
	return this;
}

BlogDao.prototype.add = function(obj, cb) {
	this.$domainDaoSupport.add(obj, cb);
}

BlogDao.prototype.getAll = function(cb) {
	var sql = " 1 = 1";
	this.$domainDaoSupport.getListByWhere(sql, null, cb);
}

module.exports = BlogDao;