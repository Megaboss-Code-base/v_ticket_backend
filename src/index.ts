import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import logger  from 'morgan';
import helmet  from 'helmet';
import dotenv from "dotenv"

import { port}  from './config';
import sequelize from './config';
import eventRouter from './routes/event.route';

dotenv.config()



const app: Application = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(helmet());
app.use(cors())

app.use('/api/v1/events', eventRouter)
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    await sequelize.sync();
    console.log('Models synchronized with database');

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error:any) {
    console.error('Error starting server:', error.message);
    process.exit(1);
  }
}

startServer()