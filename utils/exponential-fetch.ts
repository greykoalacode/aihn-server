// import GeminiService from "../services/gemini-service.js";

// const gemini = new GeminiService();

// const item = {
//     id: 41346778,
//     title: "NASA's Starliner decision was the right one, but it's a crushing blow for Boeing",
//     description: "",
//     storyURL: "https://arstechnica.com/space/2024/08/after-latest-starliner-setback-will-boeing-ever-deliver-on-its-crew-contract/"
// };

// const items = Array(10).fill(item);

const MAX_RETRIES = 10;

export const backoff = async (execute: () => Promise<any>, retry, delay) : Promise<any> => {
    return new Promise((resolve, reject) => setTimeout(async () => {
        try {
            let result = await execute();
            resolve(result);
        } catch (error) {
            console.log(error);
            if (retry < MAX_RETRIES) {
                console.log(`Failed! ${retry + 1} Retry after ${delay} ms`)
                resolve(backoff(execute, retry + 1, delay * 2));
            } else {
                console.log('Max Retries breached. error: ' + error)
                reject(null);
            }
        }
    }, delay));
}

// const summariseGemini = async () => {
//     let res = [];
//     for(let i=0; i<10; i++){
//         let eachResult = await backoff(() => gemini.generateForEachItem(items[i]), 0, 100);
//         if(eachResult !== null){
//             res.push(eachResult);
//         }
//     }
//     console.log(res)
// }

// const MAX_RETRIES = 3; // Define this constant

// const backoff = async (execute: () => Promise<any>, retry: number, delay: number): Promise<any> => {
//     return new Promise((resolve, reject) => {
//         setTimeout(async () => {
//             try {
//                 let result = await execute();
//                 // console.log('result is ' + result);
//                 resolve(result);
//             } catch(error) {
//                 console.log(error);
//                 if(retry < MAX_RETRIES) {
//                     console.log(`Failed! ${retry+1} Retry after ${delay} ms`);
//                     resolve(backoff(execute, retry+1, delay*2));
//                 } else {
//                     console.log('Max Retries breached. error: ' + error);
//                     reject(null);
//                 }
//             }
//         }, delay);
//     });
// }

// const summariseGemini = async () => {
//     let res = [];
//     for (let i = 0; i < 3 ; i++) {
//         let eachResult = await backoff(() => gemini.generateForEachItem(items[i]), 0, 100);
//         if (eachResult !== null) {
//             const parsed = JSON.parse(eachResult);
//             // delete parsed.title;
//             res.push(parsed);
//         }
//     }
//     console.log(res);
// }


