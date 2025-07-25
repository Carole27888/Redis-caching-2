import express from "express"
import restaurantsRouter from "./routes/restaurants.js"
import cuisinesRouter from "./routes/cuisines.js"
import { errorHandler } from "./middlewares/errorHandler.js"
import "./cron/clearCache.js"
import { connectToMongoDB } from "./redis-utils/db.js"

const PORT = process.env.PORT || 3000
const app = express();
app.use(express.json())
app.use("/restaurants", restaurantsRouter)
app.use("/cuisines", cuisinesRouter)

app.use(errorHandler)

await connectToMongoDB()
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
}).on("error", (err) => {
    throw new Error(err.message)
    
})

