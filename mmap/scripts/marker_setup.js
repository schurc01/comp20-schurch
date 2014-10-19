var myLat;
		var myLong;
		var map;
		var latlng;
		var meMarker;
		var url = "http://chickenofthesea.herokuapp.com/sendLocation";
		var infowindow = new google.maps.InfoWindow;
		var request = new XMLHttpRequest();

		//creates an initial map
		function initialize() {
			myOptions = {
            	zoom: 14, 
           	 	center: latlng,
            	mapTypeId: google.maps.MapTypeId.ROADMAP
        	};
        	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
        	getMyLocation();
        };

         //find my location
        function getMyLocation() {
         	if (navigator.geolocation) {
          		navigator.geolocation.getCurrentPosition(function(position) {
					myLat = position.coords.latitude;
					myLong = position.coords.longitude;
					renderMyMap();
				});
          	}
          	//you're using IE
          	else {
          		alert("Geolocation is not supported by your web browser!");
          	}
        };

        //renders map with geolocation
        function renderMyMap() {
          	latlng = new google.maps.LatLng(myLat, myLong);
          	var image = "http://placekitten.com/g/40/40";

          	meMarker = new google.maps.Marker({
          		position: latlng,
          		title: "That's me!",
          		icon: image,
          		map: map
          	});

          	// //open info window on click of marker
          	google.maps.event.addListener(meMarker, 'click', function() {
          			infowindow.setContent(meMarker.title);
          			infowindow.open(map, meMarker);
          	});

          	//pan to geolocation
          	map.panTo(latlng);

          	//get data from datastore
          	getData();
        };

        function getData() {
        	try {
        		request.open('POST', url, true);
				request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        		request.send("login=Horace&lat=" + myLat + "&lng=" + myLong);
       			request.onreadystatechange = function() {
        			if (request.readyState == 4 && request.status == 200) {
        				var parsedData = JSON.parse(request.responseText);
        				for (var i = 0; i < parsedData['students'].length; i++) {
        					createMarker(parsedData['students'][i]);
        				}
        				for (var i = 0; i < parsedData['characters'].length; i++) {
        					createCharacterMarker(parsedData['characters'][i]);
        					console.log(parsedData['characters'][i].name);
        				}
        			}
        		}	
        	}
        	catch(failed) {
        		request = null;
        	}
        };

        function createMarker(student) {
        	var studentLatLng = new google.maps.LatLng(student.lat, student.lng);

        	var marker = new google.maps.Marker({
        		map: map,
        		position: studentLatLng
        	});

        	var contentString = "login: " + student.login + "<br>lat/lng: " + student.lat + ", " + student.lng + "<br>timestamp: " + student.created_at;
        	google.maps.event.addListener(marker, 'click', function() {
					infowindow.close();
					infowindow.setContent(contentString);
					infowindow.open(map, this);
        	});
        };
        function createCharacterMarker(character) {
        	var characterLatLng = new google.maps.LatLng(character.loc.latitude, character.loc.longitude);
        	var image = "images/" + character.name + ".png";
        	var distance;
        	distanceBetweenMeAndCharacter(character.loc);

        	var marker = new google.maps.Marker({
        		map: map,
        		position: characterLatLng,
        		icon: image
        	});

        	var contentString = "name: " + character.name + "<br>lat/lng: " + character.loc.latitude + ", " + character.loc.longitude + "<br>note: " + character.loc.note;
        	google.maps.event.addListener(marker, 'click', function() {
				infowindow.close();
				infowindow.setContent(contentString);
				infowindow.open(map, this);
        	});

        	var toAndFrom = [
        		characterLatLng,
        		latlng
        	];
        	var polyline = new google.maps.Polyline({
    			path: toAndFrom,
    			geodesic: true,
    			strokeColor: '#FF0000',
    			strokeOpacity: 1.0,
    			strokeWeight: 2,
    			map: map
  			});

  			// var distanceWindow = new google.maps.InfoWindow();
  			// distanceWindow.setContent(distance);

  			// google.maps.event.addListener(polyline, 'onclick', function() {
     // 			distanceWindow.open(map);
  			// });
        };

        function distanceBetweenMeAndCharacter(character) {
        	var earthRadius = 6371;
        	var cLatInRadians = character.latitude.toRad();
        	var cLongInRadians = character.longitude.toRad();
        	var changeInLat = (character.latitude - myLat).toRad();
        	var changeInLong = (character.longitude - myLong).toRad();
        	var a = Math.sin(changeInLat/2) * Math.sin(changeInLat/2) +
        			Math.cos(cLatInRadians) * Math.cos(cLongInRadians) *
        			Math.sin(changeInLong/2) * Math.sin(changeInLong/2);
        	var c = 2 * Math.atan(Math.sqrt(a), Math.sqrt(1 - a));
        	distance = earthRadius * c;
        }

        Number.prototype.toRad = function() {
  			return this * Math.PI / 180;
		}