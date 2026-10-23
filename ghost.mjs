import config from "./config.js";
import GhostAdminAPI from "@tryghost/admin-api";

const adminApi = new GhostAdminAPI({
  url: "https://citationneeded.news",
  version: "v5.75",
  key: config.ghostAdminApi,
});

// Map Substack numerical IDs to Ghost post URLs
const postIdMap = {};

const posts = await adminApi.posts.browse({ format: "html" });
for (let post of posts) {
  let lexical = post.lexical;
  if (typeof lexical !== "string") {
    lexical = JSON.stringify(lexical);
  }
  if (lexical.includes("newsletter.mollywhite.net")) {
    console.log(lexical);
    break;
  }
}
