var MarkDownController = function() {
	this.$id = "markDownController";
	this.$init = "init";
	this.$requireUtil = null;
	this.editor = null;
	this.rendered = null;
}

MarkDownController.prototype.init = function() {
	var md = this.$requireUtil.getInitMd();
	this.rendered = document.getElementsByClassName('rendered')[0];
	this.editor = this.initBrace(md);
	this.renderEdits(md);
	this.editor.on('change', this.renderEdits.bind(this));
	console.log('markdown editor init...');
}

MarkDownController.prototype.initBrace = function(md) {
	var ace = this.$requireUtil.brace;
	var editor = ace.edit('editor');
	editor.getSession().setMode('ace/mode/markdown');
	editor.setTheme('ace/theme/monokai');
	editor.setValue(md);
	editor.clearSelection();
	return editor;
}

MarkDownController.prototype.renderEdits = function(md) {
	var md = this.editor.getValue();
	var html = this.renderMd(md);
	this.rendered.innerHTML = html;
}

MarkDownController.prototype.renderMd = function(md) {
	return this.$requireUtil.marked(md);
}

bearcat.module(MarkDownController, typeof module !== 'undefined' ? module : {});