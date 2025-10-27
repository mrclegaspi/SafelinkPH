// ===== CLOSE ALERT BANNER =====
function closeBanner() {
  document.getElementById("alert-banner").style.display = "none";
}

// ===== ELEMENT REFERENCES =====
const alertBanner = document.getElementById("alert-banner");
const alertMessage = document.getElementById("alert-message");
const closeAlert = document.getElementById("close-alert");

const API_KEY = "974e78374f2d179e43b29861b1b95e4e"; // Replace with your OpenWeatherMap API key

// ===== FETCH WEATHER BY COORDS (with caching + fallback) =====
async function fetchWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error("Network error or invalid key");

    const data = await response.json();

    if (!data || !data.weather || !data.main) throw new Error("Incomplete weather data");

    // Cache data with timestamp
    localStorage.setItem(
      "cachedWeather",
      JSON.stringify({ timestamp: Date.now(), data })
    );

    displayWeatherData(data);
  } catch (error) {
    console.warn("Weather fetch failed:", error);

    // Try cached data
    const cached = localStorage.getItem("cachedWeather");
    if (cached) {
      const { data } = JSON.parse(cached);
      console.log("Loaded cached weather data");
      displayWeatherData(data, true);
    } else {
      alertBanner.classList.add("hidden");
    }
  }
}

// ===== DISPLAY WEATHER DATA =====
function displayWeatherData(data, isCached = false) {
  if (!data || !data.main || !data.weather) return;

  const city = data.name || "your area";
  const temp = Math.round(data.main.temp);
  const humidity = data.main.humidity;
  const wind = Math.round(data.wind.speed);
  const description = data.weather[0].description;
  const condition = data.weather[0].main.toLowerCase();

  // Update the card content
  const tempEl = document.getElementById("temperature");
  const descEl = document.getElementById("weatherDesc");
  const humidityEl = document.getElementById("humidity");
  const windEl = document.getElementById("wind");
  const timeEl = document.getElementById("updatedTime");

  if (tempEl) tempEl.textContent = `${temp}°C`;
  if (descEl) descEl.textContent = description;
  if (humidityEl) humidityEl.textContent = `${humidity}%`;
  if (windEl) windEl.textContent = `${wind} km/h`;
  if (timeEl) timeEl.textContent = `Updated ${new Date().toLocaleTimeString()}`;

  // ===== Update Alert Banner =====
  let alertText = "";
  let bgColor = "";

  if (condition.includes("storm") || wind > 40) {
    alertText = `⚠️ STORM ALERT: ${description} with strong winds (${wind} km/h) in ${city}. Stay safe and monitor updates.`;
    bgColor = "linear-gradient(90deg, #c62828, #ff7043)";
  } else if (condition.includes("rain")) {
    alertText = `🌧️ WEATHER ADVISORY: ${description} in ${city}. Bring an umbrella if going outside.`;
    bgColor = "linear-gradient(90deg, #1976d2, #64b5f6)";
  } else if (condition.includes("clear")) {
    alertText = `☀️ CLEAR SKIES: ${city} is currently clear and calm.`;
    bgColor = "linear-gradient(90deg, #2e7d32, #81c784)";
  } else if (condition.includes("cloud")) {
    alertText = `☁️ PARTLY CLOUDY: ${description}, ${temp}°C in ${city}.`;
    bgColor = "linear-gradient(90deg, #455a64, #90a4ae)";
  } else {
    alertText = `ℹ️ CURRENT WEATHER: ${description}, ${temp}°C in ${city}.`;
    bgColor = "linear-gradient(90deg, #f57c00, #ffb74d)";
  }

  if (isCached) {
    alertText = `⚠️ Using last saved data (offline mode).\n${alertText}`;
  }

  alertBanner.style.background = bgColor;
  alertMessage.textContent = alertText;
  alertBanner.classList.remove("hidden");

  // ===== Update Risk Card =====
  const riskLevelEl = document.querySelector(".risk-level strong");
  const riskDot = document.querySelector(".dot");

  if (riskLevelEl && riskDot) {
    if (condition.includes("storm") || wind > 40) {
      riskLevelEl.textContent = "High Risk";
      riskDot.style.backgroundColor = "#dc3545";
    } else if (condition.includes("rain")) {
      riskLevelEl.textContent = "Moderate Risk";
      riskDot.style.backgroundColor = "#fcd116";
    } else {
      riskLevelEl.textContent = "Low Risk";
      riskDot.style.backgroundColor = "#28a745";
    }
  }
}

// ===== GEOLOCATION HANDLER =====
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.warn("Geolocation failed, using Manila as fallback.");
        fetchWeatherByCoords(14.5995, 120.9842); // Manila fallback
      }
    );
  } else {
    console.warn("Geolocation not supported, using Manila as fallback.");
    fetchWeatherByCoords(14.5995, 120.9842);
  }
}

// ===== EVENT HANDLERS =====
closeAlert.addEventListener("click", () => {
  alertBanner.classList.add("hidden");
});

// ===== INITIAL LOAD =====
getUserLocation();

// ===== REFRESH EVERY 10 MINUTES =====
setInterval(getUserLocation, 600000);

// ===== PAGASA ADVISORIES (Auto-update + Offline Cache) =====
const pagasaSection = document.getElementById("pagasa-advisories");
const advisoryList = document.getElementById("advisory-list");

// PAGASA’s official RSS feed + proxy converter
const PAGASA_RSS_URL = "https://pubfiles.pagasa.dost.gov.ph/rss.xml";
const RSS2JSON = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(PAGASA_RSS_URL)}`;

// Fetch PAGASA feed and cache results
async function fetchPagasaAdvisories() {
  try {
    const response = await fetch(RSS2JSON, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to reach RSS service.");

    const data = await response.json();
    if (!data.items || !data.items.length) throw new Error("No advisories found.");

    const latest = data.items.slice(0, 3);
    // ✅ Cache successful response
    localStorage.setItem(
      "cachedAdvisories",
      JSON.stringify({ timestamp: Date.now(), items: latest })
    );

    displayAdvisories(latest);
  } catch (err) {
    console.warn("PAGASA fetch failed:", err.message);

    const cached = localStorage.getItem("cachedAdvisories");
    if (cached) {
      const { items } = JSON.parse(cached);
      console.log("Loaded cached PAGASA advisories");
      displayAdvisories(items, true);
    } else {
      advisoryList.innerHTML =
        "<p>⚠️ Unable to fetch advisories right now. Please try again later.</p>";
      pagasaSection.classList.remove("hidden");
    }
  }
}

// Render advisory cards
function displayAdvisories(items, isCached = false) {
  advisoryList.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "advisory-card";

    const title = document.createElement("h4");
    title.textContent = item.title || "PAGASA Bulletin";

    const description = document.createElement("p");
    description.textContent = (item.description || "")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .slice(0, 160) + "...";

    const link = document.createElement("a");
    link.href = item.link || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Read full advisory →";

    card.append(title, description, link);
    advisoryList.appendChild(card);
  });

  if (isCached) {
    const notice = document.createElement("p");
    notice.style.fontSize = "0.85em";
    notice.style.color = "#ffb300";
    notice.style.marginTop = "10px";
    notice.textContent = "⚠️ Displaying last saved advisories (offline mode)";
    advisoryList.prepend(notice);
  }

  pagasaSection.classList.remove("hidden");
}

// Initial fetch + auto-refresh every 30 minutes
fetchPagasaAdvisories();
setInterval(fetchPagasaAdvisories, 1800000);
