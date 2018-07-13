const TurndownService = require('turndown');
const turndownService = new TurndownService({});

const toMarkdown = turndownService.turndown.bind(turndownService);

module.exports = toMarkdown;