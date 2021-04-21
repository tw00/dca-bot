const levelup = require("levelup");
const leveldown = require("leveldown");

// TODO: import
class DB {
  constructor(name) {
    const db = levelup(leveldown(`./db/${name}`));
    this.db = db;
  }

  read(from, to, asArray) {
    const result = asArray ? [] : {};
    const options = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };

    return new Promise((resolve, reject) => {
      this.db
        .createReadStream(options)
        .on("data", (raw) => {
          const data = JSON.parse(raw.value.toString());
          const key = raw.key.toString();
          if (asArray) {
            result.push(data);
          } else {
            result[key] = data;
          }
        })
        .on("error", (err) => {
          reject(err);
        })
        .on("end", () => {
          resolve(result);
        });
    });
  }
}

(async () => {
  // const db = new DB("ETH-USD");
  const db = new DB("BTC-USD");
  const foobar = await db.read(null, null, true);
  console.log(foobar.map((x) => [x.time, x.price]));
})();
