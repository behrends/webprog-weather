/* 
TODOS: 
- Ort löschen: in Tabelle UND Kacheln --> Code zusammenfassen
- doppelte Orte vermeiden?
  - im Speicher und View
  - Entferne aus Drop-Down nach Hinzufügen
  - Füge zum Drop-Down nach Entfernen hinzu 
- View:
  - Detail-Ansicht
  - Kachel entsprechend Temperatur einfärben
- Suche des Ortes durch Enter-Taste auslösen
- Laden der Daten:
  - Orte sofort anzeigen und dann Temp laden
  - Spinner o.ä. beim Laden anzeigen
- use strict?
*/
const add_btn = document.querySelector('#add_btn');
const search_btn = document.querySelector('#search_btn');
const search_input = document.querySelector('#search_input');
const selected_location = document.querySelector(
  '#selected_location'
);
const display_radio = document.querySelectorAll(
  'input[name="display_mode"]'
);
const weather_tiles = document.querySelector('#weather_tiles');
const weather_table = document.querySelector('#weather_table');

// Elemente für den Dialog (z.B. für Bestätigung beim Löschen)
const dialog = document.querySelector('#confirmDialog');
const confirmText = document.querySelector('#confirmText');
const confirmButton = document.querySelector('#confirmButton');
const cancelButton = document.querySelector('#cancelButton');
confirmButton.onclick = () => dialog.close('confirmed');
cancelButton.onclick = () => dialog.close('cancelled');

