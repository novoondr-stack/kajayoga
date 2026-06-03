# Jóga do emailu – zjednodušená verze

Statická landing page **bez** Lenis, GSAP ScrollTrigger, hero scroll locku a scrollytelling animace v sekci „Jak to funguje“.

## Spuštění lokálně

Otevři složku přes lokální server (např. VS Code Live Server), ne dvojklikem na `index.html`.

## Vercel

1. V projektu nastav **Root Directory** na `simple`
2. Deploy – framework: **Other** (statický web)
3. Output directory: `.` (nebo nech prázdné)

## Co je jinak oproti hlavní verzi

- Hero + video = normální scroll stránkou
- „Jak to funguje“ = karty pod sebou, bez cestiček a bez pin animace
- Bez vlastního posuvníku vpravo
- Bez hero wheel lock animace
