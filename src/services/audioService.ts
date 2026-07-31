import type { DirectionId } from "../types";
let current:HTMLAudioElement|null=null;
export async function playCue(id:DirectionId,label:string,path:string,volume:number){
 if(current){current.pause();current=null;} if(path){ try { const {convertFileSrc}=await import("@tauri-apps/api/core"); current=new Audio(convertFileSrc(path));current.volume=volume;await current.play();return; } catch(error){throw new Error(`Não foi possível tocar o áudio de ${label}: ${error instanceof Error?error.message:"arquivo inválido"}`);} }
 if("speechSynthesis" in window){speechSynthesis.cancel();const cue=new SpeechSynthesisUtterance(label);cue.lang="pt-BR";cue.volume=volume;speechSynthesis.speak(cue);}
}
