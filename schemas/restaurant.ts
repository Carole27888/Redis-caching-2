import { z } from "zod";

export const RestaurantsSchema =    z.object({
    name: z.string().min(1),
    location: z.string().min(1),
    cuisines: z.array(z.string()).min(1),
    
})

export const RestarauntDetailsSchema = z.object({
    links: z.array(z.object({
        
        name: z.string().min(1),
        url: z.string().min(1)
    })),
    contact: z.object({
        phone: z.string().min(1),
        email: z.string().min(1)
    }),
})

export type Restaurants = z.infer<typeof RestaurantsSchema>;
export type RestarauntDetails = z.infer<typeof RestarauntDetailsSchema>;