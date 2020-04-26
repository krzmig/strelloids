function doLocalize()
{
	var nodes = document.querySelectorAll('[data-localize]');

	for( var i = nodes.length - 1; i >= 0; --i )
		localizeNodeContent( nodes[i] );

	nodes = document.querySelectorAll('[title]');

	for( i = nodes.length - 1; i >= 0; --i )
		localizeNodeTitle( nodes[i] );
}

function localizeNodeContent( node )
{
	var context = node.getAttribute('data-context');
	var text = node.innerText.toString().replace( /^\s+/g, '' ). replace( /\s+$/g, '' );
	if( context )
		text = context.toString() + '|' + text;

	var translation = chrome.i18n.getMessage( text );
	if( !translation )
		translation = '!!! MISSING TRANSLATION (' + text + ') !!!'
	node.innerText = translation;
}

function localizeNodeTitle( node )
{
	var translation = chrome.i18n.getMessage( node.title );
	if( !translation )
		translation = '!!! MISSING TRANSLATION (' + node.title + ') !!!'

	node.title = translation;
}

doLocalize();