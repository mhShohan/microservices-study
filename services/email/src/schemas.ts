import { z } from 'zod';

// sender    String
//   recipient String
//   subject   String
//   body      String
//   source    String
//   sentAt    DateTime @default(now())

export const CreateEmailDTOSchema = z.object({
  sender: z.string().optional(),
  recipient: z.string(),
  subject: z.string(),
  body: z.string(),
  source: z.string(),
});
