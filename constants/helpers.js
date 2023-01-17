export const humanReadableEventKeyCode = (eventCode) => {
  if (eventCode.startsWith("Digit")) {
    return eventCode.slice(-1);
  } else if (eventCode.startsWith("Numpad")) {
    if (eventCode.length === 7) {
      // Catches for Numpad0 - Numpad9
      return "Num " + eventCode.slice(-1);
    }
  } else if (eventCode.startsWith("Key")) {
    return eventCode.slice(-1);
  } else if (eventCode.startsWith("Arrow")) {
    return eventCode.slice(5);
  }

  switch (eventCode) {
    case "BracketLeft":
      return "[";
    case "BracketRight":
      return "]";
    case "Backslash":
      return "\\";
    case "Backquote":
      return "`";
    case "Semicolon":
      return ";";
    case "Quote":
      return "'";
    case "Comma":
      return ",";
    case "Period":
      return ".";
    case "Slash":
      return "/";
    case "Minus":
      return "-";
    case "Equal":
      return "=";
    case "Escape":
      return "Esc";
    case "ControlLeft":
      return "Left Ctrl";
    case "ControlRight":
      return "Right Ctrl";
    case "ShiftLeft":
      return "Left Shift";
    case "ShiftRight":
      return "Right Shift";
    case "AltLeft":
      return "Left Alt";
    case "AltRight":
      return "Right Alt";
    case "OSLeft":
      return "Left OS";
    case "MetaLeft":
      return "Left Meta";
    case "OSRight":
      return "Right OS";
    case "MetaRight":
      return "Right Meta";
    case "CapsLock":
      return "Caps Lock";
    case "NumLock":
      return "Num Lock";
    case "ScrollLock":
      return "Scroll Lock";
    case "ContextMenu":
      return "Context Menu";
    case "Insert":
      return "Ins";
    case "Delete":
      return "Del";
    case "PageUp":
      return "PgUp";
    case "PageDown":
      return "PgDn";
    case "ArrowUp":
      return "Up";
    case "ArrowDown":
      return "Down";
    case "ArrowLeft":
      return "Left";
    case "ArrowRight":
      return "Right";
    case "PrintScreen":
      return "PrtSc";
    case "Pause":
      return "Pause/Break";
    case "NumpadDecimal":
      return "Num .";
    case "NumpadDivide":
      return "Num /";
    case "NumpadMultiply":
      return "Num *";
    case "NumpadSubtract":
      return "Num -";
    case "NumpadAdd":
      return "Num +";
    case "NumpadEnter":
      return "Num Enter";
    case "NumpadEqual":
      return "Num =";
    case "NumpadComma":
      return "Num ,";
    case "NumpadParenLeft":
      return "Num (";
    case "NumpadParenRight":
      return "Num )";
    case "NumpadBackspace":
      return "Num Backspace";
    case "NumpadMemoryStore":
      return "Num MS";
    case "NumpadMemoryRecall":
      return "Num MR";
    case "NumpadMemoryClear":
      return "Num MC";
    case "NumpadMemoryAdd":
      return "Num M+";
    case "NumpadMemorySubtract":
      return "Num M-";
    case "NumpadClear":
      return "Num Clear";
    case "NumpadClearEntry":
      return "Num CE";
    case "NumpadBinary":
      return "Num Bin";
    case "NumpadOctal":
      return "Num Oct";
    case "NumpadHexadecimal":
      return "Num Hex";
    case "NumpadExponent":
      return "Num Exp";
    case "NumpadSquareRoot":
      return "Num Sqrt";
    case "NumpadPercent":
      return "Num %";
    case "NumpadPlusMinus":
      return "Num +/-";
    case "VolumeUp":
    case "AudioVolumeUp":
      return "Volume Up";
    case "VolumeDown":
    case "AudioVolumeDown":
      return "Volume Down";
    case "VolumeMute":
    case "AudioVolumeMute":
      return "Volume Mute";
    case "MediaTrackNext":
      return "Next Track";
    case "MediaTrackPrevious":
      return "Previous Track";
    case "MediaPlayPause":
      return "Play/Pause";
    case "MediaStop":
      return "Stop";
    case "MediaSelect":
      return "Media Select";
    case "LaunchMail":
      return "Launch Mail";
    case "LaunchApp2":
      return "Launch App 2";
    case "LaunchApp1":
      return "Launch App 1";
    case "BrowserSearch":
      return "Browser Search";
    case "BrowserHome":
      return "Browser Home";
    case "BrowserBack":
      return "Browser Back";
    case "BrowserForward":
      return "Browser Forward";
    case "BrowserStop":
      return "Browser Stop";
    case "BrowserRefresh":
      return "Browser Refresh";
    case "BrowserFavorites":
      return "Browser Favorites";
    case "IntlBackslash":
      return "Intl \\";
    case "IntlRo":
      return "Intl Ro";
    case "IntlYen":
      return "Intl Yen";
    case "IntlHash":
      return "Intl Hash";
    case "IntlUnderscore":
      return "Intl Underscore";
    case "IntlPipe":
      return "Intl Pipe";
    case "IntlTilde":
      return "Intl Tilde";
    case "IntlBraceLeft":
      return "Intl Brace Left";
    case "IntlBraceRight":
      return "Intl Brace Right";

    default:
      return eventCode;
  }
};
