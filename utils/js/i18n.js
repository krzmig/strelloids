/**
 * @constructor
 */
function Translation()
{
	const self = this;
	const available_locales = [
		"en",
		"pl"
	];

	let extension_locale;

	const locale_domains = [
		"content",
		"popup",
		"options"
	];

	let default_domain = "messages";

	const translations = {};

	let files_to_load = 0;

	function init()
	{
		determinateExtensionsLocale();
		loadTranslations();
	}

	function determinateExtensionsLocale()
	{
		const browser_locale = getBrowserObject().i18n.getUILanguage().replace( '-', '_' );

		if( available_locales.indexOf( browser_locale ) >= 0 )
			extension_locale = browser_locale;
		else if( available_locales.indexOf( browser_locale.substring( 0, 2 ) ) >= 0 )
			extension_locale = browser_locale.substring( 0, 2 );
		else
			extension_locale = getBrowserObject().runtime.getManifest().default_locale;
	}

	function loadTranslations()
	{
		for( let i = locale_domains.length - 1; i >= 0; --i )
		{
			++files_to_load;
			loadDomainFile( locale_domains[i] );
		}
	}

	function loadDomainFile( domain )
	{
		new Ajax({
			url: getBrowserObject().runtime.getURL( '_locales/' + extension_locale + '/' + domain + '.json' ),
			onDone: function( response )
			{
				translations[domain] = JSON.parse( response );
				--files_to_load;
			},
			onError: function()
			{
				$err( 'Error until load translation file: ', this.url );
			}
		});
	}

	this.setDomain = function( new_domain )
	{
		if( !new_domain )
			default_domain = 'messages';
		else
			default_domain = new_domain;

	};

	this.translate = function( message, context, domain )
	{
		if( !domain )
			domain = default_domain;

		if( domain === 'messages' )
			return getBrowserObject().i18n.getMessage( message );

		if( context )
			message = context + '|' + message;

		if( typeof translations[domain] !== 'undefined' && typeof translations[domain][message] !== 'undefined' )
			return translations[domain][message].message;
		else
			return '!!! MISSING TRANSLATION (' + message + ') !!!';
	};

	this.htmlTranslation = function()
	{
		if( files_to_load )
			return setTimeout( self.htmlTranslation, 200 );

		document.querySelectorAll('[data-localize]').forEach(( node ) => {
			localizeNodeContent( node );
		});

		document.querySelectorAll('[title]').forEach(( node ) => {
			localizeNodeTitle( node );
		});
	}

	function localizeNodeContent( node )
	{
		let context = node.getAttribute( 'data-context' );
		let domain = node.getAttribute( 'data-domain' );
		const text = node.innerText.toString().replace( /^\s+/g, '' ).replace( /\s+$/g, '' );

		if( context )
			context = context.toString();
		if( domain )
			domain = domain.toString();

		node.innerText = self.translate( text, context, domain );
	}

	function localizeNodeTitle( node )
	{
		let context = node.getAttribute( 'data-context' );
		let domain = node.getAttribute( 'data-domain' );

		if( context )
			context = context.toString();
		if( domain )
			domain = domain.toString();

		node.title = self.translate( node.title, context, domain );
	}

	init();
}

var lang = new Translation();

function _( msg, context, domain )
{
	return lang.translate( msg, context, domain );
}

