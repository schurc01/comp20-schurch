var my_lat = 0;
var my_long = 0;
var map;
//my latitude/longitude variable
var latlng = new google.maps.LatLng(my_lat, my_long);
var myOptions = {
    				zoom: 14, 
    				center: latlng,
    				mapTypeId: google.maps.MapTypeId.ROADMAP
  				};
var me_marker;
var post_url = "http://chickenofthesea.herokuapp.com/sendLocation";
var my_infowindow = new google.maps.InfoWindow();
var infowindow = new google.maps.InfoWindow();
var request = new XMLHttpRequest();
var mousepos = new google.maps.LatLng();
var distance;
var all_distances = "";
var names = [];
var distances = [];
var distance_string = "";

//creates an initial map with no markers
function initialize() {
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
	//pan to my geolocation
	map.panTo(latlng);
	//my kitten marker image
  	var image = "http://placekitten.com/g/40/40";

	me_marker = new google.maps.Marker({
		position: latlng,
		icon: image
	});
	me_marker.setMap(map);

	//request data from datastore
	getData();

	//sets distance marker
	
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

				sortDistances(0);
				for (var i = 0; i < names.length; i++) {
					distance_string += (names[i] + ": " + distances[i] + "KM<br>");
				}

				//set distances on my marker
				google.maps.event.addListener(me_marker, 'click', function() {
    			my_infowindow.close();
				my_infowindow.open(map, me_marker);
				my_infowindow.setContent(distance_string);
				});
	    	}
  		}
  	}
  	//if the request fails
  	catch(failed) {
		request = null;
      	alert("Could not retrieve data from datastore!");
  	}
};

function sortDistances(i){
	if (i == names.length) {
		return;
	}
	var min_pos = i;
	for (var j = i; j < names.length; j++) {
		if (distances[j] < distances[min_pos]) {
			min_pos = j;
		}
	}
	var temp_name = names[i];
	var temp_distance = distances[i];
	names[i] = names[min_pos];
	distances[i] = distances[min_pos];
	names[min_pos] = temp_name;
	distances[min_pos] = temp_distance;
	sortDistances(i + 1);
}

//creates a marker for each student on screen
function createStudentMarker(student) {
	var student_latlng = new google.maps.LatLng(student.lat, student.lng);
  	var studentContentString = "login: " + student.login + "<br>lat/lng: " + student.lat +
                      ", " + student.lng + "<br>timestamp: " + student.created_at;

  	//creats a marker for them with location
	var marker = new google.maps.Marker({
		map: map,
		position: student_latlng
	});

  	//shows information in infowindow on a click
	google.maps.event.addListener(marker, 'click', function() {
	  	infowindow.close();
	  	infowindow.setContent(studentContentString);
	  	infowindow.open(map, this);
	});
};

//creates a marker for each character on the screen
function createCharacterMarker(character) {
	var character_latlng = new google.maps.LatLng(character.loc.latitude,
                                                character.loc.longitude);
  	//finds image for the character
	var image = "images/" + character.name + ".png";
 	var characterContentString = "name: " + character.name + "<br>lat/lng: " 
                      + character.loc.latitude + ", " + character.loc.longitude
                      + "<br>note: " + character.loc.note;

  	//calculates distance between me and character
	distanceBetweenMeAndCharacter(character.loc);
	distances[distances.length] = distance;
	names[names.length] = character.name;
  	
  	//creates marker for character with image
	var marker = new google.maps.Marker({
		map: map,
		position: character_latlng,
		icon: image
	});

	//shows info window on click
	google.maps.event.addListener(marker, 'click', function() {
    	infowindow.close();
    	infowindow.setContent(characterContentString);
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
}
//calculates distance between me and the character
function distanceBetweenMeAndCharacter(character) {
  	//radius of the earth in KM
	var earthRadius = 6371;
  	//character latitude in radians
	var cLatInRadians = character.latitude.toRadians();
  	//character longitude in radians
  	var cLongInRadians = character.longitude.toRadians();

  	var diffLat = character.latitude - my_lat;
  	var diffLong = character.longitude - my_long;
	var changeInLat = diffLat.toRadians();
	var changeInLong = diffLong.toRadians();

  	//calculations for the Haversine formula
	var a = Math.sin(changeInLat/2) * Math.sin(changeInLat/2) +
			Math.cos(cLatInRadians) * Math.cos(my_lat.toRadians()) *
			Math.sin(changeInLong/2) * Math.sin(changeInLong/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	distance = earthRadius * c;
}

//turns number to radians
Number.prototype.toRadians = function() {
  	return this * Math.PI / 180;
}