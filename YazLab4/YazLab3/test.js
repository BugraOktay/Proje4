const client = require("./db");
const puppeteer = require('puppeteer');
const db = client.db("YazLab2");
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.set("view engine", "ejs")
app.use(express.static('public'));
// /////////////////Get-Post////////////////////////
app.use(bodyParser.urlencoded({ extended: true }));
var adlar;
app.post('/ara', (req, res) => {
  adlar = [];
  (async () => {
    const browser = await puppeteer.launch({
      headless: false
    });
    const page = await browser.newPage();

    await page.goto('https://dergipark.org.tr/tr/');
    await page.type('input[name="q"]', req.body.arama);
    await page.keyboard.press('Enter');


    for (let i = 1; i < 11; i++) {

      var s = `#search .article-cards .article-card:nth-child(${i}) a`;
      await page.waitForSelector(s);
      await page.click(s);

      
      var id = await isimkaydet(page, adlar, req.body.arama);

      if (id != -1 && id != -2) {
        await anahtarkelime(page, id);
        await ozet(page, id);
        await yazar(page, id);
        await referans(page, id);
        var s1 = `#article-toolbar a`;
        await page.waitForSelector(s1);
        await page.click(s1);

        if (id != -1 && id != -2) {
          const update = { $set: { Url: page.url() } };
          const result = await db.collection("Ogrenci").updateOne({ _id: id }, update);
        }

        await downloadPdf(page.url(), `C:/Users/bugra/OneDrive/Masaüstü/pdfs/${id}.pdf`);
        await page.goBack();
      }




      await page.goBack();
     


    }

    // Tarayıcıyı kapatın
    await browser.close();

    results = adlar;
    await res.render("app", { results });
  })();

});
app.get('/app', (req, res) => {
  results = "";
  res.render("app", { results });
});
app.get('/detay', async (req, res) => {
  try {
    const documents = await db.collection("Ogrenci").find({ Ad: adlar[req.query.id] }).toArray();
    res.render("detay", { documents, Ad: adlar[req.query.id] });
  } catch (err) {
    console.error('Belge çekme hatası:', err);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/all', async (req, res) => {
  try {
    adlar=[];
    const result = await db.collection("Ogrenci").find({}, { projection: { Ad: 1, _id: 1 } }).toArray();
    var count=Object.keys(result).length;
    for (let i = 0; i< count; i++) {
      adlar.push(result[i].Ad);
    }
    var sonuc = [count,result,null];
    res.render("all", { sonuc });
  } catch (err) {
    console.error('Belgeler alınırken bir hata oluştu:', err);
  }
  
});
app.post('/all', async (req, res) => {
  try {
    var adlar1=adlar;
    var tarih=[];
    var tarih2=[];
    var adlar2=[];
    var result;
   
    if(req.body.anahtar!=""){
      result=await veri_cek("ArananKelime",req.body.anahtar);
      
    }
    else if(req.body.id!=""){
      result=await veri_cek("_id",parseInt(req.body.id));
      
    }
    else if(req.body.tarih!=""){
      result=await veri_cek(['Yayımlanma Tarihi'],req.body.tarih);
      
    }
    else if(req.body.ad!=""){
      result=await veri_cek("Ad",req.body.ad);
      
    }
    else if(req.body.yazar!=""){
      result=await veri_cek("Yazarlar",req.body.yazar);
      
    }
    else if(req.body.dil!=""){
      result=await veri_cek(['Birincil Dil'],req.body.dil);
      
    }
    else if(req.body.url!=""){
      result=await veri_cek("Url",req.body.url);
      
    }
    else{
      result = await db.collection("Ogrenci").find({}, { projection: { Ad: 1, _id: 1, ['Yayımlanma Tarihi']: 1 } }).toArray();
    }
    
    var count=Object.keys(result).length;
    
    for (let i = 0; i < count; i++) {
      tarih.push(formatTarih(result[i]['Yayımlanma Tarihi']));
    }
    tarih.sort();//eskiden yeniye sırala
    
    for (let i = 0; i < count; i++) {
      tarih2.push(geriformatTarih(tarih[i]));
    }
    for (let i = 0; i< count; i++) {
      adlar1.push(result[i].Ad);
    }
    for (let i= 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        if(result[j]['Yayımlanma Tarihi']==tarih2[i]){
          adlar2.push(result[j]._id);
        } }}
   

    var sonuc = [count,result,req.body.sec,diziyiSifirla(adlar2)];
    res.render("all", { sonuc });
  } catch (err) {
    console.error('Belgeler alınırken bir hata oluştu:', err);
  }
  
});






/////////////////////////////////PDF İNDİR////////////////////////////////////////////


const axios = require('axios');
const fs = require('fs');
const { TIMEOUT } = require("dns");

async function downloadPdf(url, outputPath) {
  try {
    const response = await axios.get(url, {

      responseType: 'arraybuffer', // PDF dosyası için arraybuffer tipini kullanın
    });

    fs.writeFileSync(outputPath, Buffer.from(response.data));
    console.log('PDF başarıyla indirildi.');

  } catch (error) {
    console.error('Hata: PDF indirme işlemi başarısız oldu.', error);
  }
  await new Promise(resolve => setTimeout(resolve, 5000));
}

