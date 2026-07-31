use std::{
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};

use tauri::{AppHandle, Manager, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const MAX_AUDIO_BYTES: u64 = 20 * 1024 * 1024;
const DIRECTIONS: [&str; 4] = ["north", "right", "south", "left"];
const AUDIO_EXTENSIONS: [&str; 3] = ["wav", "mp3", "ogg"];

struct VisibilityShortcut(Mutex<String>);

fn validate_direction(direction: &str) -> Result<(), String> {
    if DIRECTIONS.contains(&direction) {
        Ok(())
    } else {
        Err("Direção de áudio inválida.".into())
    }
}

fn validate_extension(path: &Path) -> Result<String, String> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_lowercase)
        .ok_or_else(|| "O arquivo selecionado não possui uma extensão válida.".to_string())?;
    if AUDIO_EXTENSIONS.contains(&extension.as_str()) {
        Ok(extension)
    } else {
        Err("Formato inválido. Selecione um arquivo WAV, MP3 ou OGG.".into())
    }
}

fn audio_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Não foi possível localizar a pasta de dados: {error}"))?
        .join("audio");
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Não foi possível criar a pasta de áudios: {error}"))?;
    Ok(directory)
}

fn remove_direction_audio(app: &AppHandle, direction: &str) -> Result<(), String> {
    validate_direction(direction)?;
    let directory = audio_directory(app)?;
    for extension in AUDIO_EXTENSIONS {
        let path = directory.join(format!("{direction}.{extension}"));
        if path.exists() {
            fs::remove_file(path)
                .map_err(|error| format!("Não foi possível remover o áudio anterior: {error}"))?;
        }
    }
    Ok(())
}

#[tauri::command]
fn import_audio(app: AppHandle, direction: String, source_path: String) -> Result<String, String> {
    validate_direction(&direction)?;
    let source = PathBuf::from(source_path)
        .canonicalize()
        .map_err(|_| "O arquivo selecionado não existe ou não pode ser acessado.".to_string())?;
    if !source.is_file() {
        return Err("O caminho selecionado não é um arquivo.".into());
    }
    let extension = validate_extension(&source)?;
    let metadata = fs::metadata(&source)
        .map_err(|error| format!("Não foi possível validar o arquivo: {error}"))?;
    if metadata.len() > MAX_AUDIO_BYTES {
        return Err("O arquivo de áudio deve ter no máximo 20 MB.".into());
    }

    remove_direction_audio(&app, &direction)?;
    let file_name = format!("{direction}.{extension}");
    let destination = audio_directory(&app)?.join(&file_name);
    fs::copy(source, destination)
        .map_err(|error| format!("Não foi possível importar o áudio: {error}"))?;
    Ok(file_name)
}

#[tauri::command]
fn read_audio(app: AppHandle, direction: String, file_name: String) -> Result<Vec<u8>, String> {
    validate_direction(&direction)?;
    let extension = validate_extension(Path::new(&file_name))?;
    if file_name != format!("{direction}.{extension}") {
        return Err("Referência de áudio inválida.".into());
    }
    let path = audio_directory(&app)?.join(file_name);
    let metadata =
        fs::metadata(&path).map_err(|_| "O áudio personalizado não existe mais.".to_string())?;
    if !metadata.is_file() || metadata.len() > MAX_AUDIO_BYTES {
        return Err("O arquivo de áudio armazenado é inválido.".into());
    }
    fs::read(path).map_err(|error| format!("Não foi possível ler o áudio: {error}"))
}

#[tauri::command]
fn remove_audio(app: AppHandle, direction: String) -> Result<(), String> {
    remove_direction_audio(&app, &direction)
}

#[tauri::command]
fn set_visibility_shortcut(
    app: AppHandle,
    state: State<'_, VisibilityShortcut>,
    shortcut: String,
) -> Result<(), String> {
    if shortcut.trim().is_empty() {
        return Err("O atalho de visibilidade não pode ficar vazio.".into());
    }
    let mut current = state
        .0
        .lock()
        .map_err(|_| "Não foi possível atualizar o atalho de visibilidade.".to_string())?;
    let previous = current.clone();
    let _ = app.global_shortcut().unregister(previous.as_str());
    if let Err(error) = app.global_shortcut().register(shortcut.as_str()) {
        let _ = app.global_shortcut().register(previous.as_str());
        return Err(format!("Não foi possível registrar {shortcut}: {error}"));
    }
    *current = shortcut;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(VisibilityShortcut(Mutex::new("F11".into())))
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    let configured = app.state::<VisibilityShortcut>();
                    let Ok(configured) = configured.0.lock() else {
                        return;
                    };
                    if !shortcut
                        .to_string()
                        .eq_ignore_ascii_case(configured.as_str())
                    {
                        return;
                    }
                    let Some(window) = app.get_webview_window("main") else {
                        return;
                    };
                    match window.is_visible() {
                        Ok(true) => {
                            if let Err(error) = window.hide() {
                                eprintln!("Falha ao ocultar o overlay: {error}");
                            }
                        }
                        Ok(false) => {
                            if let Err(error) = window.show() {
                                eprintln!("Falha ao reabrir o overlay: {error}");
                            }
                        }
                        Err(error) => eprintln!("Falha ao consultar visibilidade: {error}"),
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            import_audio,
            read_audio,
            remove_audio,
            set_visibility_shortcut
        ])
        .setup(|app| {
            app.global_shortcut().register("F11")?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao executar o Putrefactory Timer");
}
