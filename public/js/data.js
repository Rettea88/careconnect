(function () {
  "use strict";

  var STORAGE_KEY = "careconnect_family_state";

  // Member A owns the family home demo state. Other members can extend these groups later.
  var defaultFamilyState = {
    user: {
      userName: "Sarah Chen",
      userInitials: "SC"
    },
    elderly: {
      elderlyName: "Mom",
      room: "Living Room"
    },
    safety: {
      safetyStatus: "Safe",
      safetyMessage: "All systems normal",
      cameraStatus: "Camera Online",
      battery: 98
    },
    activity: {
      walkingStatus: "Walking",
      walkingDetail: "2 min ago · steady pace"
    },
    alerts: {
      unreadAlerts: 2
    }
  };

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function mergeObjects(base, update) {
    var result = cloneData(base);

    Object.keys(update || {}).forEach(function (key) {
      if (isObject(result[key]) && isObject(update[key])) {
        result[key] = mergeObjects(result[key], update[key]);
      } else {
        result[key] = update[key];
      }
    });

    return result;
  }

  function readStoredState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStoredState(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function initFamilyState() {
    var savedState = readStoredState();
    // Merge with defaults so new fields still appear after older localStorage data exists.
    var completeState = savedState ? mergeObjects(defaultFamilyState, savedState) : cloneData(defaultFamilyState);

    writeStoredState(completeState);
    return completeState;
  }

  function getFamilyState() {
    return initFamilyState();
  }

  function setFamilyState(data) {
    var currentState = getFamilyState();
    // setFamilyState accepts partial updates, for example { safety: { battery: 80 } }.
    var nextState = mergeObjects(currentState, data || {});

    writeStoredState(nextState);
    return nextState;
  }

  function setFamilyStateFromRemote(data) {
    // Firebase remains the remote source, but this keeps old LocalStorage-based screens working.
    var nextState = mergeObjects(defaultFamilyState, data || {});

    writeStoredState(nextState);
    return nextState;
  }

  function resetFamilyState() {
    var nextState = cloneData(defaultFamilyState);

    writeStoredState(nextState);
    return nextState;
  }

  window.CareConnectData = {
    defaultFamilyState: cloneData(defaultFamilyState),
    getFamilyState: getFamilyState,
    setFamilyState: setFamilyState,
    setFamilyStateFromRemote: setFamilyStateFromRemote,
    resetFamilyState: resetFamilyState
  };
})();
