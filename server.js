const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = 3000;

const SHEET_ID = "17AlSp8QqY3_YmW9bb1W-fMg9m7FFBxtYKXc2Cr9fq3A";
const GID = "1037993780";

// ===== Load Google Sheet =====
async function loadSheet(){
  const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  const {data}=await axios.get(url);
  return data.split(/\r?\n/).map(r=>r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'')));
}

// ===== IMAGE PROXY =====
app.get("/img/:id", async(req,res)=>{
  try{
    const drive=`https://drive.google.com/uc?export=view&id=${req.params.id}`;
    const img=await axios.get(drive,{responseType:"arraybuffer"});
    res.set("Content-Type","image/jpeg");
    res.send(img.data);
  }catch{
    res.status(404).send("No image");
  }
});

// ===== ASK =====
app.post("/ask", async(req,res)=>{

  const q=(req.body.question||"").trim();
  if(!/^\d+$/.test(q)) return res.json({reply:"সিল নাম্বার লিখুন"});

  const db=await loadSheet();
  const row=db.slice(1).find(r=>r[1]===q);

  if(!row) return res.json({reply:`${q} সিল পাওয়া যায়নি`});

  let img=row[2]||"";
  const party=row[3]||"N/A";
  const quality=row[4]||"N/A";
  const construction=row[5]||"N/A";
  const lot=row[6]||"N/A";

  let imgLine="";
  if(img.includes("drive.google.com")){
    const id=img.match(/[-\w]{25,}/);
    if(id) imgLine=`\nIMAGE:/img/${id[0]}`;
  }

  res.json({
    reply:
`📊 SILL ${q}
👤 Party: ${party}
🧵 Quality: ${quality}
🧶 Construction: ${construction}
📦 Lot: ${lot}${imgLine}`
  });

});

app.listen(PORT,()=>console.log("RUNNING "+PORT));
