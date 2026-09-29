const $=id=>document.getElementById(id);
async function tab(){
  const t=await chrome.tabs.query({active:true,currentWindow:true});
  if(!t[0]?.id) throw Error("Nenhuma aba ativa.");
  return t[0];
}
function isChatGPT(url){
  try{
    const u=new URL(url);
    return u.protocol==="https:" && ["chatgpt.com","www.chatgpt.com","chat.openai.com","www.chat.openai.com"].includes(u.hostname);
  }catch{return false}
}
async function ensureContentScript(t){
  if(!isChatGPT(t.url)) throw Error("Abra o ChatGPT em chatgpt.com.");
  for(let attempt=0;attempt<3;attempt++){
    try{
      const ping=await chrome.tabs.sendMessage(t.id,{action:"PING"});
      if(ping?.ok)return;
    }catch{}
    try{await chrome.scripting.executeScript({target:{tabId:t.id},files:["content.js"]});}catch(e){}
    await new Promise(r=>setTimeout(r,250));
  }
  throw Error("Não consegui conectar à aba do ChatGPT. Recarregue a página e tente novamente.");
}
$("infinite").onchange=()=>{$("repeats").disabled=$("infinite").checked};
$("start").onclick=async()=>{
  try{
    const t=await tab();
    const message=$("message").value.trim();
    if(!message){$("status").textContent="Digite uma mensagem.";return}
    await ensureContentScript(t);
    const r=await chrome.tabs.sendMessage(t.id,{action:"START",message,repeats:Number($("repeats").value)||1,delay:Number($("delay").value)||0,infinite:$("infinite").checked});
    $("status").textContent=r?.ok?"Automação iniciada.":(r?.error||"Falhou.");
  }catch(e){$("status").textContent=e.message||"Erro ao conectar ao ChatGPT."}
};
$("stop").onclick=async()=>{
  try{
    const t=await tab();
    await ensureContentScript(t);
    await chrome.tabs.sendMessage(t.id,{action:"STOP"});
    $("status").textContent="Parado.";
  }catch(e){$("status").textContent=e.message||"Erro ao conectar ao ChatGPT."}
};