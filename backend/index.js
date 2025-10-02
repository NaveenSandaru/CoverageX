//import libraries
import express, {json} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

//import endpoint routers
import authRouter from './auth-routes/user-auth-route.js';
import appointmentHistoryRouter from './routes/appointment-history-routes.js';
import appointmentsRouter from './routes/appointments-routes.js';
import clientRouter from './routes/client-routes.js';
import clientUserQuestionsRouter from './routes/client-user-questions-routes.js';
import emailVerificationRouter from './routes/email-verification-routes.js';
import ratingsRouter from './routes/ratings-routes.js';
import reviewsRouter from './routes/reviews-routes.js';
import securityQuestionsRouter from './routes/security-questions-routes.js';
import serviceProviderEmailVerificationRouter from './routes/service-provider-email-verification-routes.js';
import serviceProviderQuestionsRouter from './routes/service-provider-questions-routes.js';
import serviceProviderRouter from './routes/service-provider-routes.js'; 
import photoRouter from './routes/photos-routes.js';
import servicesRouter from './routes/services-routes.js';
import adminRouter from './routes/admin-routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {credentials: true, origin: 'http://localhost:3000'};

app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

//configure routers to redirect to endpoints
app.use('/auth', authRouter);
app.use('/clients', clientRouter);
app.use('/service-providers', serviceProviderRouter);
app.use('/email-verification', emailVerificationRouter);
app.use('/service-provider-email-verification', serviceProviderEmailVerificationRouter);
app.use('/appointments', appointmentsRouter);
app.use('/appointment-history', appointmentHistoryRouter);
app.use('/ratings', ratingsRouter);
app.use('/reviews', reviewsRouter);
app.use('/security-questions', securityQuestionsRouter);
app.use('/client-user-questions', clientUserQuestionsRouter);
app.use('/service-provider-questions', serviceProviderQuestionsRouter);
app.use('/services',servicesRouter);
app.use('/photos',photoRouter);
app.use('/admins',adminRouter);

app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));