const generateAngles = (desiredAngleIncrements) => {
  const getAllPossibleAngles = typeof desiredAngleIncrements !== "number";
  const diameter = 256; // -128 to 127
  let angleToPoint = {};
  // Starting at the top-left corner of the square, move clockwise around the
  // square, incrementing the angle by angleIncrements each time.
  let startingAngle = 315;
  let y = -127.5;
  let x = -127.5;
  let angleIncrements; // For getting all angle resolutions.
  let xyIncrement; // How much to increment the x and y values by.

  if (getAllPossibleAngles) {
    angleIncrements = 360 / (diameter * 4); // 0.3515625 angle increments for all angles.
  } else {
    angleIncrements = desiredAngleIncrements;
  }

  xyIncrement = ((diameter * 4) / 360) * angleIncrements; // 1 for all, 42.667 for 15, 2.844 for 1.

  const increaseAngle = () => {
    startingAngle = (startingAngle + angleIncrements) % 360;
  };

  const scaleSquareToCircle = (x, y) => {
    const maxRange = 127.5;
    const magnitude = Math.sqrt(x * x + y * y);

    if (magnitude > maxRange) {
      const scaleFactor = maxRange / magnitude;
      x *= scaleFactor;
      y *= scaleFactor;
    }

    return { x: x, y: y };
  };

  const saveXYAnglePair = () => {
    let xCapped = Math.max(-127.5, x);
    xCapped = Math.min(127.5, x);
    let yCapped = Math.max(-127.5, y);
    yCapped = Math.min(127.5, y);

    let angleIndex;

    if (getAllPossibleAngles) {
      angleIndex = startingAngle.toFixed(1);
    } else {
      angleIndex = startingAngle;
    }

    let scaledXY = scaleSquareToCircle(xCapped, yCapped);

    // Need to re-adjust the x and y values to be -128 to 127
    // to match hardware (int8_t) instead of -127.5 to 127.5
    angleToPoint[angleIndex] = {
      x: scaledXY.x,
      y: scaledXY.y,
    };
  };

  while (x < 127.5) {
    saveXYAnglePair();
    increaseAngle();

    x += xyIncrement;
  }

  while (y < 127.5) {
    saveXYAnglePair();
    increaseAngle();

    y += xyIncrement;
  }

  while (x > -127.5) {
    saveXYAnglePair();
    increaseAngle();

    x -= xyIncrement;
  }

  while (y >= -127.5) {
    saveXYAnglePair();
    increaseAngle();

    y -= xyIncrement;
  }

  return angleToPoint;
};

export const angleToPoint = generateAngles(1);
