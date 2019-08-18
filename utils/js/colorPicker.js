/**
 * @param {HTMLInputElement} input
 * @constructor
 */
ColorPicker = function( input )
{
	if( input.hasAttribute( 'data-initialized' ))
		return;

	/**
	 * @var {int}
	 */
	var R, G, B, A, H, S, L;
	/**
	 * @var {boolean}
	 */
	var alpha_enabled = input.hasAttribute( 'data-alpha' );
	/**
	 * $var {string}
	 */
	var color_mode = 'rgb';
	/**
	 * @var {HTMLFormElement}
	 */
	var picker_node;
	/**
	 * @var {HTMLDivElement}
	 */
	var backdrop, preview_node;
	/**
	 * @var {HTMLInputElement}
	 */
	var input_hex_node;
	/**
	 * @var {{HTMLInputElement}}
	 */
	var inputs = {};


	function init()
	{
		findNodes();
		initInputEvents();
		updateCurrentColor.fromInput();
		UI.updateInput();
	}

	function findNodes()
	{
		picker_node = $_( 'color-picker' );
		input_hex_node = picker_node.querySelector( 'input[name=hex]' );
		preview_node = picker_node.querySelector( '.preview' );
		backdrop = picker_node.querySelector( '.backdrop' );

		var elems = picker_node.querySelectorAll( 'input[type=range], input[type=number]' );
		for( var i = elems.length - 1; i >= 0; --i )
		{
			var name = elems[i].type + '_' + elems[i].name;
			inputs[name] = elems[i];
		}
	}

	function initInputEvents()
	{
		input.setAttribute( 'data-initialized', 'true' );
		input.addEventListener( 'focus', events.input.focus, true );
	}

	var picker = {
		open: function()
		{
			picker.addEvents();

			updateCurrentColor.fromInput();
			UI.updateMode();
			UI.updateSliders();
			UI.updatePreview();
			UI.updateHex();

			picker_node.style.display = null;
			input_hex_node.focus();
		},

		save: function()
		{
			if( !input_hex_node.checkValidity() )
				return;

			input.value = input_hex_node.value;
			UI.updateInput();

			var onChangeEvent = document.createEvent( 'HTMLEvents' );
			onChangeEvent.initEvent('change', false, true );
			input.dispatchEvent( onChangeEvent );

			picker.close();
		},

		close: function()
		{
			picker.removeEvents();
			picker_node.style.display = 'none';
		},

		addEvents: function()
		{
			for( var name in inputs )
				if( inputs.hasOwnProperty( name ))
				{
					inputs[name].addEventListener( 'input', events.slider.changed );
					inputs[name].addEventListener( 'keydown', events.document.keyPress );
				}

			var modes = picker_node.querySelectorAll( 'input[name=mode]' );
			for( var i = modes.length - 1; i >= 0; --i )
				modes[i].addEventListener( 'change', events.mode.changed );

			input_hex_node.addEventListener( 'input', events.hex.changed );
			input_hex_node.addEventListener( 'keydown', events.document.keyPress );
			picker_node.addEventListener( 'reset', events.form.reset, true );
			picker_node.addEventListener( 'submit', events.form.submit, true );
			backdrop.addEventListener( 'click', picker.close );
		},

		removeEvents: function()
		{
			for( var name in inputs )
				if( inputs.hasOwnProperty( name ))
				{
					inputs[name].removeEventListener( 'input', events.slider.changed );
					inputs[name].removeEventListener( 'keydown', events.document.keyPress );
				}

			var modes = picker_node.querySelectorAll( 'input[name=mode]' );
			for( var i = modes.length - 1; i >= 0; --i )
				modes[i].removeEventListener( 'change', events.mode.changed );

			$b.removeEventListener( 'keydown', events.keyPress );
			input_hex_node.removeEventListener( 'input', events.hex.changed );
			input_hex_node.removeEventListener( 'keydown', events.document.keyPress );
			picker_node.removeEventListener( 'reset', events.form.reset, true );
			picker_node.removeEventListener( 'submit', events.form.submit, true );
			backdrop.removeEventListener( 'click', picker.close );
		}
	};

	var updateCurrentColor = {
		fromInput: function()
		{
			var rgba = convert.hexToRgba( input.value || '#ffffffff' );
			R = rgba[0];
			G = rgba[1];
			B = rgba[2];
			A = rgba[3];
		},

		fromHex: function()
		{
			if( !input_hex_node.checkValidity() )
				return;

			var rgba = convert.hexToRgba( input_hex_node.value || '#ffffffff' );
			R = rgba[0];
			G = rgba[1];
			B = rgba[2];
			A = rgba[3];
		},

		fromSliders: function()
		{
			if( color_mode === 'rgb' )
			{
				R = parseInt( inputs['range_R'].value );
				G = parseInt( inputs['range_G'].value );
				B = parseInt( inputs['range_B'].value );
			}
			else
			{
				H = parseInt( inputs['range_H'].value );
				S = parseInt( inputs['range_S'].value );
				L = parseInt( inputs['range_L'].value );

				var rgb = convert.hslToRgb( H, S, L );
				R = rgb[0];
				G = rgb[1];
				B = rgb[2];
			}

			A = parseInt( inputs['range_A'].value );
		},

		toHSL: function()
		{
			var hsl = convert.rgbToHsl( R, G, B );
			H = hsl[0];
			S = hsl[1];
			L = hsl[2];
		}
	};

	var UI = {
		updatePreview: function()
		{
			preview_node.style.backgroundColor = 'rgba(' + R + ',' + G + ',' + B + ')';
		},

		updateHex: function()
		{
			input_hex_node.value = '#' +
				( '0' + R.toString( 16 ) ).substr( -2 ) +
				( '0' + G.toString( 16 ) ).substr( -2 ) +
				( '0' + B.toString( 16 ) ).substr( -2 ) +
				( alpha_enabled ? ( '0' + Math.round( A * 2.55 ).toString( 16 ) ).substr( -2 ) : '' );
		},

		updateInput: function()
		{
			var l = ( Math.max( R, G, B ) + Math.min( R, G, B ) ) / 510;

			input.style.backgroundColor = alpha_enabled ?
				'rgba(' + R + ',' + G + ',' + B + ',' + ( A / 100 ) + ')' :
				'rgb(' + R + ',' + G + ',' + B + ')';
			input.style.color = ( l >= 0.4 ? '#000' : '#fff' );
		},

		updateSliders: function()
		{
			if( color_mode === 'rgb' )
			{
				inputs['range_R'].value = R;
				inputs['number_R'].value = R;
				inputs['range_G'].value = G;
				inputs['number_G'].value = G;
				inputs['range_B'].value = B;
				inputs['number_B'].value = B;

				inputs['range_R'].style.background = 'linear-gradient(to right, rgb(0, ' + G + ', ' + B + '), rgb(255, ' + G + ', ' + B + '))';
				inputs['range_G'].style.background = 'linear-gradient(to right, rgb(' + R + ', 0, ' + B + '), rgb(' + R + ', 255, ' + B + '))';
				inputs['range_B'].style.background = 'linear-gradient(to right, rgb(' + R + ', ' + G + ', 0), rgb(' + R + ', ' + G + ', 255))';
			}
			else
			{
				inputs['range_H'].value = H;
				inputs['number_H'].value = H;
				inputs['range_S'].value = S;
				inputs['number_S'].value = S;
				inputs['range_L'].value = L;
				inputs['number_L'].value = L;

				inputs['range_S'].style.background = 'linear-gradient(to right, hsl(' + H + ', 0%, ' + L + '%), hsl(' + H + ', 50%, ' + L + '%), hsl(' + H + ', 100%, ' + L + '%))';
				inputs['range_L'].style.background = 'linear-gradient(to right, hsl(' + H + ', ' + S + '%, 0%), hsl(' + H + ', ' + S + '%, 50%), hsl(' + H + ', ' + S + '%, 100%))';
			}

			inputs['range_A'].value = A;
			inputs['number_A'].value = A;

			inputs['range_A'].style.background = 'linear-gradient(to right, rgba(' + R + ', ' + G + ', ' + B + ', 0), rgba(' + R + ', ' + G + ', ' + B + ', 1))';
		},

		updateMode: function()
		{
			var elems = picker_node.querySelectorAll( '.slider' );
			for( var i = elems.length - 1; i >= 0; --i )
				elems[i].style.display = elems[i].classList.contains( color_mode ) ? null : 'none';

			inputs['number_A'].parentNode.style.display = alpha_enabled ? null : 'none';
		}
	};

	var events = {
		input: {
			focus: function( e )
			{
				e.preventDefault();
				picker.open();
			}
		},

		document: {
			keyPress: function( e )
			{
				if( e.key === 'Enter' )
				{
					e.preventDefault();
					picker.save();
				}
				else if( e.key === 'Escape' )
				{
					picker.close();
				}
			}
		},

		form: {
			submit: function( e )
			{
				e.preventDefault();
				picker.save();
			},

			reset: function( e )
			{
				e.preventDefault();
				picker.close();
			}
		},

		slider: {
			changed: function()
			{
				var name = ( this.type === 'range' ? 'number' : 'range' ) + '_' + this.name;
				inputs[name].value = this.value;

				updateCurrentColor.fromSliders();
				UI.updateSliders();
				UI.updateHex();
				UI.updatePreview();
			}
		},

		hex: {
			changed: function()
			{
				updateCurrentColor.fromHex();
				UI.updateSliders();
				UI.updatePreview();
			}
		},

		mode: {
			changed: function()
			{
				color_mode = this.value;

				if( color_mode === 'hsl' )
					updateCurrentColor.toHSL();

				updateCurrentColor.fromSliders();

				UI.updateMode();
				UI.updateSliders();
			}
		}
	};

	var convert = {
		/**
		 * @param hex #rgb #rgba #rrggbb #rrggbbaa
		 * @return {int[]} R: 0-255; G: 0-255; B: 0-255; A: 0-100
		 */
		hexToRgba: function( hex )
		{
			var r = 255, g = 255, b = 255, a = 100;
			hex = hex.substr( 1 );

			if( hex.length === 3 || hex.length === 4 )
			{
				r = parseInt( hex.charAt( 0 ) + hex.charAt( 0 ), 16 );
				g = parseInt( hex.charAt( 1 ) + hex.charAt( 1 ), 16 );
				b = parseInt( hex.charAt( 2 ) + hex.charAt( 2 ), 16 );
				if( hex.length === 4 )
					a = Math.round( parseInt( hex.charAt( 3 ) + hex.charAt( 3 ), 16 ) / 2.55 );
			}
			else if( hex.length === 6 || hex.length === 8 )
			{
				r = parseInt( hex.substr( 0, 2 ), 16 );
				g = parseInt( hex.substr( 2, 2 ), 16 );
				b = parseInt( hex.substr( 4, 2 ), 16 );
				if( hex.length === 8 )
					a = Math.round( parseInt( hex.substr( 6, 2 ), 16 ) / 2.55 );
			}
			else
				return [ R, G, B, A ];

			return [ r, g, b, a ];
		},

		/**
		 * @param {int} r 0-255
		 * @param {int} g 0-255
		 * @param {int} b 0-255
		 * @return {int[]} H: 0-360; S: 0-100; L: 0-100
		 */
		rgbToHsl: function( r, g, b )
		{
			r = r / 255;
			g = g / 255;
			b = b / 255;

			var c_min = Math.min( r, g, b );
			var c_max = Math.max( r, g, b );
			var delta = c_max - c_min;

			var h, l = ( c_max + c_min ) / 2;
			var s = ( delta === 0 ? 0 : delta / ( 1 - Math.abs( 2 * l - 1 )));

			if( delta === 0 )
				h = 0;
			else if( c_max === r )
				h = ( g - b ) / delta % 6;
			else if( c_max === g )
				h = ( b - r ) / delta + 2;
			else
				h = ( r - g ) / delta + 4;

			if( h < 0 )
				h += 360;

			return [ Math.round( h * 60 ), Math.round( s * 100 ), Math.round( l * 100 ) ];
		},

		/**
		 * @param {int} h 0-360
		 * @param {int} s 0-100
		 * @param {int} l 0-100
		 * @return {int[]} R: 0-255; G: 0-255; B: 0-255
		 */
		hslToRgb: function( h, s, l )
		{
			s /= 100;
			l /= 100;
			var c = ( 1 - Math.abs( 2 * l - 1 )) * s;
			var x = c * ( 1 - Math.abs((( h / 60 ) % 2 ) - 1 ));
			var m = l - c / 2;

			return [
				Math.round( (( h < 60 || h >= 300 ? c : ( h < 120 || h >= 240 ? x : 0 )) + m ) * 255 ),
				Math.round( (( h >= 60 && h < 180 ? c : ( h >= 0 && h < 240 ? x : 0 )) + m ) * 255 ),
				Math.round( (( h >= 180 && h < 300 ? c : ( h >= 120 && h < 360 ? x : 0 )) + m ) * 255 )
			];
		}
	};

	init();
};