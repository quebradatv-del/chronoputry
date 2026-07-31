# Putrefactory Timer

Overlay desktop leve para acompanhar manualmente o ciclo do totem de Putrefactory no Tibia:
**Norte → Direita → Sul → Esquerda**.

O aplicativo é totalmente independente: **não lê memória, tela ou pacotes, não injeta código e
não controla teclado, mouse ou cliente do Tibia**. Todas as informações vêm do timer local e dos
comandos manuais do usuário.

## Recursos

- Timer baseado em `performance.now()` e timestamps absolutos, sem depender de `setInterval`.
- Sincronização, reinício, navegação manual e ajuste fino de ±0,1 segundo.
- Janela Tauri transparente, sem bordas, redimensionável e sempre no topo.
- Áudio WAV/MP3/OGG personalizado, com voz do sistema como fallback.
- Atalhos globais F6–F11, modo compacto, bloqueio de posição e passagem de cliques.
- Preferências e geometria persistidas localmente, com restauração segura.

## Pré-requisitos

- Node.js 20 ou superior e npm.
- Rust stable instalado pelo `rustup`.
- No Windows, Microsoft C++ Build Tools e WebView2. Consulte os
  [pré-requisitos oficiais do Tauri](https://v2.tauri.app/start/prerequisites/).

## Executar em desenvolvimento

```bash
npm ci
npm run tauri dev
```

`npm run dev` abre apenas a interface no navegador. Atalhos globais, arquivos, click-through e
controle nativo da janela só funcionam dentro do Tauri.

## Testar e validar

```bash
npm test
npm run lint
npm run format:check
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --manifest-path src-tauri/Cargo.toml
```

Use `npm run format` para formatar o projeto.

## Gerar o instalador no Windows

Em um computador Windows com os pré-requisitos instalados:

```powershell
npm ci
npm run tauri build
```

Os artefatos são gerados em `src-tauri/target/release/bundle/`. O workflow de CI também possui um
job Windows dedicado ao instalador. A compilação cruzada de instaladores Windows a partir de Linux
não é suportada de forma confiável pelo toolchain padrão do Tauri.

## Áudios personalizados

Abra **Configurações**, localize a direção e selecione um arquivo WAV, MP3 ou OGG de até 20 MB. O
backend valida existência, extensão e tamanho, copia o arquivo para a pasta privada de dados do
aplicativo e guarda somente um nome controlado (`north.wav`, por exemplo). O frontend não recebe
acesso geral ao sistema de arquivos e o asset protocol irrestrito não é habilitado.

Se o arquivo não puder ser lido ou reproduzido, o timer continua funcionando, mostra um aviso e
usa imediatamente a voz do sistema. A disponibilidade e pronúncia da voz em português dependem das
vozes instaladas no Windows.

## Atalhos e recuperação

| Atalho padrão | Ação                                 |
| ------------- | ------------------------------------ |
| F6            | Iniciar ou pausar                    |
| F7            | Sincronizar                          |
| F8            | Avançar direção                      |
| F9            | Voltar direção                       |
| F10           | Ativar/desativar passagem de cliques |
| F11           | Ocultar/reabrir o overlay            |

- Se **Ignorar cliques** estiver ativo, pressione **F10**. Esse atalho é global e continua ativo
  enquanto a janela ignora o mouse. Por segurança, click-through nunca é restaurado na próxima
  abertura.
- Se ocultar o overlay, pressione **F11**. Esse atalho é tratado pelo processo Rust, não pela WebView
  oculta, e reabre a mesma janela sem perder o estado atual do timer.
- Atalhos ocupados por outro programa geram erro e o registro é revertido por completo. Jogos
  executados como administrador podem bloquear atalhos de processos sem elevação; execute ambos no
  mesmo nível de privilégio.

## Regra ao alterar o intervalo

A alteração preserva **proporcionalmente o progresso do estágio atual**. Exemplo: se restam 3 dos 6
segundos e o intervalo muda para 10, passam a restar 5 segundos. Pausar preserva o timestamp exato;
ao retomar, a contagem continua daquele ponto. Após suspensão longa do computador, o número de
ciclos transcorridos é calculado de uma vez e apenas a direção atual é anunciada, sem rajada de sons.

## Estado inicial e limitações conhecidas

Cada abertura começa visível, pausada, em Norte, com o intervalo completo, sem áudio automático e
com click-through desativado. Preferências visuais, atalhos, áudios e geometria continuam salvos.

O comportamento de teclas globais pode variar com políticas corporativas, software de segurança e
aplicativos executados com privilégio superior. O overlay não observa o jogo; mudanças reais no
totem precisam ser sincronizadas manualmente.
