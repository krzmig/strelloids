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

	node.innerText = context ?
		_( text, context.toString() ) :
		_( text );
}

function localizeNodeTitle( node )
{
	node.title = _( node.title );
}

function _( msg, context )
{
	if( context !== undefined )
		msg = context + '|' + msg;

	var translation = getBrowserObject().i18n.getMessage( msg );
	if( !translation )
		translation = '!!! MISSING TRANSLATION (' + msg + ') !!!'

	return translation;
}

doLocalize();