import { z } from 'zod';

export const UserCreateDTOSchema = z.object({
  password: z.string().min(6).max(30),
  name: z.string().min(3).max(100),
  email: z.email(),
});

export type UserCreateDTO = z.infer<typeof UserCreateDTOSchema>;

export const UserLoginDTOSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type UserLoginDTO = z.infer<typeof UserLoginDTOSchema>;

export const AccessTokenSchema = z.object({
  accessToken: z.string(),
});
