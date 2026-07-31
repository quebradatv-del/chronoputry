import { useCallback, useEffect, useRef, useState } from "react";
import type { CycleState } from "../types";
export function useAccurateTimer(duration:number,onElapsed:()=>void){
 const [cycle,setCycle]=useState<CycleState>({status:"paused",directionIndex:0,startedAt:performance.now(),duration,remaining:duration,audioPlayed:false});
 const endRef=useRef(performance.now()+duration*1000); const callbackRef=useRef(onElapsed); callbackRef.current=onElapsed;
 const start=useCallback(()=>setCycle(c=>{if(c.status==="running")return c; endRef.current=performance.now()+c.remaining*1000; return {...c,status:"running",startedAt:performance.now()};}),[]);
 const pause=useCallback(()=>setCycle(c=>({...c,status:"paused"})),[]);
 const reset=useCallback((directionIndex?:number)=>{endRef.current=performance.now()+duration*1000;setCycle(c=>({...c,directionIndex:directionIndex??c.directionIndex,startedAt:performance.now(),duration,remaining:duration,audioPlayed:false}));},[duration]);
 const adjust=useCallback((seconds:number)=>{endRef.current+=seconds*1000;setCycle(c=>({...c,remaining:Math.max(0,c.remaining+seconds)}));},[]);
 const markAudioPlayed=useCallback(()=>setCycle(c=>({...c,audioPlayed:true})),[]);
 useEffect(()=>{setCycle(c=>{const ratio=c.duration?c.remaining/c.duration:1; const remaining=Math.min(duration,duration*ratio); if(c.status==="running")endRef.current=performance.now()+remaining*1000; return {...c,duration,remaining};});},[duration]);
 useEffect(()=>{if(cycle.status!=="running")return;let frame=0;const tick=()=>{const now=performance.now();const remaining=(endRef.current-now)/1000;if(remaining<=0){callbackRef.current();endRef.current+=duration*1000;setCycle(c=>({...c,startedAt:now,duration,remaining:Math.max(0,(endRef.current-now)/1000)}));}else setCycle(c=>({...c,remaining}));frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[cycle.status,duration]);
 return {cycle,setCycle,start,pause,reset,adjust,markAudioPlayed};
}
