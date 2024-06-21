
/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 *
 * See the getting started guide for more information
 * https://ai.google.dev/gemini-api/docs/get-started/node
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResult,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";
import { Item } from "../entities/types/Item";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.0-pro",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export class GeminiService {
  async generateForEachItem(item: Item):Promise<string> {
    const postContent = { title: item?.title, description: item?.text };
    const modifiedPrompt = `Summarize the post with fields of categories, themes, summary. categories and themes can be multiple (lowercase) but each theme / category should be max 1 word. set null for attributes that can't be generated. return as json response. here is the post: `;
    const promptString = `For a post, give me categories (array of 1 word category in lowercase) & themes (array of 1 word theme - join word by hyphen in lowercase), and summarise the content in maximum 140 characters (if context is not enough, return empty string as summary). Return empty object only if all fields can't be generated. Response in JSON format. Post: `;
    let prompt = modifiedPrompt + JSON.stringify(postContent);
    const countTokenResponse = await model.countTokens(prompt);
    if (countTokenResponse.totalTokens >= 2000) {
      prompt = modifiedPrompt + JSON.stringify({ title: item?.title });
    }
    try {
      const result = await model.generateContent(prompt);
      let response = await result.response;
      let dirtyResponse = response.text();
      let formattedResponse = dirtyResponse.substring(dirtyResponse.indexOf('{')).slice(0,-3);
      return formattedResponse;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
