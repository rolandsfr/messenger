function replaceWithEmoji(msg) {
  let resMsg = msg;
  const emojis = {
    "<3": "❤️",
    ":)": "🙂",
    ":(": "😔",
    ":D": "😄",
    ":p": "😛",
    meow: "🐱",
  };

  let codes = Object.keys(emojis);

  let changed = false;

  for (let i = 0; i < resMsg.length; i++) {
    codes.forEach((code) => {
      changed = false;
      let codeLength = code.length;
      let index = resMsg.indexOf(code);

      if (index === -1) return;
      changed = true;

      if (changed)
        resMsg =
          resMsg.slice(0, index) +
          emojis[code] +
          resMsg.slice(index + codeLength);
    });
  }

  return resMsg || msg;
}

export default replaceWithEmoji;
