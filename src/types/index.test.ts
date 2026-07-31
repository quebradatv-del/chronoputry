import { describe, expect, it } from "vitest"; import { directions } from ".";
describe("directions",()=>{it("mantém a sequência única especificada",()=>expect(directions.map(d=>d.label)).toEqual(["Norte","Direita","Sul","Esquerda"]));});
