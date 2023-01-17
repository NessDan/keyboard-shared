export const saveProfileToJSON = (mappingsToDownload) => {
  // https://stackoverflow.com/a/34156339/231730
  function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  const fileName = prompt("Enter a file name to save the config to:");
  if (fileName) {
    download(
      JSON.stringify(mappingsToDownload),
      fileName + ".keyboardgg",
      "application/json"
    );
  } else {
    const date = new Date();
    const fileNameDate =
      [date.getMonth() + 1, date.getDate(), date.getFullYear()].join("-") +
      " " +
      [date.getHours(), date.getMinutes(), date.getSeconds()].join("-");
    download(
      JSON.stringify(mappingsToDownload),
      fileNameDate.toLocaleString() + ".keyboardgg",
      "application/json"
    );
  }
};
