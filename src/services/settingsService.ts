import type { Settings } from "../types";
export const defaultSettings: Settings = { interval:6, volume:0.8, opacity:0.92, scale:1, audioTiming:0, audioFiles:{north:"",right:"",south:"",left:""}, hotkeys:{toggle:"F6",sync:"F7",next:"F8",previous:"F9",clickThrough:"F10",visibility:"F11"}, soundEnabled:true, showDirection:true, showCountdown:true, showNext:true, compact:false, lockPosition:false, alwaysOnTop:true, clickThrough:false };
const KEY="putrefactory-timer.settings.v1";
export function loadSettings(): Settings { try { const value=localStorage.getItem(KEY); return value ? {...defaultSettings,...JSON.parse(value),audioFiles:{...defaultSettings.audioFiles,...JSON.parse(value).audioFiles},hotkeys:{...defaultSettings.hotkeys,...JSON.parse(value).hotkeys}} : defaultSettings; } catch { return defaultSettings; } }
export function saveSettings(settings: Settings) { localStorage.setItem(KEY,JSON.stringify(settings)); }
