# Entspanntland

Eine statische HTML/CSS/JS-App fuer das Inselprojekt.

## Lokal starten

```sh
python3 -m http.server 4175 --bind 127.0.0.1
```

Danach im Browser oeffnen:

```text
http://localhost:4175/
```

## Deployment

Das Projekt ist als statische Website vorbereitet. Fuer Netlify oder Cloudflare Pages:

- Build command: leer lassen
- Publish directory: `.`

Die Datei `API` ist absichtlich per `.gitignore` ausgeschlossen und darf nicht ins Repository.

