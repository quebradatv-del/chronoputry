import { directions } from "../types";
export function DirectionDisplay({index,showLabel}:{index:number;showLabel:boolean}){const d=directions[index];return <section className="direction" aria-live="polite"><div className="arrow" aria-label={`Direção ${d.label}`}>{d.arrow}</div>{showLabel&&<div className="direction-name">{d.label}</div>}</section>}
