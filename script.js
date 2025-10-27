// Close alert banner
function closeBanner() {
  document.getElementById("alert-banner").style.display = "none";
}

// Top Alert Banner with Geolocation 
const alertBanner = document.getElementById("alert-banner");
const alertMessage = document.getElementById("alert-message");
const closeAlert = document.getElementById("close-alert");

const API_KEY = "974e78374f2d179e43b29861b1b95e4e";

async function fetchWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();

    if (!data || !data.weather || !data.main) {
      alertBanner.classList.add("hidden");
      return;
    }

    const city = data.name || "your area";
    const condition = data.weather[0].main.toLowerCase();
    const description = data.weather[0].description;
    const temp = data.main.temp;
    const wind = data.wind.speed;

    let alertText = "";
    let bgColor = "";

    // Determine alert level + color
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

    // Display the alert banner
    alertBanner.style.background = bgColor;
    alertMessage.textContent = alertText;

    // Update Area Risk Level dynamically 
    const riskLevelEl = document.querySelector(".risk-level strong");
    const riskDot = document.querySelector(".dot");

    if (condition.includes("storm") || wind > 40) {
      riskLevelEl.textContent = "High Risk";
      riskDot.style.backgroundColor = "#dc3545"; // red
    } else if (condition.includes("rain")) {
      riskLevelEl.textContent = "Moderate Risk";
      riskDot.style.backgroundColor = "#fcd116"; // yellow
    } else {
      riskLevelEl.textContent = "Low Risk";
      riskDot.style.backgroundColor = "#28a745"; // green
    }

    alertBanner.classList.remove("hidden");
  } catch (error) {
    console.error("Weather fetch failed:", error);
    alertBanner.classList.add("hidden");
  }
}

// Request geolocation access
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.warn("Geolocation blocked. Defaulting to Manila.");
        fetchWeatherByCoords(14.5995, 120.9842); // Manila fallback
      }
    );
  } else {
    console.warn("Geolocation not supported. Defaulting to Manila.");
    fetchWeatherByCoords(14.5995, 120.9842);
  }
}

// Allow user to close the banner 
closeAlert.addEventListener("click", () => {
  alertBanner.classList.add("hidden");
});

// Fetch immediately and refresh every 10 mins
getUserLocation();
setInterval(getUserLocation, 600000);

// PAGASA Advisories Integration 
const pagasaSection = document.getElementById("pagasa-advisories");
const advisoryList = document.getElementById("advisory-list");

const PAGASA_RSS_URL = "https://pubfiles.pagasa.dost.gov.ph/rss.xml";
const RSS2JSON = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(PAGASA_RSS_URL)}`;

async function fetchPagasaAdvisories() {
  try {
    const response = await fetch(RSS2JSON);
    const data = await response.json();

    advisoryList.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      advisoryList.innerHTML = "<p>No active advisories at this time.</p>";
      pagasaSection.classList.remove("hidden");
      return;
    }

    data.items.slice(0, 3).forEach((item) => {
      const card = document.createElement("div");
      card.classList.add("advisory-card");

      const title = document.createElement("h4");
      title.textContent = item.title;

      const description = document.createElement("p");
      description.innerHTML = item.description
        .replace(/<\/?[^>]+(>|$)/g, "")
        .slice(0, 150) + "...";

      const link = document.createElement("a");
      link.href = item.link;
      link.target = "_blank";
      link.textContent = "Read full advisory →";

      card.appendChild(title);
      card.appendChild(description);
      card.appendChild(link);
      advisoryList.appendChild(card);
    });

    pagasaSection.classList.remove("hidden");
  } catch (error) {
    console.error("Failed to load PAGASA feed:", error);
    advisoryList.innerHTML = "<p>Unable to fetch advisories. Please try again later.</p>";
    pagasaSection.classList.remove("hidden");
  }
}

fetchPagasaAdvisories();
setInterval(fetchPagasaAdvisories, 1800000); // refresh every 30 minutes

// Functional Emergency Contact Buttons 
document.querySelectorAll(".contact").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const href = e.target.getAttribute("href");
    if (href && href.startsWith("tel:")) {
      window.location.href = href; // open phone dialer
    }
  });
});

// Emergency Contacts Modal 
const modal = document.getElementById("contacts-modal");
const closeModal = document.querySelector(".close-modal");
const viewAllContactsBtn = document.querySelector(".tertiary");

// Open modal when "View All Contacts" is clicked
viewAllContactsBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

// Close modal when X button clicked
closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Close modal when clicking outside the modal box
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});
