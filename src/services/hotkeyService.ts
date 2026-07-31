import type { HotkeyAction, Hotkeys } from "../types";
export async function registerHotkeys(hotkeys:Hotkeys,handlers:Record<HotkeyAction,()=>void>){
 const {register,unregisterAll}=await import("@tauri-apps/plugin-global-shortcut"); await unregisterAll();
 const entries=Object.entries(hotkeys) as [HotkeyAction,string][]; const duplicates=entries.filter(([,key],i)=>entries.findIndex(([,other])=>other.toLowerCase()===key.toLowerCase())!==i);
 if(duplicates.length)throw new Error("Há atalhos duplicados. Escolha teclas diferentes.");
 for(const [action,key] of entries){try{await register(key,event=>{if(event.state==="Pressed")handlers[action]();});}catch{throw new Error(`Não foi possível registrar ${key}. A tecla pode estar em uso por outro aplicativo.`);}}
 return unregisterAll;
}
