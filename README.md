# nodejs-test — Gerçek Zamanlı Chat Uygulaması 💬

Modern ve özellik dolu bir Node.js + Express + Socket.IO chat uygulaması.

## ✨ Özellikler

### 🎨 Temel Özellikler
- **Gerçek zamanlı mesajlaşma** - Socket.IO ile anlık iletişim
- **Kullanıcı adı sistemi** - Her kullanıcı kendine özel isim seçebilir
- **Profil avatarları** - 16 farklı avatar seçeneği
- **Renkli kullanıcılar** - Her kullanıcıya otomatik rastgele renk atanır
- **Online kullanıcı sayacı** - Kaç kişinin aktif olduğunu görün

### 🎯 Gelişmiş Özellikler
- **Oda/Kanal sistemi** - Genel, Teknoloji ve Oyun odaları
- **Özel mesaj (DM)** - Kullanıcılara tıklayarak özel mesaj gönderin
- **Mesaj düzenleme** - Gönderdiğiniz mesajları düzenleyin
- **Mesaj silme** - İstemediğiniz mesajları silin
- **Dosya paylaşımı** - Resim dosyalarını paylaşın
- **Mesaj geçmişi** - Son 50 mesaj yeni kullanıcılara gösterilir
- **Yazıyor göstergesi** - Kullanıcılar yazarken diğerleri görebilir
- **Emoji picker** - 20+ emoji ile mesajlarınızı renklendirin
- **Karanlık mod** - Göz dostu tema desteği (tercih kaydedilir)
- **Ses bildirimi** - Yeni mesajlarda ses uyarısı
- **Responsive tasarım** - Mobil ve masaüstü uyumlu
- **Sidebar** - Odalar ve online kullanıcılar yan panelde

## 🚀 Hızlı Başlangıç

1. **Bağımlılıkları yükleyin**

```powershell
npm install
```

2. **Sunucuyu başlatın**

```powershell
npm start
```

3. **Tarayıcınızda açın**

http://localhost:3000

4. **Kullanıcı adınızı girin ve sohbete başlayın!**

## 🎮 Kullanım

### Temel İşlemler
- **Mesaj göndermek**: Mesajınızı yazıp Enter'a basın veya Gönder butonuna tıklayın
- **Emoji eklemek**: 😊 butonuna tıklayıp istediğiniz emojiyi seçin
- **Tema değiştirmek**: Sağ üstteki 🌙/☀️ butonuna tıklayın
- **Dosya göndermek**: 📎 butonuna tıklayıp resim seçin

### Gelişmiş İşlemler
- **Oda değiştirmek**: Sol panelden istediğiniz odaya tıklayın
- **Özel mesaj göndermek**: Online kullanıcılar listesinden bir kullanıcıya tıklayın
- **Mesaj düzenlemek**: Kendi mesajınızın üzerine gelip ✏️ butonuna tıklayın
- **Mesaj silmek**: Kendi mesajınızın üzerine gelip 🗑️ butonuna tıklayın
- **Avatar seçmek**: İlk girişte 16 farklı avatar arasından seçim yapın

## 🛠️ Teknolojiler

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Gerçek zamanlı iletişim
- **HTML5/CSS3** - Modern web standartları
- **Vanilla JavaScript** - Framework'süz, saf JS

## 📝 Notlar

- Mesaj geçmişi sunucu belleğinde tutulur (son 50 mesaj)
- Kullanıcı tercihleri (karanlık mod) localStorage'da saklanır
- Ses bildirimleri tarayıcı izni gerektirebilir
- Özel mesajlar sadece gönderen ve alıcı tarafından görülür
- Her oda bağımsız mesaj akışına sahiptir
- Dosya paylaşımı şu anda sadece resim formatlarını destekler

## 🎨 Özellik Detayları

### Oda Sistemi
- **Genel**: Herkesin sohbet edebileceği ana oda
- **Teknoloji**: Teknoloji konuları için özel oda
- **Oyun**: Oyun severler için özel oda
- Her odada bağımsız mesaj geçmişi ve kullanıcı listesi

### Mesaj Yönetimi
- Sadece kendi mesajlarınızı düzenleyebilir ve silebilirsiniz
- Düzenlenen mesajlar "(düzenlendi)" etiketi ile işaretlenir
- Silinen mesajlar tüm kullanıcılar için kaldırılır

### Özel Mesajlar
- Online kullanıcılar listesinden kullanıcıya tıklayın
- Özel mesajlar sarı arka plan ile vurgulanır
- Sadece gönderen ve alıcı görebilir

---

**onder7** tarafından geliştirildi 🚀
