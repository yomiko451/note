// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use serde::{Serialize, Deserialize};
use time;
use serde_json;
use tauri::{AppHandle, ClipboardManager};
use std::fs::{File, self};



// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_time() -> String {
    time::OffsetDateTime::now_local()
        .unwrap()
        .to_string()
        .split(".")
        .collect::<Vec<_>>()[0]
        .to_string()
}
#[tauri::command]
fn save_text(app_handle: AppHandle, text: &str, time: &str) {
    let note = Note::new(text, time);
    let file_name = format!("{}.json", time).replace(":", "-");
    let path = app_handle
        .path_resolver()
        .app_local_data_dir()
        .unwrap()
        .join(file_name);
    let writer = File::create(path).unwrap();
    serde_json::to_writer(writer, &note).unwrap();
}
#[tauri::command]
fn delete_text(app_handle: AppHandle, name: &str) {
    let file_name = format!("{}.json", name).replace(":", "-");
    let path = app_handle
        .path_resolver()
        .app_local_data_dir()
        .unwrap()
        .join(file_name);
    if let Ok(_) = File::open(&path) {
        fs::remove_file(&path).unwrap()
    }
}
#[tauri::command]
fn rename_text(app_handle: AppHandle, old: &str, new: &str) {
    let new_name = format!("{}.json", new).replace(":", "-");
    let old_name = format!("{}.json", old).replace(":", "-");
    let path = app_handle
        .path_resolver()
        .app_local_data_dir()
        .unwrap();
    let old_path = path.join(old_name);
    let new_path = path.join(new_name);
    if let Ok(_) = File::open(&old_path) {
        let f = File::options().read(true).write(true).open(&old_path).unwrap();
        let mut old_note: Note = serde_json::from_reader(f).unwrap();
        old_note.data = new.to_string();
        let f = File::create(&old_path).unwrap();
        serde_json::to_writer(f, &old_note).unwrap();
        fs::rename(&old_path, &new_path).unwrap();
    }
}
#[tauri::command]
fn copy_text(app_handle: AppHandle, text: &str) {
    app_handle.clipboard_manager().write_text(text).unwrap()
}
#[tauri::command]
fn load_text(app_handle: AppHandle) -> Vec<Note> {
    let path = app_handle
        .path_resolver()
        .app_local_data_dir()
        .unwrap();
    let a:Vec<_> =  fs::read_dir(&path)
        .unwrap()
        .map(|f| f.unwrap().file_name().into_string().unwrap())
        .collect();
    (&a[..(a.len() - 1)]).to_vec()
        .iter()
        .map(|t| -> Note {
            let p = path.join(t);
            let f = File::open(p).unwrap();
            serde_json::from_reader(f).unwrap()
        }).collect()
}

#[derive(Serialize, Deserialize)]
struct Note {
    content: String,
    data: String
}
impl Note {
    fn new(content: &str, data: &str) -> Note {
        Note { content: content.to_string(), data: data.to_string() }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_time,
                                                save_text, 
                                                delete_text, 
                                                rename_text, 
                                                copy_text,
                                                load_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
