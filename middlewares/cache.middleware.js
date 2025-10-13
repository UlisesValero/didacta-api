/* TODO: complicado */
// async function cacheMiddleware(req, res, next) {
//   const key = makeCacheKey(req);
//   const cached = await db.collection("cache").findOne({ _id: key });
  
//   if (cached) {
//     res.set(cached.response.headers || {});
//     res.status(cached.response.status).send(cached.response.body);
//     return;
//   }

//   // capture response
//   const originalSend = res.send.bind(res);
//   res.send = async (body) => {
//     await db.collection("cache").insertOne({
//       _id: key,
//       request: { headers: req.headers, body: req.body },
//       response: {
//         status: res.statusCode,
//         headers: res.getHeaders(),
//         body
//       },
//       createdAt: new Date()
//     });
//     return originalSend(body);
//   };

//   next();
// }
