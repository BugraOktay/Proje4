const { NlpManager } = require('node-nlp');

// NLP yöneticisini oluştur
const nlpManager = new NlpManager({ languages: ['tr'] });

// Türkçe modelini ekle
nlpManager.addLanguage('tr');

// Metni düzeltme işlevi
async function duzeltMetin(metin) {
    const response = await nlpManager.process('tr', metin);
    const correctedText = response.answer;
    return correctedText;
}

// Örnek kullanım
const girilenMetin = "kitap";
duzeltMetin(girilenMetin)
    .then(duzeltilmisMetin => {
        console.log("Yazımı düzeltilmiş sonuçları görüyorsunuz:", duzeltilmisMetin);
    })
    .catch(err => {
        console.error("Hata:", err);
    });
