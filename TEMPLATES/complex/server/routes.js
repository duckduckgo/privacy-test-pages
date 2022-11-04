/* If you are adding new routes that your test depends on and those routes are not general purpose / shared, then please extract them to a separate file like this one. */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    // do your thing
});

module.exports = router;

/* Remember to import your routes in the main server.js file. You will find examples of how to do it in that file. */
