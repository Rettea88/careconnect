(function () {
  "use strict";

  var toastTimer = null;

  function getPageName() {
    var path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1);
  }

  function showToast(message) {
    var toast = document.getElementById("appToast");

    if (!toast || !message) {
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  function setText(id, value) {
    var element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function formatLocation(elderlyName, room) {
    return String(elderlyName || "Mom").toUpperCase() + " · " + String(room || "Living Room").toUpperCase();
  }

  function renderHomeDashboard() {
    if (!window.CareConnectData) {
      return;
    }

    var state = window.CareConnectData.getFamilyState();
    var user = state.user || {};
    var elderly = state.elderly || {};
    var safety = state.safety || {};
    var activity = state.activity || {};
    var alerts = state.alerts || {};
    var safetyStatus = safety.safetyStatus || "Safe";
    var statusCard = document.querySelector(".status-card");
    var statusIcon = document.querySelector(".check-circle");

    if (statusCard) {
      statusCard.classList.remove("status-safe", "status-warning", "status-emergency");

      if (safetyStatus === "Emergency") {
        statusCard.classList.add("status-emergency");
      } else if (safetyStatus === "Warning") {
        statusCard.classList.add("status-warning");
      } else {
        statusCard.classList.add("status-safe");
      }
    }

    if (statusIcon) {
      statusIcon.textContent =
        safetyStatus === "Emergency" || safetyStatus === "Warning" ? "!" : "✓";
    }

    // Home is rendered from the local cache. Firebase sync updates that cache in auth.js.
    setText("homeUserName", user.userName || "Sarah Chen");
    setText("homeUserInitials", user.userInitials || "SC");
    setText("homeUnreadAlerts", alerts.unreadAlerts || 0);
    setText("statusLocation", formatLocation(elderly.elderlyName, elderly.room));
    setText("safetyStatus", safetyStatus);
    setText("safetyMessage", safety.safetyMessage || "All systems normal");
    setText("cameraStatus", safety.cameraStatus || "Camera Online");
    setText("batteryLevel", safety.battery || 98);
    setText("walkingStatus", activity.walkingStatus || "Walking");
    setText("walkingDetail", activity.walkingDetail || "2 min ago · steady pace");
    setText("alertsCardBadge", alerts.unreadAlerts || 0);
  }

  function handleDemoMessages() {
    document.querySelectorAll("[data-demo-message]").forEach(function (element) {
      element.addEventListener("click", function (event) {
        event.preventDefault();
        showToast(element.getAttribute("data-demo-message"));
      });
    });
  }

  function handleReservedPageLinks() {
    document.querySelectorAll("[data-page-link]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var message = link.getAttribute("data-fallback-message");

        // Member B/C/D pages are intentionally not built yet.
        event.preventDefault();
        showToast(message || "This page will be implemented by another member.");
      });
    });
  }

  window.CareConnectFamily = {
    renderHomeDashboard: renderHomeDashboard,
    showToast: showToast
  };

  document.addEventListener("DOMContentLoaded", function () {
    handleDemoMessages();
    handleReservedPageLinks();

    if (getPageName() === "home.html") {
      renderHomeDashboard();
    }
  });
})();
