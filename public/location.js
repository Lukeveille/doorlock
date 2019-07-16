document.addEventListener('DOMContentLoaded', () => {
  const socket = io.connect('/'),
  home = document.querySelector("#home"),
  longitude = document.querySelector('#homeLong'),
  latitute = document.querySelector('#homeLat'),
  currentLong = document.querySelector('#long'),
  currentLat = document.querySelector('#lat'),
  distanceBox = document.querySelector('#distance'),
  geoOptions = { enableHighAccuracy: true, timeout: 15000 };

  fetch("https://ipapi.co/json").then(res => (res.json())).then(data => {
    const login = position => {
      socket.emit('login', {
        ip: data.ip,
        coords: {
          lat: position.coords.latitude,
          long: position.coords.longitude
        }
      });
      currentCoords = position.coords;
    };
    const updatePosition = position => {
      socket.emit('new-coords', {
        coords: {
          lat: position.coords.latitude,
          long: position.coords.longitude
        }
      });
    };
    navigator.geolocation.getCurrentPosition(
      login,
      err => console.error(err),
      geoOptions
    );
    navigator.geolocation.watchPosition(
      updatePosition,
      err => console.error(err),
      geoOptions
    );
  });

  home.addEventListener("click", () => {
    if (confirm('Set current location to home?')) {
      socket.emit('new-home');
    };
  });

  socket.on('distance', data => {
    distanceBox.innerHTML = data.distance < data.setDistance? 'You are home' : 'You are approx. ' + data.distance + 'm from home';
  });
  socket.on('new-home-display', data => {
    latitute.innerHTML = data.homeCoords.lat;
    longitude.innerHTML = data.homeCoords.long;
  });
  socket.on('new-current-display', data => {
    currentLat.innerHTML = data.coords.lat;
    currentLong.innerHTML = data.coords.long;
  });
  socket.on('left-home', data => {
    alert(data.message);
  });
});
