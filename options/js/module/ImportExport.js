function Export()
{
	var filters = {
		global: null,
		boards: null,
		lists: null
	};
	var default_settings;

	function init()
	{
		$_('export-btn').addEventListener( 'click', generateExport );
	}

	function generateExport()
	{
		setFilters();
		var user_data = settings.getAllSettings();
		var data = {
			exportTime: new Date().toUTCString(),
			exportVersion: user_data.version
		};
		var keys = Object.keys( user_data );
		keys.sort();
		for( var i in keys )
			data[keys[i]] = filterOutput( keys[i], user_data[keys[i]] );

		$_('export-content').value = JSON.stringify( data, null, "\t" );
		$_('import-content').value = '';
	}

	function setFilters()
	{
		default_settings = settings.getAllDefaultSettings();
		filters.global = $_( 'export-global-settings' ).checked;
		filters.boards = $_( 'export-boards-settings' ).checked;
		filters.lists = $_( 'export-lists-settings' ).checked;
	}

	function filterOutput( key, value )
	{
		if( filters.global )
			if( key !== 'version' && default_settings.hasOwnProperty( key ))
				return value;

		if( filters.boards )
			if( key !== 'board.*' && key.indexOf( 'board.' ) === 0 )
				if( Object.keys( value ).length )
					return value;

		if( filters.lists )
			if( key.indexOf( 'list.' ) === 0 )
				if( Object.keys( value ).length )
					return value;

		return undefined;
	}

	init();
}

new Export();

function Import()
{
	var default_settings;

	function init()
	{
		$_('import-btn').addEventListener( 'click', runImport );
	}

	function runImport()
	{
		setFlags();
		default_settings = settings.getAllDefaultSettings();
		var data = getImportData();
		if( !data )
			return;

		for( var key in data )
			if( data.hasOwnProperty( key ))
				importValue( key, data[key] );

		getBrowserObject().runtime.sendMessage({
			event: {
				code: 'settingsImported'
			}
		});

		alert( _( 'Data imported', 'Import' ));
		$_('export-content').value = '';
	}

	function setFlags()
	{
		if( $('input[name="input-model"]:checked').value === 'replace' )
			settings.removeAllSettings();
	}

	function getImportData()
	{
		var json = $_('import-content').value;
		var imported = true;
		try
		{
			var data = JSON.parse( json );
		}
		catch( e )
		{
			imported = false;
		}

		if( typeof data !== 'object' )
			imported = false;
		else if( typeof data.exportVersion !== 'string' )
			imported = false;

		if( !imported )
			alert( _( 'Invalid JSON to import!', 'Import' ));
		else
			return data;
	}

	function importValue( key, value )
	{
		if( key === 'exportVersion' )
			settings.setGlobal( 'version', value );
		else if( key !== 'exportTime' )
			settings.setGlobal( key, value );
	}

	init();
}

new Import();