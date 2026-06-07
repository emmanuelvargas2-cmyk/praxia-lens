// Función serverless (Vercel). Vive en /api/classify y guarda la llave en secreto.
// El navegador del visitante NUNCA ve la llave: solo habla con esta función.

const SYSTEM_PROMPT = `Eres el motor de clasificación de "Praxia Lens", una herramienta de gobernanza ética que ayuda a las organizaciones (sobre todo PyMEs y entidades con fondos públicos) a discernir qué tareas laborales son idóneas para automatizarse con IA y cuáles deben permanecer humanas.

Tu misión: que la IA libere tiempo sin desplazar personas, distinguiendo con criterio ético lo que solo el ser humano puede hacer. NO emites un veredicto operativo: facilitas un juicio que un humano verá, cuestionará y firmará.

Analiza la tarea que te entregue el usuario contra estos seis factores (cada uno medido 0-100 según cuán presente está en la tarea):
- "Contacto humano": empatía, trato directo, relación significativa con personas. Empuja a HUMANO.
- "Discreción ética": juicio de valores, decisiones moralmente cargadas. Empuja a HUMANO.
- "Responsabilidad legal": consecuencias legales o sobre la trayectoria de personas. Empuja a HUMANO.
- "Complejidad contextual": ambigüedad, casos no estandarizables. Empuja a HUMANO.
- "Presencia física": inspecciones, movimiento, destreza corporal en sitio. Empuja a HUMANO.
- "Repetitividad / estructura": reglas claras, alto volumen, datos estructurados. Empuja a AUTOMATIZABLE.

Calcula un "indice_automatizacion" de 0 a 100 (100 = muy apta para automatizar; 0 = esencialmente humana). Clasifica así:
- 67-100 => "Automatizable"
- 34-66 => "Híbrida"
- 0-33 => "Indispensablemente Humana"

Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin markdown, con esta forma exacta:
{
  "indice_automatizacion": <entero 0-100>,
  "clasificacion": "Automatizable" | "Híbrida" | "Indispensablemente Humana",
  "factores": [
    {"nombre": "Contacto humano", "presencia": <0-100>, "direccion": "humano", "nota": "<frase muy breve>"},
    {"nombre": "Discreción ética", "presencia": <0-100>, "direccion": "humano", "nota": "<frase muy breve>"},
    {"nombre": "Responsabilidad legal", "presencia": <0-100>, "direccion": "humano", "nota": "<frase muy breve>"},
    {"nombre": "Complejidad contextual", "presencia": <0-100>, "direccion": "humano", "nota": "<frase muy breve>"},
    {"nombre": "Presencia física", "presencia": <0-100>, "direccion": "humano", "nota": "<frase muy breve>"},
    {"nombre": "Repetitividad / estructura", "presencia": <0-100>, "direccion": "automatiza", "nota": "<frase muy breve>"}
  ],
  "explicacion": "<2 a 3 oraciones en español que justifiquen la clasificación, en lenguaje claro>",
  "riesgos_eticos": ["<riesgo 1 breve>", "<riesgo 2 breve>"],
  "gobernanza": "<recordatorio breve de que esta clasificación es un insumo, requiere revisión humana y nunca puede ser base única de una decisión de personal>"
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en el host." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const task = (body.task || "").toString().trim();
    if (!task) return res.status(400).json({ error: "No se recibió ninguna tarea." });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Tarea a evaluar: "${task}"` }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: "Error del modelo: " + (data?.error?.message || r.status) });
    }

    const text = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    let parsed;
    try { parsed = JSON.parse(text); }
    catch { return res.status(502).json({ error: "El modelo no devolvió un JSON válido." }); }

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: "Error inesperado en el servidor." });
  }
}
