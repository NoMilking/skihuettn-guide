# Supabase Setup Anleitung

## ✅ Schritt 1: Projekt erstellt
- [x] Supabase-Projekt erstellt
- [x] `.env` Datei mit Credentials angelegt

---

## 📋 Schritt 2: Datenbank-Schema deployen

### Anleitung:
1. Öffne dein Supabase-Projekt: https://supabase.com/dashboard/project/czajljfmkbhiwumhntkh
2. Navigiere zu **SQL Editor** (linke Sidebar)
3. Klicke auf **"New Query"**
4. Öffne die Datei `supabase_schema.sql` in diesem Projektordner
5. Kopiere den **gesamten Inhalt** der Datei
6. Füge ihn in den SQL Editor ein
7. Klicke auf **"Run"** (oder drücke Ctrl+Enter)
8. Warte bis alle Befehle ausgeführt wurden (~5 Sekunden)

### Erwartetes Ergebnis:
Am Ende solltest du eine Tabelle sehen mit:
```
table_name       | count
-----------------+-------
ski_areas        | 6
restaurants      | 8
ratings          | 0
photos           | 0
comment_votes    | 0
favorites        | 0
```

✅ **6 Skigebiete** (Sölden, Ischgl, St. Anton, Zermatt, Verbier, Cortina)
✅ **8 Test-Hütten** in Sölden zum Ausprobieren

---

## 📦 Schritt 3: Storage Bucket für Fotos erstellen

### Anleitung:
1. Gehe zu **Storage** (linke Sidebar in Supabase)
2. Klicke auf **"New Bucket"**
3. Konfiguration:
   - **Name**: `photos`
   - **Public bucket**: ✅ **JA** (wichtig!)
   - **Allowed MIME types**: Leer lassen (erlaubt alle)
   - **File size limit**: 5 MB (Standard ist OK)
4. Klicke auf **"Create bucket"**

### Ergebnis:
Du solltest jetzt einen Bucket namens `photos` sehen.

---

## ✅ Schritt 4: Verbindung testen

Nach dem Setup kannst du die Verbindung testen:

```bash
cd "C:\Users\pfeff\Documents\Claude\SkiHüttn Guide\SkiHuettnGuide"
npm start
```

Die App sollte starten ohne Fehler bezüglich Supabase.

---

## 🔍 Troubleshooting

### Problem: "Missing Supabase environment variables"
**Lösung:** Stelle sicher, dass die `.env` Datei im Projektroot liegt und die korrekten Werte enthält.

### Problem: "relation ... does not exist"
**Lösung:** Das SQL-Schema wurde nicht korrekt ausgeführt. Wiederhole Schritt 2.

### Problem: "Storage bucket not found"
**Lösung:** Erstelle den `photos` Bucket wie in Schritt 3 beschrieben.

---

## 📝 Nächste Schritte

Nach erfolgreichem Setup:
1. ✅ Datenbank-Schema deployed
2. ✅ Storage Bucket erstellt
3. ➡️ **Weiter mit App-Entwicklung** (Navigation, Screens, API-Calls)
