const $=id=>document.getElementById(id);
async function tab(){
  const t=await chrome.tabs.query({active:true,currentWindow:true});
  if(!t[0]?.id) throw Error("Sem aba");
  return t[0];
}
function isChatGPT(url){
  try{
    const u=new URL(url);
    return u.protocol==="https:" && (u.hostname==="chatgpt.com" || u.hostname==="www.chatgpt.com" || u.hostname==="chat.openai.com");
  }catch{return false}
}
async function ensureContentScript(t){
  if(!isChatGPT(t.url)) throw Error("Abra o ChatGPT em chatgpt.com.");
  try{
    await chrome.tabs.sendMessage(t.id,{action:"PING"});
    return;
  }catch{}
  await chrome.scripting.executeScript({target:{tabId:t.id},files:["content.js"]});
  await chrome.scripting.insertCSS({target:{tabId:t.id},files:["content.css"]});
  await new Promise(r=>setTimeout(r,150));
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
  }catch(e){$("status").textContent=e.message||"Abra o ChatGPT em chatgpt.com."}
};
$("stop").onclick=async()=>{
  try{
    const t=await tab();
    await ensureContentScript(t);
    await chrome.tabs.sendMessage(t.id,{action:"STOP"});
    $("status").textContent="Parado.";
  }catch(e){$("status").textContent=e.message||"Abra o ChatGPT em chatgpt.com."}
};