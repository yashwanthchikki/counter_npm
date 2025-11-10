import counter from "./src/index.js";

counter.setup("views", 0, 1, 5);
counter.setup("likes", 10, 2, 3);

counter.views();
counter.views();
counter.likes();

console.log("Views:", counter.views.value);
console.log("Likes:", counter.likes.value);

counter.flushAll();
