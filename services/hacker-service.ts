import axios from "axios";
import { Item, PostId } from "../entities/types/Item";

export class HackerNewsService {
  baseUrl: string = 'https://hacker-news.firebaseio.com/v0';

  private async getPosts(type: string): Promise<number[]> {
    const URL = this.baseUrl+`/${type}stories.json`;
    // console.log(URL)
    try {
      const response = await axios.get(URL);
      return response.data;
    } catch (error) {
      console.log(`Error fetching ${type} posts: ` + error.errors);
      return null;
    }
  }
  async getTopPosts(): Promise<number[]> {
    return this.getPosts("top");
  }
  async getAskPosts(): Promise<number[]> {
    return this.getPosts("ask");
  }
  async getShowPosts(): Promise<number[]> {
    return this.getPosts("show");
  }
  async getJobPosts(): Promise<number[]> {
    return this.getPosts("job");
  }

  async fetchAllPostIds(): Promise<PostId[]> {
    try {

      console.log("fetching top stories ....");
      const topPosts = (await this.getTopPosts()).slice(0,5);
  
      console.log("fetching ask stories ....");
      const askPosts = (await this.getAskPosts()).slice(0,5);
  
      console.log("fetching show stories ....");
      const showPosts = (await this.getShowPosts()).slice(0,5);
  
      console.log("fetching job stories ....");
      const jobPosts = (await this.getJobPosts()).slice(0,5);
  
      let allPostIds: PostId[] = null;
  
      allPostIds = [].concat(
        topPosts &&
          topPosts.map((eachId) => ({
            id: eachId,
            type: "top",
          })),
        askPosts &&
          askPosts.map((eachId) => ({
            id: eachId,
            type: "ask",
          })),
        showPosts &&
          showPosts.map((eachId) => ({
            id: eachId,
            type: "show",
          })),
        jobPosts &&
          jobPosts.map((eachId) => ({
            id: eachId,
            type: "job",
          }))
      );
  
      return allPostIds;
    } catch(error){
      console.log(`Error while fetching types of posts `, error);
      return null;
    }
  }

  async getPostDetails(postId: number): Promise<Item | null> {
    try {
      const response = await axios.get(
        this.baseUrl+`/item/${postId}.json?print=pretty`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching post details:", error);
      return null;
    }
  }
}
