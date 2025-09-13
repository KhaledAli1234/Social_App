import { z } from "zod";
import { likePost } from "./post.validation";

export type ILikePostQueryInputsDTO = z.Infer<typeof likePost.query>;
