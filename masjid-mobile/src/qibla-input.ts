/**
 * A permission-free fallback for Qibla calculation.
 *
 * Accept only two explicit latitude/longitude decimal numbers. Do not
 * geocode addresses, infer a location from device settings, persist
 * coordinates or send typed coordinates to the mosque API.
 *
 * Arabic-Indic and Eastern Arabic-Indic numerals are normalized in memory.
 */
export type QiblaCoordinates={latitude:number;longitude:number};

function normalizeCoordinate(input:string):string{
  return input.trim()
    .replace(/[٠-٩]/g,ch=>String(ch.charCodeAt(0)-0x0660))
    .replace(/[۰-۹]/g,ch=>String(ch.charCodeAt(0)-0x06f0))
    .replace(/٫/g,".")
    .replace(/−/g,"-");
}

function decimalCoordinate(input:string,max:number):number|null{
  const value=normalizeCoordinate(input);
  // Decimal degrees only; no exponents, HTML, Infinity, grouping separators,
  // coordinates mixed in one field or ambiguous DMS representations.
  if(!/^[+-]?(?:\d{1,3}(?:\.\d{1,7})?|\.\d{1,7})$/.test(value))return null;
  const number=Number(value);
  return Number.isFinite(number)&&Math.abs(number)<=max?number:null;
}

export function parseQiblaCoordinates(
 latitudeText:string,longitudeText:string
):QiblaCoordinates|null{
  const latitude=decimalCoordinate(latitudeText,90);
  const longitude=decimalCoordinate(longitudeText,180);
  if(latitude===null||longitude===null)return null;
  return {latitude,longitude};
}
