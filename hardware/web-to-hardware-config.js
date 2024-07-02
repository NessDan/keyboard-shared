import { keyEventCodeToC } from "../constants/enums.js";
import { angleToPoint } from "../constants/angles.js";
import { connectAndSendDataToAdapter } from "./device.js";

let hardwareConfigs = [];

// https://stackoverflow.com/a/20871714/231730
function generateAllPossibleArrays(inputArr) {
  var results = [];
  var allResults = [];

  function permute(arr, memo) {
    var cur,
      memo = memo || [];

    for (var i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }

    return results;
  }

  function convertArrayOfPermsToStrings(arrayPerms) {
    let allPremutations = arrayPerms[0];

    for (const resultIdx in arrayPerms) {
      const result = arrayPerms[resultIdx];
      if (resultIdx === "0") {
        continue;
      }
      let newTotal = [];
      for (const oldTotalIdx in allPremutations) {
        const oldTotal = allPremutations[oldTotalIdx];
        for (const permIdx in result) {
          const perm = result[permIdx];
          newTotal.push(oldTotal.concat(perm));
        }
      }
      allPremutations = newTotal;
    }

    return allPremutations;
  }

  inputArr.forEach((arr) => {
    permute(arr);
    allResults.push(results);
    results = [];
  });

  return convertArrayOfPermsToStrings(allResults);
}

const generateHardwareConfig = (hardwareConfigs, mapping) => {
  let allPossibleKeyOrders;

  // https://recorder.google.com/share/fdd2f2db-99c6-4416-82d4-c233ff51af25
  // Keep calling this function with an array that we keep shrinking every recursive
  // call, e.g. ["W", "D"]. We only ever look at the first item. Next call would
  // be ["D"] and when we hit the last key, we apply the action onto that config.
  const buildTree = (
    orderedKeys,
    webMapping,
    hardwareConfigs,
    currentDepth
  ) => {
    const keyWeCareAbout = orderedKeys[0];
    const actualKeyName = keyEventCodeToC[keyWeCareAbout];
    const lastKey = orderedKeys.length === 1;
    // Go through the hardware config, see if we have already made a
    // mapping for the key we're searching through.
    let matchedMappingIdx = hardwareConfigs.findIndex(
      (hardwareConfig) => hardwareConfig.key == actualKeyName
    );
    let matchedMapping;

    // We didn't find the mapping so we make our own!
    if (matchedMappingIdx == -1) {
      // Push the new object in and take note of the size of the array so
      // we can then refernce the new element.

      // This will hold the new length of the array
      const newLengthOfConfig = hardwareConfigs.push({
        key: actualKeyName,
        priority: currentDepth,
      });

      // Set the mapping by taking the new length and subtracting one.
      matchedMapping = hardwareConfigs[newLengthOfConfig - 1];
    } else {
      matchedMapping = hardwareConfigs[matchedMappingIdx];
    }

    // As we build the tree up, sometimes in-between keys don't have actions,
    // e.g.:
    // "W" -> "D" -> "Q" = Right
    // "W" = Up
    // When pressing "W" -> "D", there's no action so the left-stick goes null.
    // When in reality, we'd expect it to inherit the previous action ("Up").
    // Therefore, we need to set the "inherit" flag to true so that we
    // can inherit the previous action as we work our way up to the top.
    if (!matchedMapping.actions) {
      if (currentDepth > 0) {
        // Can't inherit from nothing!
        // We'll have to remove this later on if we add an action.
        matchedMapping.inherit = true;
      }
    }

    // We've still got some keys to go!
    if (!lastKey) {
      // Since we may or may not be building on a previous mapping tree,
      // check to see if we made a followed_by yet.
      if (!matchedMapping.followed_by) {
        matchedMapping.followed_by = [];
      }

      const orderedKeysWithoutCurrentIteration = orderedKeys.slice(1);
      const nextLevelOfTree = matchedMapping.followed_by;
      const nextDepth = currentDepth + 1;

      buildTree(
        orderedKeysWithoutCurrentIteration,
        webMapping,
        nextLevelOfTree,
        nextDepth
      );
    } else {
      // We're done and at the end! Apply the action here!
      const hardwareAction = convertWebActionToHardwareAction(
        webMapping.action
      );
      matchedMapping.actions = [hardwareAction];

      if (matchedMapping.inherit) {
        delete matchedMapping.inherit;
      }
    }
  };

  // Create an array of arrays of all possible combinations.
  allPossibleKeyOrders = generateAllPossibleArrays(mapping.keys);

  allPossibleKeyOrders.forEach((mappingKeyCombo) => {
    buildTree(mappingKeyCombo, mapping, hardwareConfigs, 0);
  });
};

const angleDistanceConverter = (angle, distance) => {
  // Takes an angle in degrees (e.g. 0, 90, 180, 270) and a distance (0 - 100) and
  // returns the x and y values of the controller stick.
  let x = (angleToPoint[angle].x * distance) / 100;
  let y = (angleToPoint[angle].y * distance) / 100;

  // Because the controller uses values 0 - 255 on hardware (int8_t),
  // we need to adjust the x and y values.
  x += 127.5;
  y += 127.5;

  x = Math.round(x);
  y = Math.round(y);

  return { x, y };
};

const convertWebActionToHardwareAction = (action) => {
  switch (action.type) {
    case "lstick":
      return {
        key: "LANALOG",
        type: "ABSCOORDS",
        value: angleDistanceConverter(action.angle, action.stickDistance),
      };
    case "rstick":
      return {
        key: "RANALOG",
        type: "ABSCOORDS",
        value: angleDistanceConverter(action.angle, action.stickDistance),
      };
    case "button":
      return {
        key: action.button,
        type: "BOOLEAN",
        value: true,
      };
    case "dpad":
      return {
        key: "DPAD",
        type: "UINT8",
        value: action.dpad,
      };
    default:
      break;
  }
};

export const mappingsToBinary = (mappings, profileNumber) => {
  console.log("mappingsToBinary", mappings);

  let lastProfileSize = 0;

  mappings.forEach((profile) => {
    profile.configs.forEach((mapping) => {
      generateHardwareConfig(hardwareConfigs, mapping);
    });

    const hardwareProfile = {
      ...profile,
      configs: hardwareConfigs,
    };
    console.log("hardwareProfile", hardwareProfile);

    window.buildEdgeguardConfigBlob(JSON.stringify(hardwareProfile));

    const dataToFlash = dataBlob.map((strByte) => Number(strByte));

    console.log("dataBlob", dataToFlash);

    connectAndSendDataToAdapter(dataToFlash, profileNumber);

    hardwareConfigs = [];

    lastProfileSize = dataToFlash.length;
  });

  return lastProfileSize;
};
