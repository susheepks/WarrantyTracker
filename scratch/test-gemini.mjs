import { GoogleGenerativeAI } from '@google/generative-ai'

async function run() {
  try {
    const key = process.env.GEMINI_API_KEY
    console.log("Key starts with:", key.substring(0, 5))
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
    const result = await model.generateContent("Hello")
    console.log("Success:", result.response.text())
  } catch (err) {
    console.error("Failed:", err.message)
  }
}
run()
