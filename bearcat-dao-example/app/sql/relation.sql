sql blogAuthorResult
select 
	${blogField}
	${authorField}
from ba_blog as blog, ba_author as author
where blog.id = ? and blog.aid = author.id
end

sql blogCommentsResult
select
	${blogField}
	${commentField}
from ba_blog as blog, ba_comment as comment
where blog.id = ? and blog.id = comment.bid
end

sql blogField
	blog.id blog_id,
	blog.aid blog_aid,
	blog.title blog_title,
	blog.content blog_content,
	blog.create_at blog_create_at,
	blog.update_at blog_update_at,
end

sql authorField
	author.id author_id,
	author.name author_name,
	author.create_at author_create_at,
	author.update_at author_update_at
end

sql commentField
	comment.id comment_id,
	comment.content comment_content,
	comment.create_at comment_create_at,
	comment.update_at comment_update_at
end