/**
 * The transport owns authentication: callers may add application headers,
 * but must not substitute a bearer from a previous account or mosque.
 * Headers normalizes case and handles Headers, tuples and plain objects.
 */
export function sessionHeaders(input:HeadersInit|undefined,saved:string|null,hasBody:boolean):Headers{
 const headers=new Headers(input);
 if(!headers.has("Accept"))headers.set("Accept","application/json");
 if(hasBody&&!headers.has("Content-Type"))headers.set("Content-Type","application/json");
 headers.delete("Authorization");
 if(saved)headers.set("Authorization","Bearer "+saved);
 return headers;
}
