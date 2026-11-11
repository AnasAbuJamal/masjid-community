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
  <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>{children}</ScrollView>
 </LinearGradient></SafeAreaView>;
}
export function Head({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle?:string}){
 const {isRTL}=useLanguage();const align=isRTL?"right":"left";
 return <View style={{gap:8,marginBottom:5}}><Text style={[S.overline,{textAlign:align}]}>{eyebrow.toUpperCase()}</Text>
 <Text accessibilityRole="header" style={[S.title,{textAlign:align}]}>{title}</Text>{subtitle?<Text style={[S.bodyText,{textAlign:align}]}>{subtitle}</Text>:null}</View>;
}
export function Card({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){
 return <View style={[S.glass,style]}>{children}</View>;
}
// Mirror reading/navigation symbols only. Physical arrows can opt out explicitly.
const navigationMirrors:Partial<Record<Icon,Icon>>={"arrow-left":"arrow-right","arrow-right":"arrow-left","chevron-left":"chevron-right","chevron-right":"chevron-left"};
export function Action({label,onPress,secondary=false,disabled=false,icon,loading=false,iconDirection="semantic"}:{label:string;onPress:()=>void;secondary?:boolean;disabled?:boolean;icon?:Icon;loading?:boolean;iconDirection?:"semantic"|"physical"}){
 const {isRTL}=useLanguage();
 const blocked=disabled||loading;
 const displayIcon=icon&&isRTL&&iconDirection==="semantic"?(navigationMirrors[icon]||icon):icon;
 const content=<>{loading?<ActivityIndicator accessible={false} color={secondary?T.deep:"#fff"}/>:displayIcon?<MaterialCommunityIcons accessible={false} importantForAccessibility="no" name={displayIcon} size={20} color={secondary?T.deep:"#fff"}/>:null}
  <Text style={{color:secondary?T.deep:"#fff",fontWeight:"800",fontSize:14,flexShrink:1,textAlign:"center"}}>{label}</Text></>;
 return <Pressable accessible accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled:blocked,busy:loading}} onPress={onPress} disabled={blocked}
 style={({pressed})=>[S.controlTarget,{opacity:blocked ? 0.5 : pressed ? 0.82 : 1,transform:[{scale:pressed&&!blocked ? 0.99 : 1}]}]}>
  {secondary?<View style={{minHeight:50,justifyContent:"center",alignItems:"center",flexDirection:isRTL?"row-reverse":"row",gap:10,paddingHorizontal:16,paddingVertical:12,borderRadius:16,borderColor:"#BBDCF3",borderWidth:1,backgroundColor:"#F1F9FF"}}>{content}</View>
  :<LinearGradient colors={["#236FB8","#77BEED"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{minHeight:51,borderRadius:16,alignItems:"center",justifyContent:"center",flexDirection:isRTL?"row-reverse":"row",gap:9,paddingHorizontal:17,paddingVertical:12,borderWidth:1,borderColor:"#B8E0F9"}}>{content}</LinearGradient>}
 </Pressable>;
}
export function PressRow({title,subtitle,icon,onPress,disabled=false,loading=false}:{title:string;subtitle?:string;icon:Icon;onPress:()=>void;disabled?:boolean;loading?:boolean}){
 const {isRTL}=useLanguage();const blocked=disabled||loading;
 return <Pressable accessible accessibilityRole="button" accessibilityLabel={[title,subtitle].filter(Boolean).join(". ")} accessibilityState={{disabled:blocked,busy:loading}} disabled={blocked} onPress={onPress} style={({pressed})=>[S.controlTarget,S.cardRow,{paddingVertical:13,flexDirection:isRTL?"row-reverse":"row",opacity:blocked ? 0.5 : pressed ? 0.62 : 1}]}>
  <View style={{height:45,width:45,borderRadius:15,backgroundColor:T.ice,alignItems:"center",justifyContent:"center"}}><MaterialCommunityIcons accessible={false} importantForAccessibility="no" name={icon} size={23} color={T.blue}/></View>
  <View style={{flex:1,gap:3}}><Text style={[S.label,{textAlign:isRTL?"right":"left"}]}>{title}</Text>{subtitle?<Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>{subtitle}</Text>:null}</View>
  {loading?<ActivityIndicator accessible={false} color={T.blue}/>:<MaterialCommunityIcons accessible={false} importantForAccessibility="no" name={isRTL?"chevron-left":"chevron-right"} size={23} color={T.muted}/>}
 </Pressable>;
}
export function Feedback({loading,error,empty,refresh}:{loading:boolean;error:string;empty:boolean;refresh:()=>void}){
 const {t}=useLanguage();
 if(loading)return <Card><ActivityIndicator color={T.blue}/><Text style={[S.muted,{textAlign:"center",marginTop:12}]}>{t("feedback.loading")}</Text></Card>;
 if(error)return <Card><Text style={S.label}>{t("feedback.failed")}</Text><Text style={[S.muted,{marginVertical:12}]}>{error}</Text><Action label={t("feedback.retry")} onPress={refresh} secondary icon="refresh"/></Card>;
 if(empty)return <Card><Text style={S.label}>{t("feedback.empty")}</Text><Text style={[S.muted,{marginTop:8}]}>{t("feedback.emptyDesc")}</Text></Card>;
 return null;
}
export function Field({label,value,onChange,secure=false,keyboardType,multiline=false,error,hint,disabled=false}:{label:string;value:string;onChange:(v:string)=>void;secure?:boolean;keyboardType?:"email-address"|"default"|"numeric";multiline?:boolean;error?:string;hint?:string;disabled?:boolean}){
 const {isRTL}=useLanguage();const labelId=React.useId();
 const align=isRTL&&!secure&&keyboardType!=="email-address"&&keyboardType!=="numeric"?"right":"left";
 const privateInput=secure||keyboardType==="email-address";
 return <View style={{gap:7}}><Text nativeID={labelId} style={[S.label,{textAlign:isRTL?"right":"left"}]}>{label}</Text><TextInput accessibilityLabel={label} accessibilityLabelledBy={labelId} accessibilityHint={[hint,error].filter(Boolean).join(". ")||undefined} accessibilityState={{disabled}} editable={!disabled} value={value} onChangeText={onChange}
  secureTextEntry={secure} autoCapitalize={privateInput?"none":"sentences"} autoCorrect={privateInput?false:undefined} spellCheck={privateInput?false:undefined} keyboardType={secure?"default":keyboardType||"default"}
  multiline={multiline&&!secure} style={[S.input,{textAlign:align},error?{borderColor:T.danger}:{},disabled?{opacity:0.5}:{},multiline&&!secure?{minHeight:105,textAlignVertical:"top"}:{}]}/>
  {hint?<Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>{hint}</Text>:null}
  {error?<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[S.muted,{color:T.danger,textAlign:isRTL?"right":"left"}]}>{error}</Text>:null}
 </View>;
}
