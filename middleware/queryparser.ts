import { NextFunction, Request, Response } from "express";

export const queryParser = (req: Request, res: Response, next:NextFunction) => {
  const parseQuery = (query) => {
    const parsed = {};
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        let value = query[key];
        if (typeof value === "string" && value.includes(",")) {
          value = value.split(",").map((v) => v.trim());
        } else if (value === "true") {
          value = true;
        } else if (value === "false") {
          value = false;
        } else if (!isNaN(value) && value !== "") {
          value = parseFloat(value);
        }
        parsed[key] = value;
      }
    }
    return parsed;
  };

  req.query = parseQuery(req.query);
  next();
};

