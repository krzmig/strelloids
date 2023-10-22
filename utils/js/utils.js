/**
 * Create HTML node
 * @param {string} node_type
 * @param {object} [node_params]
 * @param {string|HTMLElement|HTMLElement[]} [children]
 * @param {{}} [data]
 * @returns {HTMLElement}
 */
function createNode( node_type, node_params = {}, children = [], data = {} )
{
	let node = $d.createElement( node_type );
	for( let i in node_params )
		if( node_params.hasOwnProperty( i ))
		{
			if([ 'id','name','type','value','min','max','src' ].indexOf( i ) >= 0 )
				node[i] = node_params[i];
			else if( i === 'class' && typeof node_params[i] === 'string' )
				node.className = node_params[i];
			else if( i === 'class' && typeof node_params[i] === 'object' )
			{
				for( let j in node_params[i] )
					if( node_params[i].hasOwnProperty( j ))
						node.classList.add( node_params[i][j] );
			}
			else
				node.setAttribute( i, node_params[i] );
		}
	if( children instanceof HTMLElement )
		node.appendChild( children );
	else if( Array.isArray( children ))
	{
		for( let i = 0; i < children.length; ++i )
			node.appendChild( children[i] );
	}
	else if( typeof children === 'string' || !isNaN( children ))
		node.insertAdjacentHTML( 'beforeend', children );

	for( let i in data )
		if( data.hasOwnProperty( i ))
			node.dataset[i] = data[i];

	return node;
}

/**
 * @param variable
 * @return {boolean}
 */
function isstr( variable )
{
	return typeof variable === 'string';
}

/**
 * @param variable
 * @return {boolean}
 */
function isobj( variable )
{
	return typeof variable === 'object';
}

/**
 * @param variable
 * @return {boolean}
 */
function isfunc( variable )
{
	return typeof variable === 'function';
}

/**
 * @param {HTMLElement} element
 * @return {null|HTMLElement}
 */
function findTextNode( element )
{
	for( let i = 0; i < element.childNodes.length; ++i )
		if( element.childNodes[i].nodeType === Node.TEXT_NODE )
			return element.childNodes[i];

	return null;
}

/**
 * @param {Object} obj_params
 * @param {string} obj_params.url
 * @param {string} [obj_params.method]
 * @param {Object} [obj_params.data]
 * @param {function} [obj_params.onError]
 * @param {function} [obj_params.onLoad]
 * @param {function} [obj_params.onProgress]
 * @param {function} [obj_params.onDone]
 * @param {boolean} [obj_params.async]
 * @param {Array} [obj_params.headers]
 * @param {string} [obj_params.contentType]
 * @param {boolean} [obj_params.disableCache]
 */
function Ajax( obj_params )
{
	let i;
	const default_params = {
		method: 'GET',
		async: true,
		disableCache: false,
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		data: {}
	};

	for( i in default_params )
		if( typeof obj_params[i] === 'undefined' )
			obj_params[i] = default_params[i];

	if( typeof obj_params.url === 'undefined' )
		return $err('No url given');

	const http_request = new XMLHttpRequest();
	if( !http_request )
		return alert( 'Your browser don\'t support ajax request, please upgrade your browser or choose another.' );

	http_request.overrideMimeType('text/plain');

	let ret = [];
	for( i in obj_params.data )
	{
		if( !obj_params.data.hasOwnProperty( i ))
			continue;
		if( isobj( obj_params.data[i] ))
			obj_params.data[i] = JSON.stringify( obj_params.data[i] );
		ret.push( encodeURIComponent( i ) + "=" + encodeURIComponent( obj_params.data[i] ));
	}

	http_request.open(
		obj_params.method.toUpperCase(),
		obj_params.url+( ret.length ? '?'+ret.join("&") : '' ),
		obj_params.async
	);

	if( obj_params.disableCache )
		http_request.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
	if( obj_params.contentType )
		http_request.setRequestHeader( 'Content-type', obj_params.contentType );
	if( obj_params.responseType )
		http_request.responseType = obj_params.responseType;

	if( isfunc( obj_params.onProgress ))
		http_request.onprogress = obj_params.onProgress;
	if( isfunc( obj_params.onError ))
		http_request.onerror = obj_params.onError;
	if( isfunc( obj_params.onDone ))
		http_request.onloadend = function()
		{
			if( http_request.readyState === 4)
			{
				if( http_request.status === 0 || ( http_request.status >= 200 && http_request.status < 400 ))
					obj_params.onDone(
						!obj_params.responseType || obj_params.responseType === 'document' ? http_request.responseText : http_request.response );
				else if( isfunc( obj_params.onError ))
					obj_params.onError( http_request );
			}
		};
	if( isfunc( obj_params.onLoad ))
		http_request.onloadstart = obj_params.onLoad;

	http_request.send();
}

/**
 * Return `browser` object, depending on current browser
 * @return {object}
 */
function getBrowserObject()
{
	if( typeof browser !== 'undefined' )
		return browser;
	else if( typeof chrome !== 'undefined' )
		return chrome;
	else if( typeof msBrowser !== 'undefined' )
		return msBrowser;
}

var $w = window,
	$d = document,
	$b = $d.body,
	$_ = $d.getElementById.bind( $d ),
	$ = $d.querySelector.bind( $d ),
	$$ = $d.querySelectorAll.bind( $d ),
	$log = console.log,
	$wrn = console.warn,
	$err = console.error,
	$dbg = console.debug,
	$trc = console.trace;