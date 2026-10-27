// Initial great-circle bearing in degrees clockwise from true north.
export function bearingToKaaba(latitude:number,longitude:number):number{
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw new Error("Invalid location.");
 const rad=(d:number)=>d*Math.PI/180;
 const kaabaLat=rad(21.4225),deltaLon=rad(39.8262-longitude),lat=rad(latitude);
 const y=Math.sin(deltaLon)*Math.cos(kaabaLat);
 const x=Math.cos(lat)*Math.sin(kaabaLat)-Math.sin(lat)*Math.cos(kaabaLat)*Math.cos(deltaLon);
 return (Math.atan2(y,x)*180/Math.PI+360)%360;
}
