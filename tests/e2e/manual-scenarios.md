# E2E Szenarien (manuell)

## 1) Team-User erfasst Ausgabe, Superadmin gibt frei

1. Als `TEAM_USER` einloggen.
2. Unter `/admin/ausgaben` neue Ausgabe erfassen.
3. Pruefen, dass Status `PENDING` ist.
4. Als `SUPERADMIN` einloggen.
5. Unter `/admin/ausgaben` Eintrag auf `APPROVED` setzen.
6. Unter `/admin/dashboard` fuer den Monat pruefen, dass Ausgaben-/Gewinn-KPI angepasst sind.

## 1b) Team-User kann eigene freigegebene Ausgabe bearbeiten und loeschen

1. Als `TEAM_USER` einloggen.
2. Eigene Ausgabe waehlen (auch `APPROVED`).
3. `Bearbeiten` klicken, Betrag aendern, speichern.
4. Pruefen, dass Tabelle den neuen Wert zeigt.
5. `Loeschen` klicken und bestaetigen.
6. Pruefen, dass Zeile verschwindet.

## 2) Superadmin legt User an

1. Als `SUPERADMIN` einloggen.
2. Unter `/admin/users` neuen `TEAM_USER` anlegen.
3. Mit neuem Account einloggen.
4. Optional `POST /api/auth/change-password` ausfuehren und pruefen, dass Passwortwechsel funktioniert.

## 2b) Teammitglied bearbeiten

1. Als `SUPERADMIN` einloggen.
2. Unter `/admin/team` ein bestehendes Teammitglied auf `Bearbeiten` setzen.
3. `payoutPct` oder Wallet-Feld aendern und speichern.
4. Pruefen, dass die Tabelle die neuen Werte anzeigt.

## 2c) Burning-Link und Edit

1. Unter `/admin/burning` pruefen, dass `Tx Link` als klickbarer Link angezeigt wird.
2. Einen Eintrag bearbeiten und `txUrl` aendern.
3. Speichern und pruefen, dass der neue Link geoeffnet werden kann.

## 2d) Projektadresse bearbeiten und loeschen

1. Unter `/admin/adressen` eine Adresse auf `Bearbeiten` setzen.
2. Feld aktualisieren und speichern.
3. Adresse auf `Loeschen` setzen und bestaetigen.
4. Pruefen, dass Zeile entfernt wurde.

## 2e) Dashboard Monatsdropdown

1. Unter `/admin/dashboard` Monatsdropdown pruefen.
2. Einen anderen vorhandenen Monat waehlen.
3. `Aktualisieren` klicken und KPI-Wechsel pruefen.

## 4) Community Dashboard + Monatsfreigabe

1. Als `SUPERADMIN` oder `TEAM_USER` einloggen.
2. Unter `/admin/community` einen offenen Monat `Schliessen`.
3. Oeffentliche Seite `/dashboard` neu laden.
4. Pruefen, dass der geschlossene Monat sichtbar ist.
5. Als `SUPERADMIN` im Adminbereich den Monat `Wieder oeffnen`.
6. `/dashboard` neu laden und pruefen, dass der Monat verschwindet.
7. KPI pruefen:
8. `Gesamt Profit (alle veroeffentlichten Monate)` entspricht Summe der Monatswerte.
9. Burning-Tabelle zeigt UTT/USHARK getrennt mit Links.

## 3) Public API zeigt nur aggregierte Daten

1. `GET /api/public/summary` aufrufen.
2. Pruefen, dass keine personenbezogenen Daten enthalten sind.
3. `GET /api/public/nft-profit-trend` aufrufen.
4. Pruefen, dass nur KPI-Aggregate geliefert werden.
