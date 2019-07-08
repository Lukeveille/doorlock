document.addEventListener('DOMContentLoaded', () => {
  const socket = io.connect('/');
  const home = document.querySelector("#home");
  const longitude = document.querySelector('#homeLong');
  const latitute = document.querySelector('#homeLat');
  const currentLong = document.querySelector('#long');
  const currentLat = document.querySelector('#lat');
  const distanceBox = document.querySelector('#distance');
  const currentCoords = {};
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
    navigator.geolocation.getCurrentPosition(
      position => {
        fetch('/api/user', {...fetchOptions,
          body: JSON.stringify({
            ip: data.ip,
            homeCoords: {
              lat: position.coords.latitude,
              long: position.coords.longitude
            }
          })
        }).then(res => res.json()).then(data => {
          latitute.innerHTML = data.homeCoords.lat;
          longitude.innerHTML = data.homeCoords.long;
        })
      },
      err => console.error(err),
      geoOptions
    );
    navigator.geolocation.watchPosition(
      position => {
        currentCoords.latitude = position.coords.latitude;
        currentCoords.longitude = position.coords.longitude;
        fetch('/api/user/' + data.ip, {...fetchOptions,
          body: JSON.stringify({
            coords: {
              lat: position.coords.latitude,
              long: position.coords.longitude
            }
          })
        }).then(res => (res.json())).then(data => {
          distanceBox.innerHTML = data.distance < 200? 'You are home' : 'You are approx. ' + data.distance + 'm from home';
        });
        currentLat.innerHTML = currentCoords.latitude;
        currentLong.innerHTML = currentCoords.longitude;
      },
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
      latitute.innerHTML = currentCoords.latitude;
      longitude.innerHTML = currentCoords.longitude;
    };
  });

  socket.on("left_home", data => {
    if (data.ip === ip) {
      alert("Lock your door!");
    }
  });
});
