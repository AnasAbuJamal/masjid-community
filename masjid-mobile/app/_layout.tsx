import React from "react";
import {Stack} from "expo-router";
import {SessionProvider} from "../src/session";
import {LanguageProvider} from "../src/i18n";
import {VenueProvider} from "../src/venue";
export default function Root(){
 return <LanguageProvider><SessionProvider><VenueProvider><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:"#F7FBFF"}}}>
  <Stack.Screen name="(tabs)"/><Stack.Screen name="auth"/><Stack.Screen name="details/[kind]/[id]"/>
  <Stack.Screen name="circles"/><Stack.Screen name="qibla"/><Stack.Screen name="calendar"/><Stack.Screen name="giving/[id]"/><Stack.Screen name="notifications"/><Stack.Screen name="recover"/><Stack.Screen name="contact"/><Stack.Screen name="care/request"/><Stack.Screen name="community/proposal"/><Stack.Screen name="finance/transparency"/><Stack.Screen name="school/apply/[programId]"/><Stack.Screen name="settings"/><Stack.Screen name="mfa"/><Stack.Screen name="volunteer/shifts"/><Stack.Screen name="receipt/[id]"/><Stack.Screen name="search"/><Stack.Screen name="faith"/>
 </Stack></VenueProvider></SessionProvider></LanguageProvider>;
}
