# ioconecc

Building a chat room application with real-time translation using the MEVN model.

Bilibili:https://www.bilibili.com/video/BV1So4y1h7Sb

Notion address:https://snapdragon-flier-b46.notion.site/ioconec-dca5cefe9ea64242b03a3c903a73f75f

youtube presentation address：https://www.youtube.com/watch?v=wb2s36XxlaU


 ------------------------------------------------------------------------------------------------------

```javascript
// '@ioconecc/ioconec/privateKeys/index.ts'
export const baseURL = "http://www.your server address.com";

// '@ioconecc/server/privateKeys/index.js'
module.exports.baseURL = "http://www.your server address.com";
module.exports.openAIKeys = "your apiKey";
module.exports.JWT_SECRET = "whatever you want";
```
-----------------------------------------RUN------------------------------------------
FRONTEND:
```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
-----------------------------------------RUN------------------------------------------

BACKEND:
```sh
npm install
```

```sh
nodemon server.js
```
