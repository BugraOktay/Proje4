
const nspell = require('nspell');

// Özel terimleri içeren bir sözlük oluştur
const customDictionary = ['deep learrning', 'neural netwokrs', 'machne learnign'];
const spellchecker = nspell();

customDictionary.forEach(term => {
  spellchecker.add(term);
});

// Kullanıcının girdisini kontrol et ve düzelt
const userInput = 'deep learrning';

if (spellchecker.correct(userInput)) {
  console.log('Yazım doğru:', userInput);
} else {
  // Düzeltme önerilerini al
  const suggestions = spellchecker.suggest(userInput);

  if (suggestions.length > 0) {
    console.log(`Yazım yanlışı bulundu. Düzeltme önerileri: ${suggestions.join(', ')}`);
    // İlk düzeltme önerisini kullanabilir veya başka bir işlem yapabilirsiniz
    const correctedTerm = suggestions[0];
    console.log(`Düzeltme önerisi: ${correctedTerm}`);
  } else {
    console.log('Yazım yanlışı bulundu, ancak düzeltme önerisi bulunamadı.');
  }
}