/////////////////////////////////DB'e Ad kaydetme////////////////////////////////////////////
async function isimkaydet(page, adlar, kelime) {
  await page.waitForSelector('.article-title', { timeout: 15000 });
  
  // Sayfa üzerinde dolaşarak elementi bulun
  const elementText = await page.evaluate(() => {
    const element = document.querySelector('.article-title');
    return element ? element.textContent.trim() : null;
  });

  if (elementText) {
    console.log('Seçilen Elementin Metni:', elementText);
    adlar.push(elementText);
    var Arr = await db.collection("Ogrenci").find({ Ad: `${elementText}` }).toArray();
    var oki = Arr.length;
    
    if (oki== 0) {
      var id = await db.collection("Ogrenci").countDocuments();
      var yaz = await db.collection("Ogrenci").insertOne({ _id: id, Ad: `${elementText}`, YayınTürü: 'Makale', ArananKelime: kelime });
      return id;
    }
    else{
      return -2;
    }
    



  } else {
    console.log('Sayfa başlığı bulunamadı.');
    return -1;
  }
}
/////////////////////////////////Anahtar kelimeler/////////////////////////////////////

async function anahtarkelime(page, id) {


  const elementText = await page.evaluate(() => {
    const element = document.querySelector('.article-keywords p');
    return element ? element.textContent.trim() : null;
  });

  if (elementText) {
    const bosluksuzString = elementText.replace(/\s/g, "");

    const update = { $set: { MetindekiAnahtarKelimeler: bosluksuzString } };
    const result = await db.collection("Ogrenci").updateOne({ _id: id }, update);
  } else {
    console.log('Belirtilen sınıfa sahip element bulunamadı.');
  }
}

/////////////////////////////////Özet/////////////////////////////////////

async function ozet(page, id) {


  const elementText = await page.evaluate(() => {
    const element = document.querySelector('.article-abstract');
    return element ? element.textContent.trim() : null;
  });

  if (elementText) {
    const bosluksuzString = elementText.replace(/\s/g, "");

    const update = { $set: { Özet: elementText } };
    const result = await db.collection("Ogrenci").updateOne({ _id: id }, update);
  } else {
    console.log('Özet yok.');
  }
}

/////////////////////////////////Yazarlar/////////////////////////////////////

async function yazar(page, id) {
  for (let index = 1; index < 9; index++) {

    const elementText = await page.evaluate(async (index) => {
      const element = document.querySelector(`.record_properties tr:nth-child(${index}) td`);
      return element ? element.textContent.trim() : null;
    }, index);

    const elementText1 = await page.evaluate(async (index) => {
      const element = document.querySelector(`.record_properties tr:nth-child(${index}) th`);
      return element ? element.textContent.trim() : null;
    }, index);


    if (elementText) {
      const bosluksuzString = elementText.replace(/\s/g, "");
      var Ayrıntılar = elementText1;
      const update = { $set: { [Ayrıntılar]: elementText } };
      const result = await db.collection("Ogrenci").updateOne({ _id: id }, update);
    }
  }


}
/////////////////////////////////Refarasns/////////////////////////////////////

async function referans(page, id) {


  const elementText = await page.evaluate(() => {
    const element = document.querySelector('.fa-ul');
    return element ? element.textContent.trim() : null;
  });

  if (elementText) {
    const bosluksuzString = elementText.replace(/\s/g, "");

    const update = { $set: { Referans: elementText } };
    const result = await db.collection("Ogrenci").updateOne({ _id: id }, update);
  } else {
    console.log('Referans yok.');
  }
}



app.listen(3000, () => {
  console.log('Uygulama 3000 portunda çalışıyor.');
});


////////////////////////////////Tarih döndüştür///////////////////////////////////

function formatTarih(tarih) {
  const ayIsimleri = {
    "Ocak": "01",
    "Şubat": "02",
    "Mart": "03",
    "Nisan": "04",
    "Mayıs": "05",
    "Haziran": "06",
    "Temmuz": "07",
    "Ağustos": "08",
    "Eylül": "09",
    "Ekim": "10",
    "Kasım": "11",
    "Aralık": "12"
  };

  const parcalar = tarih.split(" ");
  
 
  const gun = parcalar[0];
  const ay = ayIsimleri[parcalar[1]];
  const yil = parcalar[2];
  
  
  const yeniTarih = `${yil}-${ay}-${gun}`;

  return yeniTarih;
}

function geriformatTarih(tarihStr) {
  const tarih = new Date(tarihStr);
  const gun = tarih.getDate();
  const ayIsimleri = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const ay = ayIsimleri[tarih.getMonth()];
  const yil = tarih.getFullYear();

  return `${gun} ${ay} ${yil}`;
}

async function  veri_cek(s1, s2){
  try {
    const documents = await db.collection("Ogrenci").find({ [s1]: s2 }).toArray();
    return documents;
  } catch (err) {
    console.error('Belge çekme hatası:1', err);
    res.status(500).send('Internal Server Error1');
  }
}

function diziyiSifirla(dizi) {
  // En küçük elemanı bul
  const enKucuk = Math.min(...dizi);
  
  // Diğer elemanlardan en küçük elemanı çıkararak 0'a eşitle
  const yenidizi = dizi.map(eleman => eleman - enKucuk);

  return yenidizi;
}

function ortakElemanlariBul(nesne1, nesne2) {
  const ortaklar = {};
  for (const anahtar in nesne1) {
      if (nesne2.hasOwnProperty(anahtar) && nesne1[anahtar] === nesne2[anahtar]) {
          ortaklar[anahtar] = nesne1[anahtar];
      }
  }
  return ortaklar;
}
////////////////////////////////Kelime Düzeltme////////////////////////////////////////




