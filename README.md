# SkiHüttn Guide - MVP

Eine React Native/Expo App für Skihütten-Bewertungen mit gerätebindung (keine User-Accounts).

## 🎯 Projekt-Status

### ✅ Phase 1 & 2 abgeschlossen:

- [x] Expo-Projekt mit TypeScript
- [x] Alle Dependencies installiert
- [x] **Kritische Kern-Logik** (scoring, emoji, color) mit Unit Tests
- [x] Device-ID Storage (AsyncStorage)
- [x] Supabase Client
- [x] **Vollständiger API-Layer** (5 Module)
- [x] Custom Hooks (useDevice)
- [x] **Bottom Tab Navigation** (3 Tabs)
- [x] **3 Basis-Screens** (SkiAreas, MySkiAreas, MyRatings)

### 📋 Noch zu implementieren:

- [ ] Skigebiet-Detailansicht (Liste + Karte)
- [ ] Restaurant-Detailansicht
- [ ] **Bewertungs-Screen mit Live-Score** (kritisch!)
- [ ] Karten-Ansicht mit SVG
- [ ] Foto-Upload
- [ ] Kommentar-Voting

---

## 🚀 App starten

### Voraussetzungen:
- Node.js LTS (v20+)
- Expo Go App auf deinem Smartphone (iOS/Android)

### Installation & Start:

```bash
cd "C:\Users\pfeff\Documents\Claude\SkiHüttn Guide\SkiHuettnGuide"

# App starten
npm start
```

Dann scanne den QR-Code mit:
- **iOS**: Kamera-App
- **Android**: Expo Go App

---

## 📁 Projekt-Struktur

```
src/
├── api/              # Supabase API-Calls
│   ├── supabase.ts
│   ├── skiAreas.ts
│   ├── restaurants.ts
│   ├── ratings.ts
│   ├── favorites.ts
│   └── photos.ts
├── components/       # UI-Komponenten (noch leer)
├── hooks/
│   └── useDevice.ts  # Device-ID Hook
├── logic/            # ⭐ Kern-Logik (KRITISCH!)
│   ├── scoring.ts    # Score-Berechnung (-20 bis +35)
│   ├── emoji.ts      # Emoji-Priorität & Schwellenwerte
│   └── color.ts      # Farb-Mapping (Rot/Gelb/Grün)
├── navigation/
│   └── RootNavigator.tsx
├── screens/
│   ├── SkiAreasScreen.tsx       # ✅ Mit Suche & Favoriten
│   ├── MySkiAreasScreen.tsx     # ✅ Favoriten-Liste
│   └── MyRatingsScreen.tsx      # ✅ Eigene Bewertungen
├── storage/
│   └── device.ts     # Device-ID Management
└── types/
    └── index.ts      # TypeScript Definitionen
```

---

## 🧪 Tests ausführen

```bash
npm test
```

**Aktuelle Test-Coverage:**
- ✅ Scoring-Logik: 13 Tests (alle bestanden)
- ✅ Min/Max Scores validiert
- ✅ Eggnog-Bonus korrekt (+5 Punkte)

---

## 🗄️ Supabase Setup

### Datenbank-Status:
- ✅ Schema deployed
- ✅ 6 Skigebiete angelegt
- ✅ 8 Test-Hütten in Sölden
- ✅ Storage Bucket `photos` erstellt
- ✅ Materialized View `restaurant_stats` aktiv

### Verbindung testen:

Die Supabase-Verbindung wurde bereits erfolgreich getestet (siehe [SUPABASE_SETUP.md](SUPABASE_SETUP.md)).

---

## ⚙️ Konfiguration

### Environment Variables

Die `.env` Datei enthält:
```env
EXPO_PUBLIC_SUPABASE_URL=https://czajljfmkbhiwumhntkh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

⚠️ Diese Datei ist bereits konfiguriert und in `.gitignore`.

---

## 🎨 Design-Prinzipien

### Farb-Schema:
- **Primärfarbe**: Grün (#10B981) - für gute Bewertungen
- **Warnfarbe**: Gelb (#F59E0B) - für durchschnittliche Bewertungen
- **Fehlerfarbe**: Rot (#EF4444) - für schlechte Bewertungen

### Score-Berechnung (KRITISCH!):
```typescript
Gesamtscore = self_service + service + ski_haserl + food +
              sun_terrace + interior + apres_ski + (eggnog ? 5 : 0)

Range: -20 bis +35
```

**WICHTIG**: Dies ist eine **SUMME**, kein Durchschnitt!

### Emoji-Logik (KRITISCH!):
- Max. 3 Emojis, wenn Kategorie-Ø > 4.5
- Strikte Priorität: Après-Ski > Essen > Service > Sonne > Haserl > Einrichtung
- Eierlikör-Emoji 🥚🥛 zusätzlich (wenn ≥50%)

---

## 📱 Features

### ✅ Implementiert:
- Bottom Tab Navigation (3 Tabs)
- Skigebiete-Liste mit Live-Suche
- Favoriten-Management (toggle Star)
- Eigene Bewertungen anzeigen
- Score-Farbcodierung (Rot/Gelb/Grün)

### 🚧 In Arbeit:
- Skigebiet-Detailansicht
- Restaurant-Details
- Bewertungs-Screen
- Karten-Ansicht
- Foto-Upload

---

## 🐛 Troubleshooting

### Problem: "Module not found"
**Lösung:**
```bash
npm install
npx expo start --clear
```

### Problem: "Supabase connection failed"
**Lösung:** Prüfe die `.env` Datei und stelle sicher, dass die Supabase-Credentials korrekt sind.

### Problem: TypeScript-Fehler
**Lösung:**
```bash
npx tsc --noEmit
```

---

## 📚 Nächste Schritte

1. **Skigebiet-Detailansicht** mit Liste/Karte Tabs
2. **Restaurant-Detailansicht** mit Kategorien
3. **Bewertungs-Screen** mit Live-Score-Berechnung (KRITISCH!)
4. **Karten-Ansicht** mit SVG-Overlay
5. **Foto-Upload** mit Komprimierung

---

## 🤝 Mitwirkende

- Entwickelt mit Claude Code (Sonnet 4.5)
- Master-Prompt: `SkiHuettn_Master_Prompt_FINAL.md`

---

## 📄 Lizenz

Privates Projekt
