
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
import { config } from "dotenv";

config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];
const model = genAI.getGenerativeModel({
  model: "gemini-1.0-pro", safetySettings
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export default class GeminiService {
  async generateForEachItem(item: Item):Promise<string> {
    const postContent = { title: item?.title, description: item?.text, story: item?.url };
    const modifiedPrompt = `Each post has to be summarized into categories, themes & summary only. categories and themes can be multiple (lowercase) but each theme / category should be max 1 word. Use the storyURL to give best summary under 1 sentence. set null for attributes that can't be generated. return as json response. here are the posts: `;
    const randomPrompt = `I have a post which needs to be summarized with themes, categories & summary. Use the title, description, storyURL to get the best info. categories / themes can be multiple but each theme / category should not be more than 2words. set null for those which can't be generated. return a json response. here is the post: `;
    const promptString = `For a post, give me categories (array of 1 word category in lowercase) & themes (array of 1 word theme - join word by hyphen in lowercase), and summarise the content in maximum 140 characters (if context is not enough, return empty string as summary). Return empty object only if all fields can't be generated. Response in JSON format. Post: `;
    // let prompt = modifiedPrompt + JSON.stringify(postContent);
    let prompt = modifiedPrompt + JSON.stringify(postContent);
    const countTokenResponse = await model.countTokens(prompt);
    console.log(`tokens used is ${countTokenResponse.totalTokens}`);
    if (countTokenResponse.totalTokens > 5000) {
      prompt = modifiedPrompt + JSON.stringify({ title: item?.title });
    }
    // try {
      const result = await model.generateContent(prompt);
      let response = await result.response;
      let dirtyResponse = response.text();
      let formattedResponse = dirtyResponse.substring(dirtyResponse.indexOf('{'), dirtyResponse.lastIndexOf('}')+1);
      return formattedResponse;
    // } catch (error) {
    //   console.log(error);
    //   return null;
    // }
  }
}
