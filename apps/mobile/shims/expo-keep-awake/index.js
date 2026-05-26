const ExpoKeepAwakeTag = "ExpoKeepAwakeDefaultTag";

function useKeepAwake() {}

async function isAvailableAsync() {
  return false;
}

async function activateKeepAwake() {}

async function activateKeepAwakeAsync() {}

async function deactivateKeepAwake() {}

function addListener() {
  return { remove() {} };
}

module.exports = {
  ExpoKeepAwakeTag,
  useKeepAwake,
  isAvailableAsync,
  activateKeepAwake,
  activateKeepAwakeAsync,
  deactivateKeepAwake,
  addListener,
};
