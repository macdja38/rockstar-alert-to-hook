const Eris = require("eris");
const eris = new Eris("", {restMode: true});

const util = require("util");

const fs = require("fs");

const toMarkdown = require("to-markdown");

const writeFile = util.promisify(fs.writeFile);
const access = util.promisify(fs.access);
const readFile = util.promisify(fs.readFile);

const fetch = require("node-fetch");

const currentPostIDPath = "./current-post.json";
const config = require("./config.js");
const webhooks = config.webhooks;

let currentPostID = false;

function fetchNewsWire() {
  return fetch('https://www.rockstargames.com/newswire/tags.json?page=0')
    .then(function (res) {
      if (res.status === 200) {
        return res.json();
      } else {
        throw new Error(res.statusText)
      }
    });
}

/**
 * Writes the current post's id to a file
 * @param {number} id
 */
function writeCurrentPostId(id) {
  return writeFile(currentPostIDPath, JSON.stringify({currentPostID: id}));
}

/**
 * fetches the current post id from the newswire
 */
function fetchCurrentPostID(data) {
  return fetchNewsWire().then((data) => {
    return data.posts[0].id;
  })
}

function checkCurrentPostId(data) {
  if (currentPostID === false) {
    return access(currentPostIDPath, fs.constants.F_OK).then(() => {
      return readFile(currentPostIDPath).then((string) => {
        let data = JSON.parse(string);
        if (data.hasOwnProperty("currentPostID") && typeof data.currentPostID === "number") {
          currentPostID = data.currentPostID;
          return currentPostID;
        } else {
          throw new Error("data did not have post ID")
        }
      })
    }).catch(error => {
      console.log(error);
      if (data) return data.posts[0].id;
      return fetchCurrentPostID().then((postID) => {
        writeCurrentPostId(postID);
        currentPostID = postID;
        return currentPostID;
      })
    })
  } else {
    return Promise.resolve(currentPostID);
  }
}

async function checkTask() {
  let data = await fetchNewsWire();
  let currentID = await checkCurrentPostId(data);
  if (currentID < data.posts[0].id) {
    currentPostID = data.posts[0].id;
    writeCurrentPostId(currentPostID);
    // we got new posts, do something with them
    const newPosts = data.posts.filter(post => post.id > currentID);

    webhooks.forEach(webhook => {
      console.log("new Posts", newPosts)
      const embeds = newPosts.filter(post => {
        let postTags = post["primary_tags"].map(tag => tag.name.toLowerCase());
        for (let tag of webhook.tags) {
          console.log(tag, postTags);
          if (postTags.includes(tag)) return true;
        }
      }).map(postToEmbed);
      console.log(embeds);
      if (embeds.length > 0) {
        eris.executeWebhook(webhook.id, webhook.token, {embeds}).catch(console.error);
      }
    });
  }
}

function postToEmbed(post) {
  const embed = {
    title: post.title,
    url: post.link,
    description: toMarkdown(post.blurb_short),
  };
  if (post.hasOwnProperty("preview_images_parsed")) {
    const previewImages = post["preview_images_parsed"];
    const possiblePostImage = previewImages.featured || previewImages.large || previewImages.small;
    if (possiblePostImage) {
      embed.image = {url: possiblePostImage.src};
    }
  }
  return embed;
}

setInterval(checkTask, config.fetchInterval);