const weatherURL = `https://api.open-meteo.com/v1/forecast?current_weather=true`;
const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=`;

let locationsList = [];

function addLocation(name, temp, condition, image) {
  addLocationToTable(name, temp, condition, image);
  addLocationToTiles(name, temp, condition, image);
}

function addLocationToTable(name, temp, condition, image) {
  const new_location_row = document.createElement('tr');
  new_location_row.classList.add('weather_location_row');
  new_location_row.innerHTML = `<td class="location_row">${name}</td>
    <td class="temperature_row">${temp}°</td>
    <td class="condition_row">${condition}</td>
    <td><img class="weather_img_row" src="${image}" alt="${condition}"/></td>
    <td><img class="delete_btn_row" src="/img/close.svg"/></td>`;
  weather_table.appendChild(new_location_row);
  new_location_row
    .querySelector('.delete_btn_row')
    .addEventListener('click', () => {
      // Delete location from view and storage
      const choice = confirm(name + ' wirklich löschen?');
      if (choice) {
        new_location_row.remove();
        const index = locationsList.findIndex(
          (loc) => loc.name === name
        );
        locationsList.splice(index, 1);
        localStorage.setItem(
          'locations',
          JSON.stringify(locationsList)
        );
      }
    });
}

function showConfirmationDialog(text, onConfirm) {
  confirmText.textContent = text;
  dialog.onclose = () => {
    if (dialog.returnValue === 'confirmed') onConfirm();
  };
  dialog.showModal();
}

function addLocationToTiles(name, temp, condition, image) {
  const new_location_tile = document.createElement('div');
  new_location_tile.classList.add('weather_location_tile');
  new_location_tile.innerHTML = `<div class="location_tile">${name}
      <img class="delete_btn_tile" src="/img/close.svg"/>
    </div>    
    <div class="weather_info_tile">
      <span>
        <span class="temperature_tile">${temp}°</span>
        <span class="condition_tile">${condition}</span>
      </span>
      <img
        class="weather_img_tile"
        src="${image}"
        alt="${condition}"
      />
    </div>
  `;
  weather_tiles.appendChild(new_location_tile);
  new_location_tile
    .querySelector('.delete_btn_tile')
    .addEventListener('click', () => {
      // Delete location from view and storage
      showConfirmationDialog(`${name} wirklich löschen?`, () => {
        new_location_tile.remove();
        removeLocation(name);
      });
    });
}

function removeLocation(name) {
  const index = locationsList.findIndex((loc) => loc.name === name);
  locationsList.splice(index, 1);
  localStorage.setItem('locations', JSON.stringify(locationsList));
}

function saveLocations(loc) {
  locationsList.push(loc);
  localStorage.setItem('locations', JSON.stringify(locationsList));
}

function loadLocations() {
  const tmpLocations = localStorage.getItem('locations');
  if (tmpLocations === null) return;
  locationsList = JSON.parse(tmpLocations);
}

async function doSearch() {
  const location_name = search_input.value.trim();
  if (location_name.length === 0) return;

  const location = await searchLocation(location_name);
  if (location === null) {
    alert('Ort nicht gefunden');
    return;
  }

  const { temp, weathercode } = await loadWeatherData(
    location.latitude,
    location.longitude
  );

  const { condition, icon } = weatherCodes.get(weathercode);
  const image = `/img/weather/${icon}.svg`;
  addLocation(location.name, temp, condition, image);
  const { name, latitude, longitude } = location;
  saveLocations({ name, latitude, longitude });
  search_input.value = '';
}

async function doAddFromList() {
  const location_index = selected_location.value;
  const location = locations[location_index];

  const { temp, weathercode } = await loadWeatherData(
    location.latitude,
    location.longitude
  );

  const { condition, icon } = weatherCodes.get(weathercode);
  const image = `/img/weather/${icon}.svg`;
  addLocation(location.name, temp, condition, image);
  const { name, latitude, longitude } = location;
  saveLocations({ name, latitude, longitude });
}

async function loadWeatherData(latitude, longitude) {
  const url = `${weatherURL}&latitude=${latitude}&longitude=${longitude}`;
  const data = await fetch(url);
  const json = await data.json();
  const temp = Math.trunc(json.current_weather.temperature);
  const weathercode = json.current_weather.weathercode;
  return { temp, weathercode };
}

async function searchLocation(location) {
  const url = `${geoURL}${location}`;
  const data = await fetch(url);
  const json = await data.json();
  if (!json.results) return null;
  const { name, latitude, longitude } = json.results[0];
  return { name, latitude, longitude };
}

search_btn.addEventListener('click', doSearch);
add_btn.addEventListener('click', doAddFromList);
for (const radioButton of display_radio) {
  radioButton.addEventListener('change', () => {
    if (radioButton.value === 'table' && radioButton.checked) {
      weather_table.classList.remove('hidden');
      weather_tiles.classList.remove('weather_tiles_flex');
      weather_tiles.classList.add('hidden');
    } else {
      weather_table.classList.add('hidden');
      weather_tiles.classList.add('weather_tiles_flex');
      weather_tiles.classList.remove('hidden');
    }
  });
}

const locations = [
  {
    name: 'Berlin',
    latitude: 52.52,
    longitude: 13.41,
  },
  {
    name: 'Basel',
    latitude: 47.55,
    longitude: 7.58,
  },
  {
    name: 'Barcelona',
    latitude: 41.4,
    longitude: 2.16,
  },
  {
    name: 'London',
    latitude: 51.5,
    longitude: -0.11,
  },
  {
    name: 'Paris',
    latitude: 48.85,
    longitude: 2.35,
  },
  {
    name: 'Hamburg',
    latitude: 53.55,
    longitude: 9.99,
  },
  {
    name: 'Kopenhagen',
    latitude: 55.67,
    longitude: 12.57,
  },
  {
    name: 'Rom',
    latitude: 41.88,
    longitude: 12.48,
  },
  {
    name: 'New York',
    latitude: 40.71,
    longitude: -74,
  },
];

const weatherCodes = new Map();
weatherCodes.set(0, { condition: 'klar', icon: 'sun' });
weatherCodes.set(1, {
  condition: 'überwiegend klar',
  icon: 'sun-foggy',
});
weatherCodes.set(2, {
  condition: 'teilweise bewölkt',
  icon: 'sun-cloudy',
});
weatherCodes.set(3, {
  condition: 'zunehmend bewölkt',
  icon: 'cloudy',
});
weatherCodes.set(45, { condition: 'neblig', icon: 'foggy' });
weatherCodes.set(48, { condition: 'neblig mit Reif', icon: 'foggy' });
weatherCodes.set(51, {
  condition: 'leichter Sprühregen',
  icon: 'rainy',
});
weatherCodes.set(53, { condition: 'Sprühregen', icon: 'drizzle' });
weatherCodes.set(55, {
  condition: 'starker Sprühregen',
  icon: 'drizzle',
});
weatherCodes.set(56, {
  condition: 'leichter gefrierender Nieselregen',
  icon: 'hail',
});
weatherCodes.set(57, {
  condition: 'gefrierender Nieselregen',
  icon: 'hail',
});
weatherCodes.set(61, { condition: 'leichter Regen', icon: 'rainy' });
weatherCodes.set(63, { condition: 'Regen', icon: 'drizzle' });
weatherCodes.set(65, {
  condition: 'starker Regen',
  icon: 'heavy-showers',
});
weatherCodes.set(66, {
  condition: 'leichter gefrierender Regen',
  icon: '',
});
weatherCodes.set(67, { condition: 'gefrierender Regen', icon: '' });
weatherCodes.set(71, {
  condition: 'leichter Schneefall',
  icon: 'snowy',
});
weatherCodes.set(73, { condition: 'Schneefall', icon: 'snowy' });
weatherCodes.set(75, {
  condition: 'starker Schneefall',
  icon: 'snowy',
});
weatherCodes.set(77, { condition: 'Schneehagel', icon: 'snowy' });
weatherCodes.set(80, {
  condition: 'leichte Regenschauer',
  icon: 'rainy',
});
weatherCodes.set(81, { condition: 'Regenschauer', icon: 'showers' });
weatherCodes.set(82, {
  condition: 'starker Regenschauer',
  icon: 'heavy-showers',
});
weatherCodes.set(85, {
  condition: 'leichte Schneeschauer',
  icon: 'snowy',
});
weatherCodes.set(86, { condition: 'Schneeschauer', icon: 'snowy' });
weatherCodes.set(95, {
  condition: 'leichtes Gewitter',
  icon: 'thunderstorms',
});
weatherCodes.set(96, {
  condition: 'leichtes Gewitter mit Hagel',
  icon: 'thunderstorms',
});
weatherCodes.set(99, {
  condition: 'Gewitter mit Hagel',
  icon: 'thunderstorms',
});

function setupLocationList() {
  locations.forEach((location, index) => {
    if (locationsList.some((l) => l.name === location.name)) return;
    const option = document.createElement('option');
    option.innerHTML = location.name;
    option.setAttribute('value', index);
    selected_location.appendChild(option);
  });
}

function setupLocationView() {
  locationsList.forEach(async (location) => {
    const { temp, weathercode } = await loadWeatherData(
      location.latitude,
      location.longitude
    );

    const { condition, icon } = weatherCodes.get(weathercode);
    const image = `/img/weather/${icon}.svg`;
    addLocation(location.name, temp, condition, image);
  });
}

loadLocations();
setupLocationView();
setupLocationList();
