# nodejs-test — Gerçek Zamanlı Chat Uygulaması 💬

Modern ve özellik dolu bir Node.js + Express + Socket.IO chat uygulaması.

## ✨ Özellikler

### 🎨 Temel Özellikler
- **Gerçek zamanlı mesajlaşma** - Socket.IO ile anlık iletişim
- **Kullanıcı adı sistemi** - Her kullanıcı kendine özel isim seçebilir
- **Profil avatarları** - 16 farklı avatar seçeneği
- **Renkli kullanıcılar** - Her kullanıcıya otomatik rastgele renk atanır
- **Online kullanıcı sayacı** - Kaç kişinin aktif olduğunu görün
- **WhatsApp Tarzı Tasarım** - Modern ve tanıdık kullanıcı arayüzü
- **Mobil Hamburger Menü** - Mobilde kolay erişim için yan menü sistemi

### 🎯 Gelişmiş Özellikler
- **Oda/Kanal sistemi** - Genel, Teknoloji ve Oyun odaları
  - Her oda kendi mesaj geçmişini tutar (100 mesaj/oda)
  - Oda değiştirdiğinizde o odanın geçmişi yüklenir
  - Admin odaları oluşturabilir, silebilir ve yeniden adlandırabilir
- **Gelişmiş Özel Mesaj (DM)** - Tam özellikli özel mesajlaşma sistemi
  - Özel mesaj penceresi
  - Mesaj geçmişi (200 mesaj/kullanıcı)
  - Okunmamış mesaj sayacı
  - Anlık bildirimler
  - Kalıcı mesaj geçmişi (kullanıcı başına)
- **🎤 Sesli Sohbet (WebRTC)** - Gerçek zamanlı sesli görüşme
  - Kullanıcıdan kullanıcıya sesli arama
  - Mikrofon açma/kapama
  - Görüşme göstergesi
  - Arama kabul/reddetme
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

### 🛡️ Admin Özellikleri
- **Admin Panel** - Ayrı admin kontrol sayfası (/admin.html)
- **Kullanıcı Yönetimi**
  - Kullanıcıları atma (kick)
  - Kullanıcıları yasaklama (ban)
  - Kullanıcıları susturma (mute)
  - Kullanıcılara uyarı gönderme
- **İstatistikler**
  - Toplam kullanıcı sayısı
  - Toplam mesaj sayısı
  - Yasaklı kullanıcı sayısı
  - Susturulmuş kullanıcı sayısı
  - Aktif oturum sayısı
  - Toplam log sayısı
- **Gerçek Zamanlı İzleme**
  - Online kullanıcılar
  - Son mesajlar
  - Oda istatistikleri
- **Detaylı Log Sistemi**
  - Tüm aktiviteler loglanır
  - Kimlik doğrulama logları
  - Mesaj logları
  - Admin işlem logları
  - Sistem logları
  - Log filtreleme (tip, kullanıcı)
  - Log dışa aktarma (JSON)
- **Oturum Yönetimi**
  - Aktif oturumlar listesi
  - Giriş geçmişi
  - IP adresi takibi
  - Son aktivite zamanı
  - Oturum süresi

### 🔐 Session Yönetimi
- **Otomatik Giriş** - Kullanıcılar çıkış yapmadıkça hatırlanır
- **24 Saat Oturum** - Session 24 saat boyunca geçerli
- **Güvenli Session** - Express-session ile güvenli oturum yönetimi
- **Çıkış Yapma** - Kullanıcılar istediği zaman çıkış yapabilir
- **Session Takibi** - Her oturum benzersiz ID ile takip edilir

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
  - Özel mesaj penceresi açılır
  - Mesaj geçmişinizi görüntüleyin
  - Okunmamış mesajlar kırmızı rozet ile gösterilir
- **Sesli arama yapmak**: Kullanıcı listesinde 🎤 butonuna tıklayın
  - Mikrofon izni verin
  - Karşı taraf aramayı kabul ederse görüşme başlar
  - 🔇 butonu ile mikrofonu kapatabilirsiniz
  - 📵 butonu ile görüşmeyi sonlandırın
