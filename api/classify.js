// Praxia Lens — función serverless (Vercel)
// Protege la API key: nunca se expone al navegador.

const SYSTEM_PROMPT = `Eres Praxia Lens, un clasificador de tareas laborales con criterio ético y transparente.
Tu misión: que la IA libere tiempo sin desplazar personas, distinguiendo con criterio ético lo que solo el humano puede hacer.

Clasifica la tarea recibida en UNA de estas tres categorías:
- "Automatizable": tareas repetitivas, estandarizadas, de bajo contacto humano y baja discreción ética.
- "Híbrida": tareas donde la IA apoya pero el juicio humano sigue siendo necesario.
- "Indispensablemente Humana": tareas que dependen de empatía, criterio ético, responsabilidad legal, creatividad o contacto humano significativo.

Evalúa SIEMPRE estos seis factores, cada uno con un nivel (Bajo / Medio / Alto) y una justificación breve (1 oración):
- complejidad_contextual
- contacto_humano
- responsabilidad_legal
- discrecion_etica
- creatividad_juicio
- repetitividad

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks, con esta forma exacta:
{
  "clasificacion": "Automatizable" | "Híbrida" | "Indispensablemente Humana",
  "resumen": "explicación breve de 2-3 oraciones",
  "factores": {
    "complejidad_contextual": {"nivel": "...", "justificacion": "..."},
    "contacto_humano": {"nivel": "...", "justificacion": "..."},
    "responsabilidad_legal": {"nivel": "...", "justificacion": "..."},
    "discrecion_etica": {"nivel": "...", "justificacion": "..."},
    "creatividad_juicio": {"nivel": "...", "justificacion": "..."},
    "repetitividad": {"nivel": "...", "justificacion": "..."}
  }
}`;

export default async function handler(req, res){
  if(req.method !== "POST"){
    return res.status(405).json({ error: "Método no permitido." });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if(!apiKey){
    return res.status(500).json({ error: "Falta configurar la llave del servidor." });
  }

  try{
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const task = (body.task || "").toString().trim();
    const fileData = body.fileData, fileType = body.fileType;

    if(!task && !fileData){
      return res.status(400).json({ error: "No se recibió ninguna tarea ni documento." });
    }

    // Construye el contenido del mensaje (texto y, si hay, documento/imagen)
    const content = [];
    if(fileData && fileType === "application/pdf"){
      content.push({ type:"document", source:{ type:"base64", media_type:"application/pdf", data:fileData }});
    } else if(fileData && (fileType === "image/png" || fileType === "image/jpeg")){
      content.push({ type:"image", source:{ type:"base64", media_type:fileType, data:fileData }});
    }
    content.push({ type:"text", text: task ? `Tarea a evaluar: "${task}"` : "Analiza y clasifica la tarea o función descrita en el documento adjunto." });

    const r = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{
        "content-type":"application/json",
        "x-api-key":apiKey,
        "anthropic-version":"2023-06-01"
      },
      body:JSON.stringify({
        model:"claude-haiku-4-5",
        max_tokens:1000,
        system:SYSTEM_PROMPT,
        messages:[{ role:"user", content }]
      })
    });

    const data = await r.json();
    if(!r.ok){
      return res.status(502).json({ error:"Error del modelo: " + (data?.error?.message || r.status) });
    }

    const text = (data.content || [])
      .map(b => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    let parsed;
    try{ parsed = JSON.parse(text); }
    catch{ return res.status(502).json({ error:"El modelo no devolvió un JSON válido." }); }

    return res.status(200).json(parsed);
  }catch(e){
    return res.status(500).json({ error:"Error inesperado en el servidor." });
  }
}
