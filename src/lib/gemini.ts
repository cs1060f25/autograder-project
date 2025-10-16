const API_KEY = "AIzaSyC9ms2tf0PNl7Ui9e7zOwQ9XW_euGYMm3c"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`

export async function simplifyFeedback(complexFeedback: string): Promise<string> {
  try {
    const prompt = `You are an educational assistant that helps simplify complex feedback for students.

Take the following complex feedback and rewrite it in simpler language that a middle school student (grades 6-8) can easily understand. Keep all the important points, but use:
- Shorter sentences
- Simpler vocabulary
- More direct language
- Everyday examples when helpful
- An encouraging tone

Complex Feedback:
${complexFeedback}

Simplified Feedback:`

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("API Error:", errorData)
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates[0].content.parts[0].text
    
    return text.trim()
  } catch (error) {
    console.error("Error simplifying feedback:", error)
    throw new Error("Failed to simplify feedback")
  }
}

export async function analyzeReadingLevel(text: string): Promise<string> {
  try {
    const prompt = `Analyze the reading level of the following text and respond with ONLY the grade level range in this exact format: "Grade X-Y" or "Middle School (Grade X-Y)" or "College (Grade X-Y)".

Text:
${text}

Reading Level:`

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 50,
        }
      })
    })

    if (!response.ok) {
      console.error("API Error:", response.status)
      return "Unknown"
    }

    const data = await response.json()
    const text_response = data.candidates[0].content.parts[0].text
    
    return text_response.trim()
  } catch (error) {
    console.error("Error analyzing reading level:", error)
    return "Unknown"
  }
}
