# Putrefactory Timer

Overlay desktop leve e independente para acompanhar manualmente o ciclo do totem de Putrefactory no Tibia. O aplicativo **não lê nem controla o jogo**: apenas mostra um cronômetro local e reage aos comandos do usuário.

## Recursos do MVP

- Ciclo contínuo **Norte → Direita → Sul → Esquerda**, com timer baseado em `performance.now()` para evitar drift.
- Janela Tauri transparente, sem bordas, redimensionável, arrastável e sempre no topo.
- Iniciar/pausar, sincronizar, reiniciar, navegar nas direções e ajuste fino de ±0,1 s.
- Intervalo decimal de 1 a 30 segundos; volume, transparência e escala configuráveis.
- Áudio WAV/MP3/OGG ou voz do sistema como fallback; aviso na troca, 1 s ou 2 s antes.
- Atalhos globais F6–F11, modo compacto, bloqueio de posição, ocultação e passagem de cliques.
- Preferências e geometria persistidas localmente. A execução nunca é salva: toda abertura começa pausada em Norte.

## Pré-requisitos

- Node.js 20 ou superior e npm.
- Rust estável pelo `rustup`.
- No Windows: Microsoft C++ Build Tools e WebView2. Consulte os [pré-requisitos oficiais do Tauri](https://v2.tauri.app/start/prerequisites/).

## Desenvolvimento

```bash
npm install
npm run tauri dev
```

Para testar somente a interface no navegador, use `npm run dev`. Recursos nativos (atalhos, seletor de arquivos, click-through e controle da janela) exigem `npm run tauri dev`.

## Verificações

```bash
npm test
npm run lint
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Gerar o executável para Windows

Execute **em um computador Windows** com os pré-requisitos instalados:

```powershell
npm install
npm run tauri build
```

O instalador será criado em `src-tauri/target/release/bundle/`. A compilação cruzada de instaladores Windows a partir de Linux não é suportada de forma confiável pelo toolchain padrão do Tauri; use Windows ou CI com runner Windows.

## Uso e limitações seguras

Arraste pela barra superior. Se ativar **Ignorar cliques**, pressione F10 para recuperar a interação. Atalhos ocupados por outro programa geram uma mensagem no overlay. Jogos executados como administrador podem impedir atalhos de aplicativos sem elevação; prefira executar ambos no mesmo nível de privilégio.

Os áudios são referenciados pelo caminho escolhido e não são copiados. Veja `assets/audio-examples/README.md`. A voz de fallback depende das vozes em português instaladas no Windows.
