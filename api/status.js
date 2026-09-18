export default function handler(req,res) {
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify({aiConfigured:Boolean(process.env.GROQ_API_KEY&&process.env.STUDY_ACCESS_TOKEN),model:process.env.GROQ_MODEL||'openai/gpt-oss-120b'}));
}
