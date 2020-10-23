# CodeBoard

A code board powered by Node.js, allows multiple students to watch teacher’s programming process on their own devices.

The [project report](https://github.com/liao-victor/CodeBoard/blob/main/codeboard_report.pdf) describes how this website works in detail.

## Tips of installation
* [Node.js](https://nodejs.org/en/download/package-manager/) and [MongoDB](https://docs.mongodb.com/manual/administration/install-community/) should be installed in advance. 
* HTTP server runs on port `3000` by default. You may change it in `bin/www`([here](/bin/www.js#L15)).
* [Google reCAPTCHA](https://developers.google.com/recaptcha/docs/invisible) is integrated in this software. Please use the global replace function of your IDE to reaplce `YOUR_RECAPTCHA_PUBLIC_KEY` with your recaptcha public key and `YOUR_RECAPTCHA_PRIVATE_KEY` with your recaptcha private key.
* Please replace the `YOUR_INVITE_CODE`([here](/routes/index.js#L11)) to any string you want. Only the user input the correct invite code can sign up.
* To make the generation of share link, QR code and password retrieve email correct, please use the global replace function of your IDE to reaplce `YOUR_WEBSITE_LINK` with your website link (e.g. `localhost:3000`).
