const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'YazLab2';

const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('MongoDB bağlantısı başarılı.');

    const database = client.db(dbName);

    // Veritabanı işlemleri buraya eklenir...

  } finally {
    // Bağlantıyı kapat (uygun bir yerde yapmalısınız)
    // client.close();
  }
}


connectToDatabase();
module.exports = client;
