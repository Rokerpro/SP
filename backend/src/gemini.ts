export interface AskGeminiOptions {
  prompt: string
  lesson?: {
    title?: string
    topic?: string
    explanation?: string
    category?: string
  } | null
}

export async function askGemini(options: AskGeminiOptions): Promise<string> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'replace-with-your-key') {
    return '⚠️ Gemini API key is not configured. Please add your GEMINI_API_KEY to the .env file in the project root to enable live AI responses.'
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash'
  const fallbackModel = 'gemini-1.5-flash'

  const systemInstruction = `You are Bolt AI, an engaging, encouraging, and crystal-clear micro-learning tutor.
Your goal is to explain concepts simply, intuitively, and accurately to curious students.
Provide a clear, engaging explanation in 2 to 3 concise paragraphs or bullet points, using intuitive real-world examples or analogies where helpful.
Format your answer with clean readable text.`

  let userText = options.prompt
  if (options.lesson) {
    const parts: string[] = []
    if (options.lesson.title) parts.push(`Topic: ${options.lesson.title}`)
    if (options.lesson.category) parts.push(`Category: ${options.lesson.category}`)
    if (options.lesson.explanation) parts.push(`Reel context: ${options.lesson.explanation}`)
    userText = `Current context from learner's reel:\n${parts.join('\n')}\n\nLearner question: ${options.prompt}`
  }

  const callModel = async (selectedModel: string) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: userText }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      let message = errText
      try {
        const json = JSON.parse(errText)
        message = json.error?.message || errText
      } catch {}
      throw new Error(`Gemini API returned status ${response.status}: ${message}`)
    }

    const data = (await response.json()) as any
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!candidateText) {
      throw new Error('Gemini returned an empty answer.')
    }
    return candidateText
  }

  try {
    return await callModel(model)
  } catch (error: any) {
    // If preferred model is not found, fallback to gemini-1.5-flash
    if (model !== fallbackModel && (error.message?.includes('404') || error.message?.toLowerCase().includes('not found'))) {
      try {
        return await callModel(fallbackModel)
      } catch (fallbackError: any) {
        throw new Error(fallbackError.message || 'Gemini fallback failed')
      }
    }
    throw error
  }
}
