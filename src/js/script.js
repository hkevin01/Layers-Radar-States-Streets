			
var options = {

//	minResolution : "auto",
//	minExtent : new OpenLayers.Bounds(-180, -90, 180, 90),
//	maxResolution : "auto",
//	maxExtent : new OpenLayers.Bounds(-180, -90, 180, 90)
};

function get_my_url (bounds) {
    var res = this.map.getResolution();
    var x = Math.round ((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
    var y = Math.round ((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom();

    var path = z + "/" + x + "/" + y + "." + this.type +"?"+ parseInt(Math.random()*9999);
    var url = this.url;
    if (url instanceof Array) {
        url = this.selectUrl(path, url);
    }
    return url + this.service +"/"+ this.layername +"/"+ path;

}
//-------------------------------------------------------------------------------------
var ia_wms = new OpenLayers.Layer.TMS(
        'NEXRAD Radar',
        'http://mesonet.agron.iastate.edu/cache/tile.py/',
        {layername      : 'nexrad-n0q-900913',
        service         : '1.0.0',
        type            : 'png',
        visibility      : false,
        getURL          : get_my_url,
        isBaseLayer     : false}
);

var states = new OpenLayers.Layer.TMS(
        "State Boundaries",
        "http://korona.geog.uni-heidelberg.de/tiles/adminb/",
        {
            type: 'png', getURL: getTileURL,
            displayOutsideMaxExtent: true,
            isBaseLayer: false,
            numZoomLevels: 19
        }
      );  

var street = new OpenLayers.Layer.TMS(
        "Roads",
        "http://korona.geog.uni-heidelberg.de/tiles/roads/",
        {
            numZoomLevels: 20,
            type: 'png', getURL: getTileURL,
            displayOutsideMaxExtent: true,
            visibility: false,
            isBaseLayer: true
        }
      );  

//--------------------------- END GLOBALS -------------------------------
function init_load(){

	//--------------------------
	//required for NexRad to Function
	map = new OpenLayers.Map("map",{
		units: 'm',
		projection: new OpenLayers.Projection('EPSG:900913'),
		displayProjection: new OpenLayers.Projection("EPSG:4326"),
		
	});
	//--------------------------
	map.displayProjection = new OpenLayers.Projection("EPSG:4326");
	//var street = new OpenLayers.Layer.Google("Google", {  numZoomLevels: 20});
	hazard_layer = new OpenLayers.Layer.Markers( "MoPED - Hazard",{
		transparent: 'true',
		opacity: 0.9
		});

	
	map.addLayer(street);
	map.addLayer(new OpenLayers.Layer.OSM());
	//map.addLayer(states);
	map.addLayer(ia_wms);
	map.addLayer(hazard_layer);
	
	  //var hybrid = new OpenLayers.Layer.Google("Google", { type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20});
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.setCenter(new OpenLayers.LonLat(-97,38) // Center of the map
	    .transform(
	      new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
	      new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
	    ), 4 // Zoom level
	);
	  
	map.events.register('zoomend', this, function (event) {
		    var x = map.getZoom();
		    if( x < 4){ map.zoomTo(4);}   
	});  
	    
	$.ajax({
		url: urlPath + "obsGetter.php", 
		dataType: 'json',
		async: false,
		data: { last: true },  // uses last saved 24hour map
		success: function(data) {
			loading(true);
			waitForMSG(data.obs[0].file,true);
		},//success function
		// The error handler.
		error: function(jqXHR, exception, errorThrown) {
			errorAlert(jqXHR,exception,errorThrown);          
		}
	}); //end ajax
	
};
