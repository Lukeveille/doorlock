document.addEventListener('DOMContentLoaded', () => {
  const socket = io.connect('/');
  const home = document.querySelector("#home");
  const longitude = document.querySelector('#homeLong');
  const latitute = document.querySelector('#homeLat');
  const currentLong = document.querySelector('#long');
  const currentLat = document.querySelector('#lat');
  const distanceBox = document.querySelector('#distance');
  let currentCoords = {};
  let ip = 0;

  const geoOptions = { enableHighAccuracy: true, timeout: 15000 }
  const fetchOptions = {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
  }

  fetch("https://ipapi.co/json").then(res => (res.json())).then(data => {
    ip = data.ip;
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
        ip: data.ip,
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
    )
  });

  home.addEventListener("click", () => {
    if (confirm('Set current location to home?')) {
      fetch('/api/user/' + ip, {...fetchOptions,
        method: 'PUT',
        body: JSON.stringify({
          homeCoords: {
            lat: currentCoords.latitude,
            long: currentCoords.longitude
          }
        })
      });
      socket.emit('distance', { distance: 0 });
      latitute.innerHTML = currentCoords.latitude;
      longitude.innerHTML = currentCoords.longitude;
    };
  });


  socket.on('distance', data => {
    // distanceBox.innerHTML = data.distance < 200? 'You are home' : 'You are approx. ' + data.distance + 'm from home';
    distanceBox.innerHTML = 'You are approx. ' + data.distance + 'm from home';
  });
  socket.on('new-home-display', data => {
    latitute.innerHTML = data.homeCoords.lat;
    longitude.innerHTML = data.homeCoords.long;
  });
  socket.on('new-current-display', data => {
    currentLat.innerHTML = data.coords.lat;
    currentLong.innerHTML = data.coords.long;
  });
  socket.on("left-home", data => {
    if (data.ip === ip) {
      alert(data.message);
    };
  });
});
