import { z } from 'zod';

export const UserCreateDTOSchema = z.object({
  authUserId: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type UserCreateDTO = z.infer<typeof UserCreateDTOSchema>;

export const UserUpdateDTOSchema = UserCreateDTOSchema.omit({ authUserId: true }).partial();
