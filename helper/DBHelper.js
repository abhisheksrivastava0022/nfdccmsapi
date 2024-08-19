const { MongoClient, ObjectId } = require("mongodb");

class DBHelper{  

  #__connection;
  #__client;

  constructor(connectionUrl, dbName){
    this.connectionUrl = connectionUrl;
    this.dbName = dbName;
  }
  
  closeConnection(){
    try{
    //  Logger.info(`Closing connection to DB: ${this.connectionUrl}, ${this.dbName}`)
      this.#__client.close()
      this.#__client = null
    }
    catch(err){
    //  Logger.error(err.message, err)
    }
  }
  
  getConnection(){
    let instance = this
    return new Promise(function (resolve, reject) {
      if (instance.#__connection) {
        return resolve(instance.#__connection);
      }

      MongoClient.connect(instance.connectionUrl, {}, function (err, client) {
        if (err) {
         // Logger.error(`Unable to connect to DB: ${instance.connectionUrl}, ${instance.dbName}`, err)
         // return reject(err);
        }

        instance.#__connection = client.db(instance.dbName);

        if (!instance.#__connection) {
          //Logger.error(`DB is not initialized: ${instance.connectionUrl}, ${instance.dbName}`, err)
          // return reject('DB is not initialized')
        }

        instance.#__client = client

        return resolve(instance.#__connection);
      });
    })
  }
  
  async getCollection(collectionName) {
    let result = 0;
    try {
      let db = await this.getConnection()
      return db.collection(collectionName);
    } catch (err) {
      Logger.error(`Unable to get collection:${collectionName} in '${__filename}'  : ${err.message}`, err);
      return false;
    }
  }
}


module.exports = DBHelper