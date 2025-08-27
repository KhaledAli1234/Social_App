import { compare, hash } from "bcrypt";

export const generatHash = async (
  plainText: string,
  saltRound: number = Number(process.env.SALT)
): Promise<string> => {
  return await hash(plainText, saltRound);
};

export const compareHash = async (
  plainText: string,
  hash: string
): Promise<boolean> => {
  return await compare(plainText, hash);
};
