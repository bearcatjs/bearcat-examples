var bearcatDao = require('bearcat-dao');
var bearcat = require('bearcat');
var path = require('path');
var contextPath = require.resolve('./context.json'); // to run simple example

process.env.BEARCAT_DEBUG = true;

var sqlPath = require.resolve('./app/sql/relation.sql');
var sqlDirPath = path.dirname(sqlPath);

bearcatDao.loadSQL([sqlDirPath]);

bearcat.createApp([contextPath]);
bearcat.start(function() {
	var blogModel = bearcat.getModel('blogModel');
	var authorModel = bearcat.getModel('authorModel');
	var commentModel = bearcat.getModel('commentModel');

	var blogDao = bearcat.getBean('blogDao');
	var authorDao = bearcat.getBean('authorDao');
	var commentDao = bearcat.getBean('commentDao');
	var relationDao = bearcat.getBean('relationDao');

	var now = Date.now();

	authorModel.$pack({
		name: "author",
		create_at: now,
		update_at: now
	});

	authorDao.add(authorModel, function(err, objects) {
		if (err) {
			console.error(err);
		}

		var author = objects[0];
		var aid = author.$get('id');

		now = Date.now();
		blogModel.$pack({
			aid: aid,
			title: "blog_title",
			content: "blog_content",
			create_at: now,
			update_at: now
		})

		blogDao.add(blogModel, function(err, objects) {
			blogDao.getAll(function(err, results) {
				console.log("getBlogAll %j", results);

				var blogId = results[0].$get('id');
				now = Date.now();

				commentModel.$pack({
					aid: aid,
					bid: blogId,
					content: "blog_comment_content",
					create_at: now,
					update_at: now
				});

				commentDao.add(commentModel, function(err, objects) {
					commentDao.add(commentModel, function(err, objects) {
						relationDao.getBlogAuthorList(blogId, function(err, results) {
							console.log("getBlogAuthorList %j", results);

							relationDao.getBlogCommentsList(blogId, function(err, results) {
								console.log('comments length %d', results.$get('comments').length);
								console.log("getBlogCommentsList %j", results);
							});
						});
					});
				});
			});
		});
	});
});