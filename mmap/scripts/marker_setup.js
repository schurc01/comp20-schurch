var my_lat;
var my_long;
var map;
//my latitude/longitude variable
var latlng;
var me_marker;
var post_url = "http://chickenofthesea.herokuapp.com/sendLocation";
var my_infowindow = new google.maps.InfoWindow({
	content: "THAT'S ME!"
});
var infowindow = new google.maps.InfoWindow();
var request = new XMLHttpRequest();
var mousepos = new google.maps.LatLng();

//creates an initial map with no markers
function initialize() {
	myOptions = {
    zoom: 14, 
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  getMyLocation();
};

//find my location using geolocation
function getMyLocation() {
 	if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      my_lat = position.coords.latitude;
	    my_long = position.coords.longitude;
	    renderMeOnMap();
    });
  }
  //you're using IE
  else {
    alert("Geolocation is not supported by your web browser!");
  }
};

//renders map with geolocation marker of my location
function renderMeOnMap() {
	latlng = new google.maps.LatLng(my_lat, my_long);
	//my kitten marker image
  var image = "http://placekitten.com/g/40/40";

	me_marker = new google.maps.Marker({
		position: latlng,
		title: "That's me!",
		icon: image,
		map: map
	});

	//open info window on click of marker
	google.maps.event.addListener(me_marker, 'click', function() {
    my_infowindow.close();
		my_infowindow.setContent(me_marker.title);
		my_infowindow.open(map, me_marker);
	});

	//pan to my geolocation
	map.panTo(latlng);

	//request data from datastore
	getData();
};

//requests data from datastore
function getData() {
	try {
    //open request
	request.open('POST', post_url, true);
    //set request header
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    //send the request with my geolocation information
	  request.send("login=Horace&lat=" + my_lat + "&lng=" + my_long);

    //function that executes on a readyState change
		request.onreadystatechange = function() {
      //checks whether the request was successful
		  if (request.readyState == 4 && request.status == 200) {
        //parses data
			  var parsed_data = JSON.parse(request.responseText);
        //creates markers for students
			  for (var i = 0; i < parsed_data['students'].length; i++)
				  createStudentMarker(parsed_data['students'][i]);
        //creates markers for characters
			  for (var i = 0; i < parsed_data['characters'].length; i++)
				  createCharacterMarker(parsed_data['characters'][i]);
	    }
    };
  }
  //if the request fails
  catch(failed) {
	  request = null;
      alert("Could not retrieve data from datastore!");
  }
};

//creates a marker for each student on screen
function createStudentMarker(student) {
	var student_latlng = new google.maps.LatLng(student.lat, student.lng);
  var contentString = "login: " + student.login + "<br>lat/lng: " + student.lat +
                      ", " + student.lng + "<br>timestamp: " + student.created_at;

  //creats a marker for them with location
	var marker = new google.maps.Marker({
		map: map,
		position: student_latlng
	});

  //shows information in infowindow on a click
	google.maps.event.addListener(marker, 'click', function() {
	  infowindow.close();
	  infowindow.open(map, this);
	});
};

//creates a marker for each character on the screen
function createCharacterMarker(character) {
	var character_latlng = new google.maps.LatLng(character.loc.latitude,
                                                character.loc.longitude);
  //finds image for the character
	var image = "images/" + character.name + ".png";
  var contentString = "name: " + character.name + "<br>lat/lng: " 
                      + character.loc.latitude + ", " + character.loc.longitude
                      + "<br>note: " + character.loc.note;
	var distance;

  //calculates distance between me and character
	distanceBetweenMeAndCharacter(character.loc);

  //creates marker for character with image
	var marker = new google.maps.Marker({
		map: map,
		position: character_latlng,
		icon: image
	});

	//shows info window on click
	google.maps.event.addListener(marker, 'click', function() {
    infowindow.close();
    infowindow.setContent(contentString);
    infowindow.open(map, this);
	});

  //creates polyline between me and character
	var polyline = new google.maps.Polyline({
	  path: [character_latlng, latlng],
	  map: map,
    geodesic: false,
	  strokeColor: '#377FD3',
	  strokeOpacity: 0.7,
	  strokeWeight: 3
  });

	var rectangle = new google.maps.Rectangle({
    strokeColor: '#0B1C48',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#377FD3',
    fillOpacity: 0.35,
    map: map,
};

//calculates distance between me and the character
function distanceBetweenMeAndCharacter(character) {
  //radius of the earth in KM
	var earthRadius = 6371;
  //character latitude in radians
	var cLatInRadians = character.latitude.toRadians();
  //character longitude in radians
  var cLongInRadians = character.longitude.toRadians();

	var changeInLat = (character.latitude - my_lat).toRadians();
	var changeInLong = (character.longitude - my_long).toRadians();

  //calculations for the Haversine formula
	var a = Math.sin(changeInLat/2) * Math.sin(changeInLat/2) +
			Math.cos(cLatInRadians) * Math.cos(cLongInRadians) *
			Math.sin(changeInLong/2) * Math.sin(changeInLong/2);
	var c = 2 * Math.atan(Math.sqrt(a), Math.sqrt(1 - a));

	distance = earthRadius * c;
}

//turns number to radians
Number.prototype.toRadians = function() {
  return this * Math.PI / 180;
}