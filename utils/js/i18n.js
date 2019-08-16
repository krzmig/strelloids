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
	node.innerText = node.getAttribute('data-localize').toString().replace(
		/__MSG_(\w+)__/g,
		function( full_match, match )
		{
			return chrome.i18n.getMessage( match );
		}
	);
}

function localizeNodeTitle( node )
{
	node.title = node.title.replace(
		/__MSG_(\w+)__/g,
		function( full_match, match )
		{
			return chrome.i18n.getMessage( match );
		}
	);
}

doLocalize();