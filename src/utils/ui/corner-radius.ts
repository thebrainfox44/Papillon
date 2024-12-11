import * as Device from "expo-device";

const defaultRadius = 5.0;

const radiuses = [
  {
    devices: [
      "iPhone X",
      "iPhone Xs",
      "iPhone Xs Max",
      "iPhone 11 Pro",
      "iPhone 11 Pro Max",
    ],
    radius: 39.0,
  },
  {
    devices: ["iPhone Xr", "iPhone 11"],
    radius: 41.5,
  },
  {
    devices: ["iPhone 12 mini", "iPhone 13 mini"],
    radius: 44.0,
  },
  {
    devices: [
      "iPhone 12",
      "iPhone 12 Pro",
      "iPhone 13 Pro",
      "iPhone 14",
    ],
    radius: 47.33,
  },
  {
    devices: [
      "iPhone 12 Pro Max",
      "iPhone 13 Pro Max",
      "iPhone 14 Plus",
    ],
    radius: 53.33,
  },
  {
    devices: [
      "iPhone 14 Pro",
      "iPhone 14 Pro Max",
      "iPhone 15",
      "iPhone 15 Plus",
      "iPhone 15 Pro",
      "iPhone 15 Pro Max",
      "iPhone 16",
      "iPhone 16 Plus",
    ],
    radius: 55.0,
  },
  {
    devices: [
      "iPhone 16 Pro",
      "iPhone 16 Pro Max",
    ],
    radius: 62.0,
  },
  {
    devices: [
      "iPad Air",
      "iPad Pro 11-inch",
      "iPad Pro 12.9-inch",
    ],
    radius: 18.0,
  },
  {
    devices: [
      "pixel 3",
    ],
    radius: 20.0,
  }
];

const getCorners = (): number => {
  let modelName = Device.modelName;
  console.log("model name", modelName);

  if (!modelName || modelName.toLowerCase().includes("simulator")) {
    modelName = Device.deviceName?.toLowerCase() || null;
  }

  if (!modelName) return defaultRadius;

  let device = modelName.toLowerCase();

  // Handle new iPhone models (e.g., iPhone17,1)
  const iphoneMatch = device.match(/iphone(\d+),\d+/);
  if (iphoneMatch) {
    const version = parseInt(iphoneMatch[1], 10);

    if (version >= 10 && version <= 11) {
      return 39.0; // iPhone X, Xs, Xs Max, 11 Pro, 11 Pro Max
    } else if (version === 12) {
      return 41.5; // iPhone Xr, 11
    } else if (version === 13) {
      return 44.0; // iPhone 12 mini, 13 mini
    } else if (version === 14 || version === 15) {
      return 47.33; // iPhone 12, 12 Pro, 13 Pro, 14
    } else if (version === 16) {
      return 53.33; // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
    } else if (version >= 17 && version <= 18) {
      return 55.0; // iPhone 14 Pro, 15, 16, etc.
    } else if (version >= 19) {
      return 62.0; // iPhone 16 Pro, 16 Pro Max & more
    }
  }

  // Handle old-style device names
  const matchedRadius = radiuses.find((entry) =>
    entry.devices.some((name) => device.includes(name.toLowerCase()))
  );

  return matchedRadius ? matchedRadius.radius : defaultRadius;
};

export default getCorners;
