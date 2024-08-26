import { AppDataSource } from "./db/dataSource";
import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import { Gist } from "./entities/Gist";
import { HackerNewsService } from "./services/hacker-service";
import { GPTResponse } from "./entities/types/GPTResponse";
import { Category } from "./entities/Category";
import { Theme } from "./entities/Theme";
import { In } from "typeorm";
import { PostId } from "./entities/types/Item";
import { queryParser } from "./middleware/queryparser";
import { backoff } from './utils/exponential-fetch';
import cors from "cors";
import "reflect-metadata";
import GeminiService from "./services/gemini-service";

dotenv.config();

const app = express();
const port = 5000;

// fetch from hackernews

// check if id is already parsed

// summarise and categorise the content

// store it in postgresql
AppDataSource.initialize()
  .then((dataSource) => {
    console.log("DB connected successfully");
    const gistRepository = dataSource.getRepository(Gist);
    const categoryRepository = dataSource.getRepository(Category);
    const themeRepository = dataSource.getRepository(Theme);

    // Services needed - HackerNews & Gemini
    const hackerNewsService = new HackerNewsService();
    const geminiService = new GeminiService(); // Or your summary API service

    async function processData() {
      const allMappedPosts: PostId[] = await hackerNewsService.fetchAllPostIds();
      if (allMappedPosts.length > 0) {
        let post_count = 0;
        for (const post of allMappedPosts) {
          const itemExists = await gistRepository.existsBy({
            itemId: post.id,
          });

          // Create Gist if item doesn't exist already
          if (!itemExists) {

            console.log("creating new gist...");
            console.log("fetching each story");
            const postDetails = await hackerNewsService.getPostDetails(post.id);
            if (postDetails) {
              try {
                const itemGist = gistRepository.create();
                itemGist.categories = [];
                itemGist.themes = [];
                itemGist.summary = "";
                itemGist.by = postDetails.by;
                itemGist.itemId = post.id;
                itemGist.time = postDetails.time;
                itemGist.title = postDetails.title;
                itemGist.description = postDetails?.text || "";
                itemGist.score = postDetails?.score || 0;
                itemGist.storyURL = postDetails?.url || "";
                itemGist.descendants = postDetails?.descendants || 0;
                itemGist.type = post.type;
                itemGist.url = `https://news.ycombinator.com/item?id=${post.id}`;

                if (hackerNewsService.checkValidPost(postDetails)) {
                  console.log("fetching output from Gemini ...");
                  const aiResponse = await backoff(() => geminiService.generateForEachItem(
                    postDetails
                  ), 0, 100);
                  if (aiResponse !== null) {
                    console.log("ai " + aiResponse);
                    const response: GPTResponse = JSON.parse(aiResponse);
                    console.log("Response " + JSON.stringify(response));

                    // filter the empty "" in categories / themes
                    let categories = response.categories.filter(each => each.trim().length > 0);
                    let themes = response.themes.filter(eachTheme => eachTheme.trim().length > 0);

                    if (categories && categories.length > 0) {
                      const existingCategories = await categoryRepository.find({
                        where: {
                          name: In(categories),
                        },
                      }); // Check for existing categories

                      const newCategories = categories.filter(
                        (name) =>
                          !existingCategories.some((cat) => cat.name === name)
                      ); // Find new categories
                      if (newCategories.length) {
                        const newCategoryEntities = newCategories.map(
                          (categoryName) =>
                            categoryRepository.create({ name: categoryName })
                        );
                        const newCategoriesSaved =
                          await categoryRepository.save(newCategoryEntities);
                        itemGist.categories =
                          existingCategories.concat(newCategoriesSaved);
                      }
                    }

                    if (themes && themes.length > 0) {
                      const existingThemes = await themeRepository.find({
                        where: {
                          name: In(themes),
                        },
                      }); // Check for existing themes
                      const newThemes = themes.filter(
                        (name) =>
                          !existingThemes.some((theme) => theme.name === name)
                      ); // Find new themes

                      if (newThemes.length) {
                        const newThemeEntities = newThemes.map((themeName) =>
                          themeRepository.create({ name: themeName })
                        );
                        const newThemesSaved = await themeRepository.save(
                          newThemeEntities
                        );
                        itemGist.themes = existingThemes.concat(newThemesSaved);
                      }
                    }

                    if (response.summary && response.summary.trim().length > 0) {
                      itemGist.summary = response.summary;
                    }
                  }
                }

                // console.log(itemGist);
                console.log("saving entity ....");
                post_count += 1;
                await gistRepository.save(itemGist);
              } catch (error) {
                console.log(error);
              }
            }
          }
        }
        console.log(`${post_count} posts added at ` + new Date());
      }
    }

    // middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    const clientURLs = ["http://localhost:3000", "https://aihn.msurya.in"];
    app.use(
      cors({
        origin: clientURLs,
        credentials: true,
      })
    );

    const clientOrigin = process.env.CLIENT_URL ? clientURLs[1] : clientURLs[0];
    app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", clientOrigin);
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "1800");
      res.header("Access-Control-Allow-Headers", "content-type");
      res.header(
        "Access-Control-Allow-Methods",
        "PUT, POST, GET, DELETE, PATCH, OPTIONS"
      );
      next();
    });

    cron.schedule("*/15 * * * *", processData);

    // Endpoint to fetch results
    app.get("/results", queryParser, async (req, res) => {
      try {
        let query = gistRepository
          .createQueryBuilder("gist")
          .leftJoinAndSelect("gist.categories", "category")
          .leftJoinAndSelect("gist.themes", "theme");

        if (Object.keys(req.query).length > 0) {
          let { category, theme } = req.query;
          let categoryName = "";
          let themeName = "";
          if (
            new Object(req.query).hasOwnProperty("category") &&
            category !== null
          ) {
            categoryName = category.toString();
          }
          if (new Object(req.query).hasOwnProperty("theme") && theme !== null) {
            themeName = theme.toString();
          }

          let categoryExists = false;
          let themeExists = false;
          if (categoryName.length > 0 || themeName.length > 0) {
            if (categoryName.length > 0) {
              categoryExists = await categoryRepository.existsBy({
                name: categoryName,
              });
            }
            if (themeName.length > 0) {
              themeExists = await themeRepository.existsBy({
                name: themeName,
              });
            }
            if (categoryExists && themeExists) {
              query = query.where((qb) => {
                const subQuery = qb
                  .subQuery()
                  .select("gist.id")
                  .from(Gist, "gist")
                  .leftJoin("gist.categories", "category")
                  .leftJoin("gist.themes", "theme")
                  .where("category.name = :categoryName", {
                    categoryName: category.toString(),
                  })
                  .andWhere("theme.name = :themeName", {
                    themeName: theme.toString(),
                  })
                  .getQuery();
                return "gist.id IN " + subQuery;
              });
            } else if (categoryExists) {
              query = query.where((qb) => {
                const subQuery = qb
                  .subQuery()
                  .select("gist.id")
                  .from(Gist, "gist")
                  .leftJoin("gist.categories", "category")
                  .leftJoin("gist.themes", "theme")
                  .where("category.name = :categoryName", {
                    categoryName: category.toString(),
                  })
                  .getQuery();
                return "gist.id IN " + subQuery;
              });
            } else if (themeExists) {
              query = query.where((qb) => {
                const subQuery = qb
                  .subQuery()
                  .select("gist.id")
                  .from(Gist, "gist")
                  .leftJoin("gist.categories", "category")
                  .leftJoin("gist.themes", "theme")
                  .where("theme.name = :themeName", {
                    themeName: theme.toString(),
                  })
                  .getQuery();
                return "gist.id IN " + subQuery;
              });
            }
          }
        }
        let filteredResponse = await query
          .orderBy("created_at", "DESC")
          .getMany();
        res.json(filteredResponse);
      } catch (error) {
        console.log("Error while fetching ", error);
        res.status(401).json({ error: error });
      }
    });

    app.listen(port, () => {
      console.log(`Server is running on ${port}`);
    });
  })
  .catch((error) => console.log(error));
