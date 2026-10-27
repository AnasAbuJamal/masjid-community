import React from "react";
import {Stack} from "expo-router";
import {SessionProvider} from "../src/session";
export default function Root(){
 return <SessionProvider><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:"#F7FBFF"}}}>
  <Stack.Screen name="(tabs)"/><Stack.Screen name="auth"/><Stack.Screen name="details/[kind]/[id]"/>
  <Stack.Screen name="qibla"/><Stack.Screen name="calendar"/><Stack.Screen name="giving/[id]"/><Stack.Screen name="notifications"/><Stack.Screen name="recover"/>
 </Stack></SessionProvider>;
}
