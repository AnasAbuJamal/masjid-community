import React from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback} from "./ui";
import {S} from "./theme";
import {useLanguage} from "./i18n";
import type {MemberSurfaceScope} from "./searchScope";

export function MemberScopeNotice({scope,loading,error,refresh}:{
 scope:MemberSurfaceScope;loading:boolean;error:string;refresh:()=>Promise<void>;
}){
 const {language}=useLanguage();
 if(scope==="guest"||scope==="pilot")return null;
 const unavailable=scope==="limited";
 return <Card style={{gap:10}}>
  <Text accessibilityRole="header" style={S.headline}>{language==="ar"
   ?unavailable?"هذه الخدمة غير متاحة لهذا المسجد بعد":"يجب التحقق من المسجد المحدد"
   :unavailable?"Not yet available at this mosque":"Verify your selected mosque"}</Text>
  <Text style={S.bodyText}>{language==="ar"
   ?unavailable
    ?"تتوفر الصلاة والتجمعات المنشورة والحجوزات والإشعارات. لا تعرض هذه الصفحة بيانات المسجد الأساسي أثناء اختيار مسجد آخر."
    :"لن نعرض بيانات مسجد آخر حتى يتم التحقق من عضويتك النشطة."
   :unavailable
    ?"Worship, published gatherings, RSVPs and your private inbox work here. This screen will not display another mosque's records."
    :"We cannot display community records until your active mosque membership is verified."}</Text>
  {scope==="loading"?<Feedback loading={loading} error={error} empty={false} refresh={refresh}/>:null}
  <Action secondary label={language==="ar"?"تغيير المسجد":"Change mosque"} onPress={()=>router.push("/settings")}/>
 </Card>;
}
