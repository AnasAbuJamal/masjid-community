import { StyleSheet } from "react-native";
export const T={
 bg:"#F7FBFF",card:"#FFFFFF",ice:"#EAF6FF",blue:"#287FCB",deep:"#15588E",
 ink:"#122B43",muted:"#526B7D",line:"#D7EAF8",soft:"#F0F9FF",
 success:"#177550",danger:"#BD3040",white:"#FFFFFF",
};
export const S=StyleSheet.create({
 screen:{flex:1,backgroundColor:T.bg},
 body:{paddingHorizontal:21,paddingTop:24,paddingBottom:36,gap:20},
 overline:{fontSize:11,letterSpacing:2.3,color:T.deep,fontWeight:"800"},
 title:{fontSize:34,fontWeight:"800",color:T.ink,letterSpacing:-1.1,lineHeight:40},
 headline:{fontSize:23,fontWeight:"800",color:T.ink,letterSpacing:-.65},
 bodyText:{fontSize:15,lineHeight:23,color:T.muted},
 value:{fontSize:26,fontWeight:"800",color:T.ink},
 row:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},
 label:{fontSize:14,color:T.ink,fontWeight:"700"},
 muted:{fontSize:13,color:T.muted,lineHeight:20},
 glass:{backgroundColor:"rgba(255,255,255,.92)",borderWidth:1,borderColor:"#D6EAF8",borderRadius:24,padding:20,shadowColor:"#245C8E",shadowOpacity:.07,shadowOffset:{width:0,height:9},shadowRadius:20,elevation:3},
 section:{gap:13},
 cardRow:{flexDirection:"row",alignItems:"center",gap:14},
 chip:{borderWidth:1,borderColor:T.line,backgroundColor:T.soft,paddingHorizontal:13,paddingVertical:8,borderRadius:99},
 chipText:{fontSize:12,fontWeight:"700",color:T.deep},
 input:{minHeight:52,borderColor:"#BEDBF0",borderWidth:1.3,borderRadius:16,paddingHorizontal:15,color:T.ink,backgroundColor:T.white,fontSize:16},
});
