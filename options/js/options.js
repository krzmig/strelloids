function switchTab( btn )
{
	$( '.tab-nav button.active' ).classList.remove('active' );
	btn.classList.add( 'active' );

	$( '.tab-content.active' ).classList.remove( 'active' );
	$( btn.getAttribute( 'data-target' )).classList.add( 'active' );
}

// tab switcher
$b.addEventListener(
	'click',
	function( e )
	{
		if( e.target.getAttribute( 'data-toggle' ) === 'tab' )
			switchTab( e.target );
		else if( e.target.getAttribute( 'data-toggle' ) === 'reset' )
		{
			settings.resetGlobal( e.target.getAttribute( 'data-target' ) );
			loadOptionsToUI();
		}
	}
);

$b.addEventListener(
	'change',
	function( e )
	{
		if( e.target.getAttribute( 'data-toggle' ) === 'set' )
			settings.setGlobal( e.target.getAttribute( 'data-target' ), e.target.value );

	}
);

var settings = new Settings( function()
{
	var inputs = $$( '[data-toggle=set]' );
	for( var i = inputs.length - 1; i >= 0; --i )
		inputs[i].value = settings.getGlobal( inputs[i].getAttribute( 'data-target' ));
});