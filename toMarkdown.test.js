const toMarkdown = require("./toMarkdown");

const testHTML = 'rockstar <a href="https://twitter.com/MacMiller?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor" target="_blank">LINK</a>';
test("Should parse links", () => {
  expect(toMarkdown(testHTML)).toBe("rockstar [LINK](https://twitter.com/MacMiller?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor)")
});

const spanHTML = 'test2 <span class="subtitle">Test3</span> test4';
test("Should remove spans", () => {
  expect(toMarkdown(spanHTML)).toBe("test2 Test3 test4");
});