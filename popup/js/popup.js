document.body.addEventListener(
	'change',
	function( e )
	{
		if( e.target.getAttribute( 'data-toggle' ) === 'set' )
			settings.setForCurrentBoard( e.target.getAttribute( 'data-target' ), e.target.value );
		else if( e.target.getAttribute( 'data-toggle' ) === 'toggle' )
			settings.setForCurrentBoard( e.target.getAttribute( 'data-target' ), e.target.checked );

		updateDependence();
	}
);

function updateDependence(  )
{
	var inputs = $$( '[data-required]' );
	for( var i = inputs.length - 1; i >= 0; --i )
	{
		var required = inputs[i].getAttribute( 'data-required' );
		var parent_input = $('[data-toggle="toggle"][data-target="'+required+'"]');
		inputs[i].disabled = !( parent_input && parent_input.checked );
	}
}

var settings = new Settings( function()
{
	var inputs = $$( '[data-toggle=set]' );
	for( var i = inputs.length - 1; i >= 0; --i )
		inputs[i].value = settings.getForCurrentBoard( inputs[i].getAttribute( 'data-target' ));

	inputs = $$( '[data-toggle=toggle]' );
	for( i = inputs.length - 1; i >= 0; --i )
		inputs[i].checked = settings.getForCurrentBoard( inputs[i].getAttribute( 'data-target' ));

	updateDependence();
});