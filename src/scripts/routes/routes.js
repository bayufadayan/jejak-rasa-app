import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import StoryDetailPage from '../pages/detail/story-detail-page.js';
import LoginPage from '../pages/auth/login/login-page';
import RegisterPage from '../pages/auth/register/register-page';
import { checkAuthenticatedRoute, checkUnauthenticatedRouteOnly } from '../utils/auth.js';

const routes = {
  '/login': () => checkUnauthenticatedRouteOnly(new LoginPage()),
  '/register': () => checkUnauthenticatedRouteOnly(new RegisterPage()),

  '/': () => checkAuthenticatedRoute(new HomePage()),
  '/about': () => checkAuthenticatedRoute(new AboutPage()),
  '/story/:id': () => checkAuthenticatedRoute(new StoryDetailPage()),
};

export default routes;
