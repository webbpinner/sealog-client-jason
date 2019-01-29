import createHistory from 'history/createBrowserHistory';
import { ROOT_PATH } from './client_config';

const history = createHistory({basename: ROOT_PATH})

export default history 
