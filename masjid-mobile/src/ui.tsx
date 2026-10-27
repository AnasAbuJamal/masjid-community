import React from "react";
import {ActivityIndicator,Pressable,ScrollView,StyleProp,Text,TextInput,View,ViewStyle} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {S,T} from "./theme";
import {useLanguage} from "./i18n";
type Icon=React.ComponentProps<typeof MaterialCommunityIcons>["name"];
export function Shell({children}:{children:React.ReactNode}){
 return <SafeAreaView edges={["top"]} style={S.screen}><LinearGradient colors={["#FFFFFF","#F0F9FF","#E6F3FF"]} style={{flex:1}}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>{children}</ScrollView>
 </LinearGradient></SafeAreaView>;
}
export function Head({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle?:string}){
 const {isRTL}=useLanguage();const align=isRTL?"right":"left";
 return <View style={{gap:8,marginBottom:5}}><Text style={[S.overline,{textAlign:align}]}>{eyebrow.toUpperCase()}</Text>
 <Text style={[S.title,{textAlign:align}]}>{title}</Text>{subtitle?<Text style={[S.bodyText,{textAlign:align}]}>{subtitle}</Text>:null}</View>;
}
export function Card({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){
 return <View style={[S.glass,style]}>{children}</View>;
}
export function Action({label,onPress,secondary=false,disabled=false,icon,loading=false}:{label:string;onPress:()=>void;secondary?:boolean;disabled?:boolean;icon?:Icon;loading?:boolean}){
 const {isRTL}=useLanguage();
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled:disabled||loading,busy:loading}} onPress={onPress} disabled={disabled||loading}
 style={({pressed})=>[{opacity:disabled ? 0.5 : pressed ? 0.82 : 1,transform:[{scale:pressed ? 0.99 : 1}]}]}>
  {secondary?<View style={{minHeight:50,justifyContent:"center",alignItems:"center",flexDirection:isRTL?"row-reverse":"row",gap:10,paddingHorizontal:16,borderRadius:16,borderColor:"#BBDCF3",borderWidth:1,backgroundColor:"#F1F9FF"}}>
    {icon?<MaterialCommunityIcons name={icon} size={20} color={T.deep}/>:null}<Text style={{color:T.deep,fontWeight:"800",fontSize:14}}>{label}</Text>
  </View>:<LinearGradient colors={["#236FB8","#77BEED"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{minHeight:51,borderRadius:16,alignItems:"center",justifyContent:"center",flexDirection:isRTL?"row-reverse":"row",gap:9,paddingHorizontal:17,borderWidth:1,borderColor:"#B8E0F9"}}>
    {loading?<ActivityIndicator color="#fff"/>:icon?<MaterialCommunityIcons name={icon} size={19} color="#fff"/>:null}
    <Text style={{color:"#fff",fontWeight:"800",fontSize:14}}>{label}</Text>
  </LinearGradient>}
 </Pressable>;
}
export function PressRow({title,subtitle,icon,onPress}:{title:string;subtitle?:string;icon:Icon;onPress:()=>void}){
 const {isRTL}=useLanguage();
 return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed})=>[S.cardRow,{paddingVertical:13,flexDirection:isRTL?"row-reverse":"row",opacity:pressed ? 0.62 : 1}]}>
  <View style={{height:45,width:45,borderRadius:15,backgroundColor:T.ice,alignItems:"center",justifyContent:"center"}}><MaterialCommunityIcons name={icon} size={23} color={T.blue}/></View>
  <View style={{flex:1,gap:3}}><Text style={[S.label,{textAlign:isRTL?"right":"left"}]}>{title}</Text>{subtitle?<Text style={[S.muted,{textAlign:isRTL?"right":"left"}]} numberOfLines={2}>{subtitle}</Text>:null}</View>
  <MaterialCommunityIcons name={isRTL?"chevron-left":"chevron-right"} size={23} color={T.muted}/>
 </Pressable>;
}
export function Feedback({loading,error,empty,refresh}:{loading:boolean;error:string;empty:boolean;refresh:()=>void}){
 const {t}=useLanguage();
 if(loading)return <Card><ActivityIndicator color={T.blue}/><Text style={[S.muted,{textAlign:"center",marginTop:12}]}>{t("feedback.loading")}</Text></Card>;
 if(error)return <Card><Text style={S.label}>{t("feedback.failed")}</Text><Text style={[S.muted,{marginVertical:12}]}>{error}</Text><Action label={t("feedback.retry")} onPress={refresh} secondary icon="refresh"/></Card>;
 if(empty)return <Card><Text style={S.label}>{t("feedback.empty")}</Text><Text style={[S.muted,{marginTop:8}]}>{t("feedback.emptyDesc")}</Text></Card>;
 return null;
}
export function Field({label,value,onChange,secure=false,keyboardType,multiline=false}:{label:string;value:string;onChange:(v:string)=>void;secure?:boolean;keyboardType?:"email-address"|"default"|"numeric";multiline?:boolean}){
 const {isRTL}=useLanguage();const align=isRTL&&keyboardType!=="email-address"&&keyboardType!=="numeric"?"right":"left";
 return <View style={{gap:7}}><Text style={[S.label,{textAlign:isRTL?"right":"left"}]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange}
  secureTextEntry={secure} autoCapitalize={keyboardType==="email-address"?"none":"sentences"} keyboardType={keyboardType||"default"}
  multiline={multiline} style={[S.input,{textAlign:align},multiline?{minHeight:105,textAlignVertical:"top"}:{}]}/></View>;
}
