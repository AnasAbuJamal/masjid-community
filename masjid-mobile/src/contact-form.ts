/** Contact is public intake for the *configured pilot mosque* only.
 * Client checks improve feedback; the server repeats all limits and owns
 * acceptance. Never log, cache or persist a member's free-text message.
 */
export type ContactDraft={name:string;email:string;subject:string;message:string};
export type ContactValidationCode=
  "name"|"email"|"subject"|"message"|"messageTooLong"|null;

export function contactValidationCode(draft:ContactDraft):ContactValidationCode{
 const name=draft.name.trim(),email=draft.email.trim(),
       subject=draft.subject.trim(),message=draft.message.trim();
 if(name.length<2||name.length>100)return "name";
 // Basic UX check only: z.email() is the server authority.
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return "email";
 if(subject.length<3||subject.length>160)return "subject";
 if(message.length>4000)return "messageTooLong";
 if(message.length<15)return "message";
 return null;
}