- **Mesaj düzenlemek**: Kendi mesajınızın üzerine gelip ✏️ butonuna tıklayın
- **Mesaj silmek**: Kendi mesajınızın üzerine gelip 🗑️ butonuna tıklayın
- **Avatar seçmek**: İlk girişte 16 farklı avatar arasından seçim yapın

### Admin İşlemleri
1. **Admin Paneline Giriş**: `/admin.html` adresine gidin
2. **Admin Kullanıcı Adları**: `admin` veya `onder7`
3. **Panel Sekmeleri**:
   - 👥 **Kullanıcılar**: Online kullanıcılar ve oda yönetimi
   - � **Sohb:et**: Son mesajları görüntüleme
   - �  **Loglar**: Detaylı aktivite logları ve filtreleme
   - � **Otkurumlar**: Aktif oturumlar ve giriş geçmişi
4. **Kullanıcı Yönetimi**:
   - ⚠️ Uyarı: Kullanıcıya özel uyarı mesajı gönderin
   - 🔇 Sustur: Kullanıcıyı belirli süre susturun
   - 👢 At: Kullanıcıyı odadan atın
   - 🚫 Yasakla: Kullanıcıyı kalıcı yasaklayın
5. **Log Yönetimi**:
   - Tip bazlı filtreleme (auth, message, admin, system)
   - Kullanıcı bazlı arama
   - JSON formatında dışa aktarma

## 🛠️ Teknolojiler

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Gerçek zamanlı iletişim
- **HTML5/CSS3** - Modern web standartları
- **Vanilla JavaScript** - Framework'süz, saf JS

## 📝 Notlar

### 💾 Veri Saklama
- **Oda Mesajları**: Her oda için 100 mesaj (RAM'de)
- **Özel Mesajlar**: Kullanıcı başına 200 mesaj (RAM'de)
- **Loglar**: Son 1000 log + dosyada günlük kayıt (`logs/` klasörü)
- **Session**: 24 saat (RAM'de)
- ⚠️ **Önemli**: Sunucu yeniden başlatıldığında mesaj geçmişi silinir, sadece loglar dosyada kalır

### 📱 Mobil Kullanım
- **Hamburger Menü**: Sol üstteki ☰ simgesine tıklayarak odalar ve kullanıcılara erişin
- **Otomatik Kapanma**: Oda veya kullanıcı seçtiğinizde menü otomatik kapanır
- **Overlay**: Menü dışına tıklayarak kapatabilirsiniz
- **Tam Ekran Chat**: Mobilde chat alanı tam ekran kullanılır

### 🎨 Tasarım
- **WhatsApp Stili**: Profesyonel ve tanıdık arayüz
- **Responsive**: Tüm ekran boyutlarına uyumlu
- **Dark Mode**: Göz dostu karanlık tema
- **Animasyonlar**: Yumuşak geçişler ve fade-in efektleri

### 🔧 Teknik Detaylar
- Kullanıcı tercihleri (karanlık mod) localStorage'da saklanır
- Ses bildirimleri tarayıcı izni gerektirebilir
- Özel mesajlar sadece gönderen ve alıcı tarafından görülür
- Her oda bağımsız mesaj akışına sahiptir
- Dosya paylaşımı şu anda sadece resim formatlarını destekler
- Session bilgileri sunucu belleğinde tutulur
- Her aktivite otomatik olarak loglanır
- **Sesli sohbet için mikrofon izni gereklidir**
- Sesli sohbet WebRTC teknolojisi ile peer-to-peer çalışır
- STUN sunucuları Google'ın ücretsiz sunucularını kullanır

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
- Özel mesaj penceresi açılır
- Mesaj geçmişi saklanır ve tekrar görüntülenebilir
- Okunmamış mesajlar kırmızı rozet ile gösterilir
- Yeni özel mesaj geldiğinde bildirim alırsınız
- Sadece gönderen ve alıcı görebilir

### Admin Sistemi
- Admin kullanıcıları özel yetkilerle işaretlenir
- Admin paneli ayrı bir sayfada çalışır
- Tüm kullanıcı aktiviteleri izlenebilir
- Gerçek zamanlı istatistikler
- Kullanıcı yönetim araçları

---

**onder7** tarafından geliştirildi 🚀
