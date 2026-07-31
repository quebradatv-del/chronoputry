import { useEffect, useState } from "react"; import type { Settings } from "../types"; import { loadSettings, saveSettings } from "../services/settingsService";
export function useSettings(){ const [settings,setSettings]=useState<Settings>(loadSettings); useEffect(()=>saveSettings(settings),[settings]); return {settings,setSettings}; }
